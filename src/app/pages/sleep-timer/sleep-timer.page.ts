import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
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
} from '@ionic/angular/standalone';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-sleep-timer',
  templateUrl: './sleep-timer.page.html',
  styleUrls: ['./sleep-timer.page.scss'],
  imports: [
    CommonModule,
    IonContent,
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SleepTimerPage implements OnInit, OnDestroy {
  private timerService = inject(TimerService);
  private router = inject(Router);

  // Input values
  hours = signal<number>(0);
  minutes = signal<number>(30);
  seconds = signal<number>(0);

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
    const totalSeconds =
      this.hours() * 3600 + this.minutes() * 60 + this.seconds();
    return totalSeconds > 0 && !this.isRunning();
  });

  canPause = computed(() => this.isRunning() && !this.isPaused());
  canReset = computed(
    () => this.isRunning() || this.isPaused() || this.remainingSeconds() > 0
  );

  ngOnInit(): void {
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

  async startTimer(): Promise<void> {
    try {
      const totalSeconds =
        this.hours() * 3600 + this.minutes() * 60 + this.seconds();

      if (totalSeconds <= 0) {
        this.inputError.set('Please set a timer duration');
        return;
      }

      await this.timerService.setTimer(
        this.hours(),
        this.minutes(),
        this.seconds()
      );
      this.timerService.startTimer();
      this.clearError();
    } catch (error) {
      this.inputError.set('Failed to start timer');
      console.error('Timer start error:', error);
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
