import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonToggle } from '@ionic/angular/standalone';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, IonIcon, IonToggle],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private themeService = inject(ThemeService);

  // Computed signal for theme state
  isDarkMode = computed(() => this.themeService.currentTheme() === 'dark');

  /**
   * Toggle theme between light and dark
   */
  toggleTheme(event: CustomEvent): void {
    const isChecked = event.detail.checked;
    this.themeService.setTheme(isChecked ? 'dark' : 'light');
  }
}
