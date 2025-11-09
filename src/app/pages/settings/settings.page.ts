import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  input,
  isDevMode,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonToggle } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { ThemeService } from '../../services/theme.service';
import { InAppPurchaseService } from '../../services/in-app-purchase.service';
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
  private inAppPurchaseService = inject(InAppPurchaseService);

  isHeaderScrolled = input<boolean>(false);

  // Computed signal for theme state
  isDarkMode = computed(() => this.themeService.currentTheme() === 'dark');

  // Premium unlock status
  isPremiumUnlocked = this.inAppPurchaseService.isPremiumUnlocked;

  // Development mode check
  readonly isDevelopment = isDevMode();

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

  /**
   * Purchase premium access
   * Initiates the Google Play Store purchase flow
   */
  purchasePremium(): void {
    this.inAppPurchaseService.purchasePremium();
  }

  /**
   * Restore previous purchases
   * Useful after reinstalling the app or switching devices
   */
  restorePurchases(): void {
    this.inAppPurchaseService.restorePurchases();
  }

  /**
   * Reset premium storage (development only)
   * Removes the premium flag from storage
   */
  resetPremiumStorage(): void {
    this.inAppPurchaseService.resetPremiumStorage();
  }
}
