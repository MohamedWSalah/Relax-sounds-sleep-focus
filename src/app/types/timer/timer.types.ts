/**
 * Timer state interface for tracking timer status and time.
 */
export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  startTime: number | null;
  pausedAt: number | null;
}

