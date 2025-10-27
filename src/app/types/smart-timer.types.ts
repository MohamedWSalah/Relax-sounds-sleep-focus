export type TimerMode = 'manual' | 'inactivity';

export interface SmartTimerConfig {
  mode: TimerMode;
  manualTimer?: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  inactivityTimeout?: {
    minutes: number;
  };
}

export interface SmartTimerState {
  config: SmartTimerConfig;
  isActive: boolean;
  lastActivityTime: number;
}
