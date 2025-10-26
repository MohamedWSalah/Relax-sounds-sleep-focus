import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { SleepStatisticsService } from '../../services/sleep-statistics.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-sleep-statistics-modal',
  imports: [CommonModule, IonIcon, IonButton],
  templateUrl: './sleep-statistics-modal.component.html',
  styleUrls: ['./sleep-statistics-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SleepStatisticsModalComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('chartCanvas', { static: false })
  chartCanvas!: ElementRef<HTMLCanvasElement>;

  private modalController = inject(ModalController);
  private sleepStats = inject(SleepStatisticsService);

  last7Days = this.sleepStats.last7Days;
  totalWeekSleep = this.sleepStats.totalWeekSleep;
  totalAllTime = this.sleepStats.totalAllTime;

  // Animated values for counting effect
  animatedWeekHours = signal(0);
  animatedWeekMinutes = signal(0);
  animatedAllTimeHours = signal(0);
  animatedAllTimeMinutes = signal(0);

  private chart?: Chart;
  private animationFrameId?: number;

  ngOnInit() {
    // Component initialization
  }

  ngAfterViewInit() {
    // Start counting animations
    this.animateCounters();

    // Create chart after view is initialized
    setTimeout(() => {
      this.createChart();
    }, 100);
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private animateCounters(): void {
    const targetWeekHours = this.totalWeekSleep().hours;
    const targetWeekMinutes = this.totalWeekSleep().minutes;
    const targetAllTimeHours = this.totalAllTime().hours;
    const targetAllTimeMinutes = this.totalAllTime().minutes;

    const duration = 2500; // 2 seconds animation (slower)
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutCubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      // Animate weekly totals
      this.animatedWeekHours.set(Math.floor(targetWeekHours * eased));
      this.animatedWeekMinutes.set(Math.floor(targetWeekMinutes * eased));

      // Animate all-time totals
      this.animatedAllTimeHours.set(Math.floor(targetAllTimeHours * eased));
      this.animatedAllTimeMinutes.set(Math.floor(targetAllTimeMinutes * eased));

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Ensure final values are exact
        this.animatedWeekHours.set(targetWeekHours);
        this.animatedWeekMinutes.set(targetWeekMinutes);
        this.animatedAllTimeHours.set(targetAllTimeHours);
        this.animatedAllTimeMinutes.set(targetAllTimeMinutes);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private createChart() {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.last7Days();
    const labels = data.map((d) => this.sleepStats.getDayLabel(d.date));
    const durations = data.map((d) => d.seconds / 3600); // Convert seconds to hours

    // Get theme colors
    const isDarkMode = document.body.classList.contains('dark');
    const primaryColor = isDarkMode
      ? 'rgba(111, 255, 233, 0.8)'
      : 'rgba(61, 139, 138, 0.8)';
    const primaryGradientStart = isDarkMode
      ? 'rgba(111, 255, 233, 0.6)'
      : 'rgba(61, 139, 138, 0.6)';
    const primaryGradientEnd = isDarkMode
      ? 'rgba(111, 255, 233, 0.1)'
      : 'rgba(61, 139, 138, 0.1)';
    const textColor = isDarkMode
      ? 'rgba(255, 255, 255, 0.8)'
      : 'rgba(0, 0, 0, 0.8)';
    const gridColor = isDarkMode
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.1)';

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, primaryGradientStart);
    gradient.addColorStop(1, primaryGradientEnd);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Listening Time (hours)',
            data: durations,
            backgroundColor: gradient,
            borderColor: primaryColor,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart',
          delay: (context) => {
            return context.dataIndex * 100; // Stagger animation
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: isDarkMode
              ? 'rgba(26, 32, 44, 0.95)'
              : 'rgba(249, 250, 251, 0.95)',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: primaryColor,
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                if (value === null) return '0h 0m';
                const hours = Math.floor(value);
                const minutes = Math.round((value - hours) * 60);
                return `${hours}h ${minutes}m`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              callback: (value) => `${value}h`,
            },
            grid: {
              color: gridColor,
              drawTicks: false,
            },
            border: {
              display: false,
            },
          },
          x: {
            ticks: {
              color: textColor,
            },
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
          },
        },
      },
    });
  }

  close() {
    this.modalController.dismiss();
  }
}
