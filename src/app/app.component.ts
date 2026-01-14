import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { ThemeService } from './services/theme.service';
import { InAppPurchaseService } from './services/in-app-purchase.service';
import { InAppReviewService } from './services/in-app-review.service';
import {
  AppUpdate,
  AppUpdateAvailability,
} from '@capawesome/capacitor-app-update';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private themeService = inject(ThemeService);
  private inAppPurchaseService = inject(InAppPurchaseService);
  private inAppReviewService = inject(InAppReviewService);
  private router = inject(Router);
  private modalController = inject(ModalController);
  private backButtonListener?: PluginListenerHandle;

  constructor() {}

  ngOnInit(): void {
    this.initializeServices();
    this.checkForUpdate();
    this.setupBackButtonHandler();
    this.trackAppLaunch();
  }

  private initializeServices(): void {
    // Initialize In-App Purchase service
    // Loads saved premium status and sets up the store plugin
    this.inAppPurchaseService.initialize();
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
      console.log(result);

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

  /**
   * Track app launch for in-app review eligibility
   * Called once per app startup
   * Also requests review if eligible (with delay to avoid showing immediately on launch)
   */
  private async trackAppLaunch(): Promise<void> {
    try {
      await this.inAppReviewService.trackAppLaunch();

      // Request review if eligible, but wait a few seconds after app launch
      // to avoid showing the dialog immediately when user opens the app
      setTimeout(async () => {
        try {
          await this.inAppReviewService.requestReviewIfEligible();
        } catch (error) {
          // Fail silently - review request should not break app
          console.debug('Failed to request review:', error);
        }
      }, 3000); // Wait 3 seconds after launch
    } catch (error) {
      // Fail silently - tracking should not break app startup
      console.debug('Failed to track app launch:', error);
    }
  }
}
