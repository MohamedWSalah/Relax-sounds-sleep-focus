import { Injectable, signal, computed, inject } from '@angular/core';
import { SoundsService } from './sounds.service';

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  startTime: number | null;
  pausedAt: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private soundsService = inject(SoundsService);

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
    this.loadTimerState();
  }

  async setTimer(
    hours: number,
    minutes: number,
    seconds: number
  ): Promise<void> {
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

    await this.saveTimerState();
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
    this.saveTimerState();
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
    }, 100);
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

  private async onTimerComplete(): Promise<void> {
    this.stopCountdown();

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

    await this.saveTimerState();

    // Show completion message (this could be handled by the component)
    // For now, we'll just log it
    console.log('Timer completed! Sweet dreams 🌙');
  }

  private async saveTimerState(): Promise<void> {
    try {
      const state = this.#timerState();
      localStorage.setItem('timerState', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save timer state:', error);
    }
  }

  private async loadTimerState(): Promise<void> {
    try {
      const stored = localStorage.getItem('timerState');
      if (stored) {
        const state: TimerState = JSON.parse(stored);

        // Only restore if timer was running and not completed
        if (state.isRunning && state.remainingSeconds > 0) {
          const now = Date.now();
          const elapsed = Math.floor((now - (state.startTime || now)) / 1000);
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
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }
}
