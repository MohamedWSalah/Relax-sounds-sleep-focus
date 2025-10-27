import { Injectable, signal, computed, inject } from '@angular/core';
import { App, AppState } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import {
  SmartTimerConfig,
  SmartTimerState,
  TimerMode,
} from '../types/smart-timer.types';
import { ToastControllerService } from './toast.service';
import { Observable, of, from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import ScreenStateListener from '../plugins/screen-state-listener';

@Injectable({
  providedIn: 'root',
})
export class SmartTimerMonitorService {
  #toastService = inject(ToastControllerService);

  #state = signal<SmartTimerState>({
    config: {
      mode: 'manual',
      manualTimer: { hours: 0, minutes: 30, seconds: 0 },
    },
    isActive: false,
    lastActivityTime: Date.now(),
  });

  #monitorIntervalId: number | null = null;
  #listeners: PluginListenerHandle[] = [];

  // Public computed signals
  config = computed(() => this.#state().config);
  isActive = computed(() => this.#state().isActive);
  currentMode = computed(() => this.#state().config.mode);

  constructor() {
    this.loadConfig();
  }

  /**
   * Load saved configuration from localStorage
   */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('smartTimerConfig');
      if (saved) {
        const config: SmartTimerConfig = JSON.parse(saved);
        this.#state.set({
          ...this.#state(),
          config,
        });
      }
    } catch (error) {
      console.error('Failed to load smart timer config:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      const config = this.#state().config;
      localStorage.setItem('smartTimerConfig', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save smart timer config:', error);
    }
  }

  /**
   * Update timer configuration
   */
  updateConfig(config: SmartTimerConfig): void {
    this.#state.set({
      ...this.#state(),
      config,
    });
    this.saveConfig();
  }

  /**
   * Start monitoring stop conditions
   */
  startMonitoring(onStopCallback: (reason: string) => void): Observable<void> {
    this.#state.set({
      ...this.#state(),
      isActive: true,
      lastActivityTime: Date.now(),
    });

    const mode = this.#state().config.mode;

    // Set up mode-specific monitoring
    switch (mode) {
      case 'manual':
        // Manual timer is handled by TimerService
        return of(undefined);

      case 'inactivity':
        return this.setupInactivityMonitoring(onStopCallback);

      default:
        return of(undefined);
    }
  }

  /**
   * Stop all monitoring
   */
  stopMonitoring(): void {
    this.#state.set({
      ...this.#state(),
      isActive: false,
    });

    // Clear interval
    if (this.#monitorIntervalId) {
      clearInterval(this.#monitorIntervalId);
      this.#monitorIntervalId = null;
    }

    // Stop screen state listener
    ScreenStateListener.stopListening().catch((error) => {
      console.warn('Error stopping screen state listener:', error);
    });

    // Remove all listeners
    this.#listeners.forEach((listener) => listener.remove());
    this.#listeners = [];
  }

  /**
   * Setup inactivity monitoring
   * Uses custom ScreenStateListener plugin to detect device screen on/off/unlock
   * Tracks true device inactivity (screen off, not just app in background)
   */
  private setupInactivityMonitoring(
    onStopCallback: (reason: string) => void
  ): Observable<void> {
    const config = this.#state().config.inactivityTimeout;
    if (!config) return of(undefined);

    const timeoutMs = config.minutes * 60 * 1000;
    let lastActiveTime = Date.now();
    let inactivityStartTime: number | null = null;
    let inactivityTimeoutId: number | null = null;

    // Update activity timestamp and cancel any pending timeout
    const updateActivity = () => {
      lastActiveTime = Date.now();
      inactivityStartTime = null;

      // Cancel any pending timeout
      if (inactivityTimeoutId !== null) {
        clearTimeout(inactivityTimeoutId);
        inactivityTimeoutId = null;
        console.log('Inactivity timer canceled - user activity detected');
      }
    };

    // Start the inactivity timeout
    const startInactivityTimeout = () => {
      // Cancel any existing timeout first
      if (inactivityTimeoutId !== null) {
        clearTimeout(inactivityTimeoutId);
      }

      inactivityStartTime = Date.now();
      console.log(
        `Starting inactivity timer - will stop in ${Math.round(
          timeoutMs / 1000
        )}s`
      );

      inactivityTimeoutId = window.setTimeout(() => {
        const actualDuration = Date.now() - (inactivityStartTime || Date.now());
        console.log(
          `Inactivity timeout reached after ${Math.round(
            actualDuration / 1000
          )}s - stopping playback`
        );

        this.stopMonitoring();

        const displayValue =
          config.minutes >= 1
            ? `${Math.round(config.minutes)} minute${
                Math.round(config.minutes) > 1 ? 's' : ''
              }`
            : `${Math.round(config.minutes * 60)} seconds`;

        onStopCallback(
          `Playback stopped due to ${displayValue} of inactivity 🌙`
        );
      }, timeoutMs);
    };

    // Start the native screen state listener
    return from(ScreenStateListener.startListening()).pipe(
      switchMap(() => {
        // Listen for screen ON events
        return from(
          ScreenStateListener.addListener('screenOn', (data) => {
            console.log('Screen turned ON', data);
            updateActivity();
          })
        );
      }),
      switchMap((screenOnListener) => {
        this.#listeners.push(screenOnListener);

        // Listen for screen OFF events
        return from(
          ScreenStateListener.addListener('screenOff', (data) => {
            console.log('Screen turned OFF', data);
            // Start the timeout when screen turns off
            startInactivityTimeout();
          })
        );
      }),
      switchMap((screenOffListener) => {
        this.#listeners.push(screenOffListener);

        // Listen for user UNLOCK events
        return from(
          ScreenStateListener.addListener('userPresent', (data) => {
            console.log('User unlocked device', data);
            updateActivity();
          })
        );
      }),
      switchMap((userPresentListener) => {
        this.#listeners.push(userPresentListener);

        // Track user activity within the app (for when screen is on)
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const events = [
            'click',
            'touchstart',
            'touchmove',
            'keydown',
            'scroll',
          ];
          events.forEach((event) => {
            document.addEventListener(event, updateActivity, { passive: true });
          });

          this.#listeners.push({
            remove: async () => {
              events.forEach((event) => {
                document.removeEventListener(event, updateActivity);
              });
            },
          });
        }

        // Add cleanup for the timeout
        this.#listeners.push({
          remove: async () => {
            if (inactivityTimeoutId !== null) {
              clearTimeout(inactivityTimeoutId);
              inactivityTimeoutId = null;
              console.log('Inactivity timeout cleared during cleanup');
            }
          },
        });

        return of(undefined);
      }),
      catchError((error) => {
        console.error('Failed to setup inactivity monitoring:', error);
        if (inactivityTimeoutId !== null) {
          clearTimeout(inactivityTimeoutId);
        }
        return of(undefined);
      })
    );
  }

  /**
   * Get default config for a given mode
   */
  getDefaultConfigForMode(mode: TimerMode): SmartTimerConfig {
    switch (mode) {
      case 'manual':
        return {
          mode: 'manual',
          manualTimer: { hours: 0, minutes: 30, seconds: 0 },
        };
      case 'inactivity':
        return {
          mode: 'inactivity',
          inactivityTimeout: { minutes: 10 },
        };
    }
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}
