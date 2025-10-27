import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { App } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { ThemeService } from './services/theme.service';
import {
  AppUpdate,
  AppUpdateAvailability,
} from '@capawesome/capacitor-app-update';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  // Initialize theme service (will auto-load saved theme)
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private modalController = inject(ModalController);
  private backButtonListener?: PluginListenerHandle;

  constructor() {}

  ngOnInit(): void {
    this.checkForUpdate();
    this.setupBackButtonHandler();
  }

  ngOnDestroy(): void {
    this.backButtonListener?.remove();
  }

  private async setupBackButtonHandler(): Promise<void> {
    // Handle Android hardware back button
    App.addListener('backButton', async ({ canGoBack }) => {
      // Check if there's a modal open
      const modal = await this.modalController.getTop();
      if (modal) {
        // Close the modal
        await modal.dismiss();
        return;
      }

      const currentUrl = this.router.url;

      // If on home page, minimize the app
      if (currentUrl === '/home' || currentUrl === '/') {
        App.minimizeApp();
      } else if (canGoBack) {
        // Otherwise, navigate back
        window.history.back();
      }
    }).then((listener) => {
      this.backButtonListener = listener;
    });
  }

  private async checkForUpdate(): Promise<void> {
    try {
      const result = await AppUpdate.getAppUpdateInfo();

      if (
        result.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE
      ) {
        if (result.immediateUpdateAllowed) {
          await AppUpdate.performImmediateUpdate();
        }
      }
    } catch (err) {
      console.error('Error checking for app update:', err);
    }
  }
}
