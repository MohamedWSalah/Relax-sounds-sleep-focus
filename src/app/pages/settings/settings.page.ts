import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonToggle } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { ThemeService } from '../../services/theme.service';
import { SleepStatisticsModalComponent } from '../../components/sleep-statistics-modal/sleep-statistics-modal.component';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, IonIcon, IonToggle],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private themeService = inject(ThemeService);
  private modalController = inject(ModalController);

  // Computed signal for theme state
  isDarkMode = computed(() => this.themeService.currentTheme() === 'dark');

  /**
   * Toggle theme between light and dark
   */
  toggleTheme(event: CustomEvent): void {
    const isChecked = event.detail.checked;
    this.themeService.setTheme(isChecked ? 'dark' : 'light');
  }

  /**
   * Open listening statistics modal
   */
  async openListeningStatistics(): Promise<void> {
    const modal = await this.modalController.create({
      component: SleepStatisticsModalComponent,
      cssClass: 'listening-stats-modal',
    });

    await modal.present();
  }
}
