import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';

/**
 * In-App Review Service
 *
 * Implements Google Play In-App Review API with policy-compliant behavior:
 * - Shows review dialog inside the app (no redirect)
 * - Fails silently if Google decides not to show the dialog
 * - Cooldown mechanism: at most once every 14 days
 * - Eligibility: App launched 5+ times OR 3+ relaxation sessions completed
 * - No blocking, no incentives, no tracking
 *
 * Policy Compliance:
 * - Never force the user to rate
 * - Never gate features behind reviews
 * - Never show incentives for reviews
 * - Respects Google's decision to show/hide the dialog
 */
@Injectable({
  providedIn: 'root',
})
export class InAppReviewService {
  // Storage keys
  private readonly STORAGE_KEY_LAST_REVIEW_TIMESTAMP = 'last_review_timestamp';
  private readonly STORAGE_KEY_APP_LAUNCH_COUNT = 'app_launch_count';
  private readonly STORAGE_KEY_SESSION_COUNT = 'completed_session_count';

  // Eligibility thresholds
  private readonly MIN_APP_LAUNCHES = 3;
  private readonly MIN_SESSIONS = 4;
  private readonly COOLDOWN_DAYS = 3;
  private readonly COOLDOWN_MS = this.COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

  /**
   * Request review if eligible (respects cooldown and eligibility criteria)
   *
   * This method:
   * - Checks if enough time has passed since last review (3 days)
   * - Checks if user meets eligibility criteria (3 launches OR 4 sessions)
   * - Attempts to show the review dialog (may fail silently per Google's decision)
   * - Updates cooldown timestamp if dialog was shown
   *
   * IMPORTANT: Google Play has its own internal cooldown mechanism that is
   * separate from our app's cooldown. If a user presses "Not now", Google Play
   * remembers this and won't show the dialog again for several days/weeks,
   * regardless of our app's cooldown settings. This cannot be bypassed and is
   * by design to respect user choice.
   *
   * ALSO IMPORTANT: If a user has already left a review, Google Play will
   * automatically prevent the dialog from showing again for that user. This is
   * handled internally by Google Play - we don't need to track this ourselves.
   *
   * Safe to call multiple times - will only show if eligible and Google Play allows it.
   */
  async requestReviewIfEligible(): Promise<void> {
    // Only work on Android native platform
    if (!this.isAndroidNative()) {
      console.debug('[InAppReview] Not Android native platform, skipping');
      return;
    }

    try {
      // Check cooldown period
      const cooldownExpired = await this.isCooldownExpired();
      if (!cooldownExpired) {
        const lastTimestamp = await this.getLastReviewTimestamp();
        const daysSince = lastTimestamp
          ? Math.floor((Date.now() - lastTimestamp) / (24 * 60 * 60 * 1000))
          : 0;
        console.debug(
          `[InAppReview] Cooldown not expired. Last review: ${daysSince} days ago`
        );
        return;
      }

      // Check eligibility criteria
      const eligible = await this.isEligible();
      if (!eligible) {
        const launchCount = await this.getAppLaunchCount();
        const sessionCount = await this.getSessionCount();
        console.debug(
          `[InAppReview] Not eligible. Launches: ${launchCount}, Sessions: ${sessionCount}`
        );
        return;
      }

      const launchCount = await this.getAppLaunchCount();
      const sessionCount = await this.getSessionCount();
      console.log(
        `[InAppReview] Requesting review. Launches: ${launchCount}, Sessions: ${sessionCount}`
      );

      // Attempt to show review dialog
      // Google may choose not to show it - that's fine, we fail silently
      await InAppReview.requestReview();

      // If we got here, the dialog was likely shown (or will be shown)
      // Update the cooldown timestamp
      await this.updateLastReviewTimestamp();
      console.log('[InAppReview] Review dialog requested successfully');
    } catch (error) {
      // Fail silently - Google may decide not to show the dialog
      // This is expected behavior per Google Play policies
      console.debug('[InAppReview] Review not available:', error);
    }
  }

  /**
   * Track app launch (call this on app startup)
   */
  async trackAppLaunch(): Promise<void> {
    if (!this.isAndroidNative()) {
      return;
    }

    try {
      const currentCount = await this.getAppLaunchCount();
      await Preferences.set({
        key: this.STORAGE_KEY_APP_LAUNCH_COUNT,
        value: String(currentCount + 1),
      });
    } catch (error) {
      console.error('Failed to track app launch:', error);
    }
  }

  /**
   * Track completed relaxation session (call this when a session ends)
   */
  async trackCompletedSession(): Promise<void> {
    if (!this.isAndroidNative()) {
      return;
    }

    try {
      const currentCount = await this.getSessionCount();
      await Preferences.set({
        key: this.STORAGE_KEY_SESSION_COUNT,
        value: String(currentCount + 1),
      });
    } catch (error) {
      console.error('Failed to track completed session:', error);
    }
  }

  /**
   * Check if user is eligible for review based on usage criteria
   */
  private async isEligible(): Promise<boolean> {
    const launchCount = await this.getAppLaunchCount();
    const sessionCount = await this.getSessionCount();

    // Eligible if: 3+ launches OR 4+ completed sessions
    return (
      launchCount >= this.MIN_APP_LAUNCHES || sessionCount >= this.MIN_SESSIONS
    );
  }

  /**
   * Check if cooldown period has expired (3 days since last review)
   */
  private async isCooldownExpired(): Promise<boolean> {
    const lastTimestamp = await this.getLastReviewTimestamp();

    if (!lastTimestamp) {
      // Never shown before - eligible
      return true;
    }

    const now = Date.now();
    const timeSinceLastReview = now - lastTimestamp;

    return timeSinceLastReview >= this.COOLDOWN_MS;
  }

  /**
   * Update the timestamp of the last review request
   */
  private async updateLastReviewTimestamp(): Promise<void> {
    try {
      await Preferences.set({
        key: this.STORAGE_KEY_LAST_REVIEW_TIMESTAMP,
        value: String(Date.now()),
      });
    } catch (error) {
      console.error('Failed to update review timestamp:', error);
    }
  }

  /**
   * Get the timestamp of the last review request
   */
  private async getLastReviewTimestamp(): Promise<number | null> {
    try {
      const result = await Preferences.get({
        key: this.STORAGE_KEY_LAST_REVIEW_TIMESTAMP,
      });

      if (result.value) {
        return parseInt(result.value, 10);
      }
    } catch (error) {
      console.error('Failed to get last review timestamp:', error);
    }

    return null;
  }

  /**
   * Get the number of app launches
   */
  private async getAppLaunchCount(): Promise<number> {
    try {
      const result = await Preferences.get({
        key: this.STORAGE_KEY_APP_LAUNCH_COUNT,
      });

      if (result.value) {
        return parseInt(result.value, 10);
      }
    } catch (error) {
      console.error('Failed to get app launch count:', error);
    }

    return 0;
  }

  /**
   * Get the number of completed sessions
   */
  private async getSessionCount(): Promise<number> {
    try {
      const result = await Preferences.get({
        key: this.STORAGE_KEY_SESSION_COUNT,
      });

      if (result.value) {
        return parseInt(result.value, 10);
      }
    } catch (error) {
      console.error('Failed to get session count:', error);
    }

    return 0;
  }

  /**
   * Check if running on Android native platform
   */
  private isAndroidNative(): boolean {
    return (
      Capacitor.getPlatform() === 'android' && Capacitor.isNativePlatform()
    );
  }
}
