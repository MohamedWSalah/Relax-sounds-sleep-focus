import {
  Injectable,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SoundsService } from './sounds.service';
import { SmartTimerMonitorService } from './smart-timer-monitor.service';
import { ToastControllerService } from './toast.service';
import { Observable, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import type { TimerState } from '../types';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private soundsService = inject(SoundsService);
  private smartTimerMonitor = inject(SmartTimerMonitorService);
  private toastService = inject(ToastControllerService);
  #destroyRef = inject(DestroyRef);

  #timerState = signal<TimerState>({
    isRunning: false,
    isPaused: false,
    totalSeconds: 0,
    remainingSeconds: 0,
    startTime: null,
    pausedAt: null,
  });

  #intervalId: number | null = null;
  #timeoutId: number | null = null;

  // Public signals
  timerState = computed(() => this.#timerState());
  isRunning = computed(() => this.#timerState().isRunning);
  isPaused = computed(() => this.#timerState().isPaused);
  remainingSeconds = computed(() => this.#timerState().remainingSeconds);
  totalSeconds = computed(() => this.#timerState().totalSeconds);

  // Computed time display
  displayTime = computed(() => {
    const seconds = this.remainingSeconds();
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0'),
      formatted: `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
    };
  });

  // Progress percentage for circular timer
  progressPercentage = computed(() => {
    const total = this.totalSeconds();
    const remaining = this.remainingSeconds();
    if (total === 0) return 0;
    return ((total - remaining) / total) * 100;
  });

  constructor() {
    // For root services, subscriptions in constructor are fine since service lives for app lifetime
    // But using takeUntilDestroyed for consistency and best practices
    this.loadTimerState()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe();
  }

  setTimer(hours: number, minutes: number, seconds: number): Observable<void> {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds <= 0) {
      throw new Error('Timer duration must be greater than 0');
    }

    this.#timerState.set({
      isRunning: false,
      isPaused: false,
      totalSeconds,
      remainingSeconds: totalSeconds,
      startTime: null,
      pausedAt: null,
    });

    return this.saveTimerState();
  }

  startTimer(): void {
    const currentState = this.#timerState();

    if (currentState.remainingSeconds <= 0) {
      return;
    }

    const now = Date.now();
    let startTime = now;

    // If resuming from pause, adjust start time
    if (currentState.isPaused && currentState.pausedAt) {
      const pausedDuration = now - currentState.pausedAt;
      startTime = (currentState.startTime || now) + pausedDuration;
    }

    this.#timerState.set({
      ...currentState,
      isRunning: true,
      isPaused: false,
      startTime,
      pausedAt: null,
    });

    this.startCountdown();
    this.saveTimerState()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe();

    // Start smart timer monitoring
    this.startSmartTimerMonitoring()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe();
  }

  pauseTimer(): void {
    const currentState = this.#timerState();

    if (!currentState.isRunning) {
      return;
    }

    this.#timerState.set({
      ...currentState,
      isRunning: false,
      isPaused: true,
      pausedAt: Date.now(),
    });

    this.stopCountdown();
    this.saveTimerState();

    // Stop smart timer monitoring when paused
    this.smartTimerMonitor.stopMonitoring();
  }

  resetTimer(): void {
    const currentState = this.#timerState();

    this.#timerState.set({
      ...currentState,
      isRunning: false,
      isPaused: false,
      remainingSeconds: currentState.totalSeconds,
      startTime: null,
      pausedAt: null,
    });

    this.stopCountdown();
    this.saveTimerState();

    // Stop smart timer monitoring
    this.smartTimerMonitor.stopMonitoring();
  }

  private startCountdown(): void {
    this.stopCountdown(); // Clear any existing countdown

    this.#intervalId = window.setInterval(() => {
      const currentState = this.#timerState();

      if (!currentState.isRunning || currentState.remainingSeconds <= 0) {
        this.stopCountdown();
        return;
      }

      const now = Date.now();
      const elapsed = Math.floor(
        (now - (currentState.startTime || now)) / 1000
      );
      const newRemaining = Math.max(0, currentState.totalSeconds - elapsed);

      this.#timerState.set({
        ...currentState,
        remainingSeconds: newRemaining,
      });

      if (newRemaining <= 0) {
        this.onTimerComplete();
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }
  }

  private onTimerComplete(): void {
    this.stopCountdown();

    // Stop all sounds
    this.soundsService.stopAllSounds();

    // Stop smart timer monitoring
    this.smartTimerMonitor.stopMonitoring();

    // Reset timer state
    this.#timerState.set({
      isRunning: false,
      isPaused: false,
      totalSeconds: 0,
      remainingSeconds: 0,
      startTime: null,
      pausedAt: null,
    });

    this.saveTimerState()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe();

    // Show completion toast
    this.toastService.presentToast('Timer completed! Sweet dreams 🌙', 3000);
  }

  /**
   * Start smart timer monitoring based on current configuration
   */
  private startSmartTimerMonitoring(): Observable<void> {
    const mode = this.smartTimerMonitor.currentMode();

    // For manual mode, monitoring is not needed (handled by timer countdown)
    if (mode === 'manual') {
      return of(undefined);
    }

    // Start monitoring with callback to stop playback
    return this.smartTimerMonitor.startMonitoring((reason: string) => {
      // Stop all sounds
      this.soundsService.stopAllSounds();

      // Reset timer state
      this.#timerState.set({
        isRunning: false,
        isPaused: false,
        totalSeconds: 0,
        remainingSeconds: 0,
        startTime: null,
        pausedAt: null,
      });

      this.stopCountdown();
      this.saveTimerState()
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe();

      // Show toast with reason
      this.toastService.presentToast(reason, 4000);
    });
  }

  private saveTimerState(): Observable<void> {
    return of(undefined).pipe(
      tap(() => {
        try {
          const state = this.#timerState();
          localStorage.setItem('timerState', JSON.stringify(state));
        } catch (error) {
          console.error('Failed to save timer state:', error);
        }
      }),
      catchError((error) => {
        console.error('Failed to save timer state:', error);
        return of(undefined);
      })
    );
  }

  private loadTimerState(): Observable<void> {
    return of(undefined).pipe(
      tap(() => {
        try {
          const stored = localStorage.getItem('timerState');
          if (stored) {
            const state: TimerState = JSON.parse(stored);

            // Only restore if timer was running and not completed
            if (state.isRunning && state.remainingSeconds > 0) {
              const now = Date.now();
              const elapsed = Math.floor(
                (now - (state.startTime || now)) / 1000
              );
              const newRemaining = Math.max(0, state.totalSeconds - elapsed);

              if (newRemaining > 0) {
                this.#timerState.set({
                  ...state,
                  remainingSeconds: newRemaining,
                });
                this.startCountdown();
              } else {
                // Timer completed while app was closed
                this.onTimerComplete();
              }
            } else {
              this.#timerState.set(state);
            }
          }
        } catch (error) {
          console.error('Failed to load timer state:', error);
        }
      }),
      catchError((error) => {
        console.error('Failed to load timer state:', error);
        return of(undefined);
      })
    );
  }

  ngOnDestroy(): void {
    this.stopCountdown();
    this.smartTimerMonitor.stopMonitoring();
  }
}
