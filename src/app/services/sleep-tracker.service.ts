import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { SoundsService } from './sounds.service';
import type {
  DailyListeningData,
  ListeningStorageData,
} from '../types';

@Injectable({
  providedIn: 'root',
})
export class SleepTrackerService {
  private readonly STORAGE_KEY = 'listening_data';
  private soundsService = inject(SoundsService);

  // Track the current session time (seconds)
  #currentSessionSeconds = signal<number>(0);
  #isTracking = signal<boolean>(false);
  #trackingInterval?: number;

  // Get the stored daily data
  #dailyData = signal<DailyListeningData>(this.loadStorageData().dailyData);
  #allTimeTotal = signal<number>(this.loadStorageData().allTimeTotal);

  currentSessionSeconds = computed(() => this.#currentSessionSeconds());
  isTracking = computed(() => this.#isTracking());
  dailyData = computed(() => this.#dailyData());
  allTimeTotal = computed(() => this.#allTimeTotal());

  constructor() {
    // Set up effect to watch for playing state changes
    effect(() => {
      const isPlaying = this.soundsService.isPlaying();

      if (isPlaying) {
        this.startTracking();
      } else {
        this.stopTracking();
      }
    });
  }

  private loadStorageData(): ListeningStorageData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Handle legacy format (just dailyData object) or new format
        if (
          parsed.dailyData !== undefined &&
          parsed.allTimeTotal !== undefined
        ) {
          return parsed;
        } else {
          // Legacy format - migrate to new format
          return {
            dailyData: parsed,
            allTimeTotal: this.calculateAllTimeFromDaily(parsed),
          };
        }
      }
    } catch (error) {
      console.error('Failed to load daily listening data:', error);
    }
    return { dailyData: {}, allTimeTotal: 0 };
  }

  private calculateAllTimeFromDaily(dailyData: DailyListeningData): number {
    // Calculate all-time total from existing daily data (for migration)
    return Object.values(dailyData).reduce((sum, seconds) => sum + seconds, 0);
  }

  private saveData(): void {
    try {
      const storageData: ListeningStorageData = {
        dailyData: this.#dailyData(),
        allTimeTotal: this.#allTimeTotal(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Failed to save listening data:', error);
    }
  }

  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  private startTracking(): void {
    if (this.#isTracking()) {
      return; // Already tracking
    }

    this.#isTracking.set(true);

    // Track every second
    this.#trackingInterval = window.setInterval(() => {
      this.incrementListeningTime();
    }, 1000);
  }

  private stopTracking(): void {
    if (!this.#isTracking()) {
      return; // Not tracking
    }

    this.#isTracking.set(false);

    if (this.#trackingInterval) {
      clearInterval(this.#trackingInterval);
      this.#trackingInterval = undefined;
    }

    // Save the current session data
    this.saveCurrentSession();
  }

  private incrementListeningTime(): void {
    // Increment current session
    this.#currentSessionSeconds.update((s) => s + 1);

    // Increment today's total in daily data
    const today = this.getTodayKey();
    const currentData = this.#dailyData();
    const todaySeconds = (currentData[today] || 0) + 1;

    this.#dailyData.set({
      ...currentData,
      [today]: todaySeconds,
    });

    // Increment all-time total
    this.#allTimeTotal.update((total) => total + 1);

    // Save to localStorage periodically (every 10 seconds to reduce I/O)
    if (todaySeconds % 10 === 0) {
      this.saveData();
    }
  }

  private saveCurrentSession(): void {
    // Save any remaining unsaved data
    this.saveData();
  }

  // Get listening time for a specific date
  getListeningTimeForDate(date: string): number {
    return this.#dailyData()[date] || 0;
  }

  // Get last N days of data
  getLastNDays(days: number): { date: string; seconds: number }[] {
    const result: { date: string; seconds: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      result.push({
        date: dateKey,
        seconds: this.getListeningTimeForDate(dateKey),
      });
    }

    return result;
  }

  // Convert seconds to readable format
  formatTime(totalSeconds: number): {
    hours: number;
    minutes: number;
    seconds: number;
  } {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
  }

  // Get total listening time for the week
  getTotalWeekSeconds(): number {
    const last7Days = this.getLastNDays(7);
    return last7Days.reduce((sum, day) => sum + day.seconds, 0);
  }

  // Reset current session (useful for testing or manual reset)
  resetCurrentSession(): void {
    this.#currentSessionSeconds.set(0);
  }

  // Get all-time total in seconds
  getAllTimeTotal(): number {
    return this.#allTimeTotal();
  }

  // Clear all data (useful for testing)
  clearAllData(): void {
    this.#dailyData.set({});
    this.#allTimeTotal.set(0);
    this.#currentSessionSeconds.set(0);
    this.saveData();
  }
}
