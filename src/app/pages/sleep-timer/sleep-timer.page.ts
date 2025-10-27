import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonInput,
  IonButton,
  IonIcon,
  IonCard,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonItem,
  IonText,
  IonBackButton,
  IonButtons,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { TimerService } from '../../services/timer.service';
import { SmartTimerMonitorService } from '../../services/smart-timer-monitor.service';
import { TimerMode, SmartTimerConfig } from '../../types/smart-timer.types';

@Component({
  selector: 'app-sleep-timer',
  templateUrl: './sleep-timer.page.html',
  styleUrls: ['./sleep-timer.page.scss'],
  imports: [
    CommonModule,
    IonInput,
    IonIcon,
    IonCard,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonText,
    IonButton,
    IonSegment,
    IonSegmentButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SleepTimerPage implements OnInit, OnDestroy {
  private timerService = inject(TimerService);
  private smartTimerMonitor = inject(SmartTimerMonitorService);
  private router = inject(Router);
  #destroyRef = inject(DestroyRef);

  // Smart timer mode
  selectedMode = signal<TimerMode>('manual');

  // Input values for manual timer
  hours = signal<number>(0);
  minutes = signal<number>(30);
  seconds = signal<number>(0);

  // Input values for inactivity timer
  inactivityHours = signal<number>(0);
  inactivityMinutes = signal<number>(10);
  inactivitySeconds = signal<number>(0);

  // Timer state
  timerState = this.timerService.timerState;
  isRunning = this.timerService.isRunning;
  isPaused = this.timerService.isPaused;
  remainingSeconds = this.timerService.remainingSeconds;
  displayTime = this.timerService.displayTime;
  progressPercentage = this.timerService.progressPercentage;

  // UI state
  showCompletionMessage = signal<boolean>(false);
  inputError = signal<string>('');

  // Computed properties
  canStart = computed(() => {
    if (this.isRunning()) return false;

    const mode = this.selectedMode();
    if (mode === 'manual') {
      const totalSeconds =
        this.hours() * 3600 + this.minutes() * 60 + this.seconds();
      return totalSeconds > 0;
    } else if (mode === 'inactivity') {
      const totalSeconds =
        this.inactivityHours() * 3600 +
        this.inactivityMinutes() * 60 +
        this.inactivitySeconds();
      return totalSeconds > 0;
    }

    return true;
  });

  canPause = computed(() => this.isRunning() && !this.isPaused());
  canReset = computed(
    () => this.isRunning() || this.isPaused() || this.remainingSeconds() > 0
  );

  // Mode display information
  modeInfo = computed(() => {
    const mode = this.selectedMode();
    switch (mode) {
      case 'manual':
        return {
          title: 'Manual Timer',
          description: 'Set a specific duration',
          icon: 'time-outline',
        };
      case 'inactivity':
        return {
          title: 'Inactivity Timeout',
          description: 'Stop when device is inactive (screen off/locked)',
          icon: 'moon-outline',
        };
    }
  });

  ngOnInit(): void {
    // Load saved config
    const config = this.smartTimerMonitor.config();
    this.selectedMode.set(config.mode);

    if (config.mode === 'manual' && config.manualTimer) {
      this.hours.set(config.manualTimer.hours);
      this.minutes.set(config.manualTimer.minutes);
      this.seconds.set(config.manualTimer.seconds);
    } else if (config.mode === 'inactivity' && config.inactivityTimeout) {
      // Convert minutes back to hours/minutes/seconds
      const totalMinutes = config.inactivityTimeout.minutes;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.floor(totalMinutes % 60);
      const seconds = Math.round((totalMinutes % 1) * 60);

      this.inactivityHours.set(hours);
      this.inactivityMinutes.set(minutes);
      this.inactivitySeconds.set(seconds);
    }

    // If timer is already running, show current state
    if (this.timerService.isRunning()) {
      this.hours.set(Math.floor(this.timerService.remainingSeconds() / 3600));
      this.minutes.set(
        Math.floor((this.timerService.remainingSeconds() % 3600) / 60)
      );
      this.seconds.set(this.timerService.remainingSeconds() % 60);
    }
  }

  ngOnDestroy(): void {
    // Timer service handles its own cleanup
  }

  onHoursChange(event: any): void {
    const value = parseInt(event.target.value) || 0;
    this.hours.set(Math.max(0, Math.min(23, value)));
    this.clearError();
  }

  onMinutesChange(event: any): void {
    const value = parseInt(event.target.value) || 0;
    this.minutes.set(Math.max(0, Math.min(59, value)));
    this.clearError();
  }

  onSecondsChange(event: any): void {
    const value = parseInt(event.target.value) || 0;
    this.seconds.set(Math.max(0, Math.min(59, value)));
    this.clearError();
  }

  onInactivityHoursChange(event: any): void {
    const value = parseInt(event.target.value) || 0;
    this.inactivityHours.set(Math.max(0, Math.min(23, value)));
    this.clearError();
  }

  onInactivityMinutesChange(event: any): void {
    const value = parseInt(event.target.value) || 0;
    this.inactivityMinutes.set(Math.max(0, Math.min(59, value)));
    this.clearError();
  }

  onInactivitySecondsChange(event: any): void {
    const value = parseInt(event.target.value) || 0;
    this.inactivitySeconds.set(Math.max(0, Math.min(59, value)));
    this.clearError();
  }

  onModeChange(event: any): void {
    const mode = event.detail.value as TimerMode;
    this.selectedMode.set(mode);
    this.clearError();
  }

  startTimer(): void {
    const mode = this.selectedMode();
    let config: SmartTimerConfig;

    switch (mode) {
      case 'manual':
        const totalSeconds =
          this.hours() * 3600 + this.minutes() * 60 + this.seconds();

        if (totalSeconds <= 0) {
          this.inputError.set('Please set a timer duration');
          return;
        }

        config = {
          mode: 'manual',
          manualTimer: {
            hours: this.hours(),
            minutes: this.minutes(),
            seconds: this.seconds(),
          },
        };
        break;

      case 'inactivity':
        // Convert hours/minutes/seconds to total minutes (with decimals for seconds)
        const totalMinutes =
          this.inactivityHours() * 60 +
          this.inactivityMinutes() +
          this.inactivitySeconds() / 60;

        if (totalMinutes <= 0) {
          this.inputError.set('Please set an inactivity duration');
          return;
        }

        config = {
          mode: 'inactivity',
          inactivityTimeout: {
            minutes: totalMinutes,
          },
        };
        break;
    }

    // Save config
    this.smartTimerMonitor.updateConfig(config);

    // Start timer (only for manual mode)
    if (mode === 'manual') {
      this.timerService
        .setTimer(this.hours(), this.minutes(), this.seconds())
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe({
          next: () => {
            this.timerService.startTimer();
            this.clearError();
          },
          error: (error) => {
            this.inputError.set('Failed to start timer');
            console.error('Timer start error:', error);
          },
        });
    } else {
      // For smart timers, start immediately with a long duration
      // The actual stop will be triggered by the monitor
      this.timerService
        .setTimer(23, 59, 59)
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe({
          next: () => {
            this.timerService.startTimer();
            this.clearError();
          },
          error: (error) => {
            this.inputError.set('Failed to start timer');
            console.error('Timer start error:', error);
          },
        });
    }
  }

  pauseTimer(): void {
    this.timerService.pauseTimer();
  }

  resumeTimer(): void {
    this.timerService.startTimer();
  }

  resetTimer(): void {
    this.timerService.resetTimer();
    this.hours.set(0);
    this.minutes.set(30);
    this.seconds.set(0);
    this.clearError();
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  private clearError(): void {
    this.inputError.set('');
  }

  // Handle timer completion
  onTimerComplete(): void {
    this.showCompletionMessage.set(true);

    // Hide message after 3 seconds
    setTimeout(() => {
      this.showCompletionMessage.set(false);
    }, 3000);
  }
}
