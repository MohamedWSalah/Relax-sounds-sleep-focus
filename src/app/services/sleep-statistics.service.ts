import { Injectable, computed, inject } from '@angular/core';
import { SleepTrackerService } from './sleep-tracker.service';

@Injectable({
  providedIn: 'root',
})
export class SleepStatisticsService {
  private sleepTracker = inject(SleepTrackerService);

  // Get last 7 days of data from the tracker
  last7Days = computed(() => {
    const data = this.sleepTracker.getLastNDays(7);

    return data.map((day) => {
      const timeData = this.sleepTracker.formatTime(day.seconds);
      return {
        date: day.date,
        seconds: day.seconds,
        hours: timeData.hours,
        minutes: timeData.minutes,
      };
    });
  });

  // Total sleep time for the week
  totalWeekSleep = computed(() => {
    const totalSeconds = this.sleepTracker.getTotalWeekSeconds();
    const timeData = this.sleepTracker.formatTime(totalSeconds);

    return {
      total: totalSeconds,
      hours: timeData.hours,
      minutes: timeData.minutes,
    };
  });

  // Total listening time all-time
  totalAllTime = computed(() => {
    const totalSeconds = this.sleepTracker.getAllTimeTotal();
    const timeData = this.sleepTracker.formatTime(totalSeconds);

    return {
      total: totalSeconds,
      hours: timeData.hours,
      minutes: timeData.minutes,
    };
  });

  // Get day label (Mon, Tue, etc.)
  getDayLabel(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }
}
