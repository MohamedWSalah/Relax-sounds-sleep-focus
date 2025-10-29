import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { ToastControllerService } from './toast.service';
import { Observable, from, of, timer } from 'rxjs';
import { map, catchError, tap, switchMap, take } from 'rxjs/operators';

// Type definitions for cordova-plugin-purchase
declare const store: any;

/**
 * In-App Purchase Service
 *
 * Handles premium unlock functionality using Google Play Store billing.
 * Uses RxJS Observables for reactive, functional programming patterns.
 *
 * Features:
 * - One-time premium purchase via Google Play
 * - Local purchase state persistence with Capacitor Preferences
 * - Purchase restoration for reinstalls
 * - Offline support once unlocked
 * - Platform detection (native vs browser)
 *
 * Product ID must match the one configured in Google Play Console
 */
@Injectable({
  providedIn: 'root',
})
export class InAppPurchaseService {
  readonly #toastService = inject(ToastControllerService);

  // Configuration constants
  readonly #PRODUCT_ID = 'premium_access' as const;
  readonly #STORAGE_KEY = 'premium_unlocked' as const;
  readonly #RESTORE_CHECK_DELAY = 2000 as const;

  // Premium unlock state (reactive signal)
  readonly #isPremiumUnlocked = signal<boolean>(false);

  #isInitialized = false;

  // ==================== Public API ====================

  /**
   * Get premium unlock status as a reactive signal
   * Use this in components to reactively update UI based on premium status
   */
  get isPremiumUnlocked() {
    return this.#isPremiumUnlocked.asReadonly();
  }

  /**
   * Check if premium is unlocked (non-reactive)
   * Use this in services or when you need immediate boolean value
   */
  isPremiumUnlockedSync(): boolean {
    return this.#isPremiumUnlocked();
  }

  // ==================== Initialization ====================

  /**
   * Initialize the in-app purchase system
   * Should be called once on app startup
   *
   * Returns an Observable that:
   * - Loads saved premium status from local storage
   * - Initializes the Play Store plugin (native only)
   * - Checks for existing purchases
   */
  initialize(): Observable<boolean> {
    if (this.#isInitialized) {
      return of(true);
    }

    return this.#loadPremiumStatus().pipe(
      tap((isPremium) => {
        if (this.#isNativePlatform() && this.#isStoreAvailable()) {
          this.#initializeStore();
        }
        this.#isInitialized = true;
      }),
      map(() => true),
      catchError((error) => {
        console.error('Failed to initialize In-App Purchase:', error);
        return of(false);
      })
    );
  }

  /**
   * Initialize the cordova-plugin-purchase store
   * Registers the premium product and sets up event handlers
   * This is synchronous as it only sets up event listeners
   */
  #initializeStore(): void {
    store.verbosity = store.INFO;

    // Register the premium product as a non-consumable (one-time purchase)
    store.register({
      id: this.#PRODUCT_ID,
      type: store.NON_CONSUMABLE,
    });

    // Set up event handlers
    this.#setupStoreEventHandlers();

    // Check for existing purchases
    store.refresh();
  }

  /**
   * Set up all store event handlers for purchase lifecycle
   */
  #setupStoreEventHandlers(): void {
    // Purchase approved - finish the transaction
    store.when(this.#PRODUCT_ID).approved((product: any) => {
      product.finish();
    });

    // Purchase verified - unlock premium
    store.when(this.#PRODUCT_ID).verified(() => {
      this.#unlockPremium().subscribe();
    });

    // Product already owned - unlock premium
    store.when(this.#PRODUCT_ID).owned(() => {
      this.#unlockPremium().subscribe();
    });

    // Purchase cancelled by user
    store.when(this.#PRODUCT_ID).cancelled(() => {
      this.#toastService.presentToast('Purchase cancelled', 2000, 'bottom');
    });

    // Purchase error
    store.error((error: any) => {
      console.error('Store error:', error);
      this.#toastService.presentToast(
        'Purchase failed. Please try again.',
        2000,
        'bottom'
      );
    });
  }

  // ==================== Purchase Operations ====================

  /**
   * Initiate premium purchase through Google Play Store
   *
   * Returns an Observable that:
   * - Checks if already unlocked
   * - Validates native platform availability
   * - Initiates the purchase flow
   *
   * The actual unlock happens in the store event handlers
   */
  purchasePremium(): Observable<void> {
    // Already unlocked
    if (this.#isPremiumUnlocked()) {
      this.#toastService.presentToast(
        'You already have premium access!',
        2000,
        'bottom'
      );
      return of(undefined);
    }
    console.log(this.#isStoreAvailable());

    // Not on native platform
    if (!this.#isNativePlatform() || !this.#isStoreAvailable()) {
      this.#toastService.presentToast(
        'In-app purchases are only available on mobile devices',
        3000,
        'bottom'
      );
      return of(undefined);
    }

    // Initiate purchase flow (async, handled by store events)
    return of(undefined).pipe(
      tap(() => store.order(this.#PRODUCT_ID)),
      catchError((error) => {
        console.error('Failed to initiate purchase:', error);
        this.#toastService.presentToast(
          'Failed to start purchase. Please try again.',
          2000,
          'bottom'
        );
        return of(undefined);
      })
    );
  }

  /**
   * Restore previous purchases from Google Play Store
   *
   * Useful when:
   * - User reinstalls the app
   * - User switches devices
   * - User clears app data
   *
   * Returns an Observable that:
   * - Validates native platform
   * - Refreshes store to check owned products
   * - Shows result after delay
   */
  restorePurchases(): Observable<void> {
    // Not on native platform
    if (!this.#isNativePlatform() || !this.#isStoreAvailable()) {
      this.#toastService.presentToast(
        'Purchase restoration is only available on mobile devices',
        3000,
        'bottom'
      );
      return of(undefined);
    }

    // Show loading state
    this.#toastService.presentToast('Restoring purchases...', 2000, 'bottom');

    // Refresh store (triggers .owned() handler if purchases exist)
    return of(undefined).pipe(
      tap(() => store.refresh()),
      switchMap(() => timer(this.#RESTORE_CHECK_DELAY).pipe(take(1))),
      tap(() => {
        const message = this.#isPremiumUnlocked()
          ? 'Premium access restored!'
          : 'No previous purchases found';
        this.#toastService.presentToast(message, 2000, 'bottom');
      }),
      map(() => undefined),
      catchError((error) => {
        console.error('Failed to restore purchases:', error);
        this.#toastService.presentToast(
          'Failed to restore purchases. Please try again.',
          2000,
          'bottom'
        );
        return of(undefined);
      })
    );
  }

  // ==================== Premium Status Management ====================

  /**
   * Unlock premium access
   * Updates signal and persists to local storage
   */
  #unlockPremium(): Observable<void> {
    return this.#savePremiumStatus(true).pipe(
      tap(() => this.#isPremiumUnlocked.set(true)),
      map(() => undefined)
    );
  }

  /**
   * Save premium status to Capacitor Preferences
   * Persists across app restarts
   */
  #savePremiumStatus(status: boolean): Observable<void> {
    return from(
      Preferences.set({
        key: this.#STORAGE_KEY,
        value: status.toString(),
      })
    ).pipe(
      map(() => undefined),
      catchError((error) => {
        console.error('Failed to save premium status:', error);
        return of(undefined);
      })
    );
  }

  /**
   * Load premium status from Capacitor Preferences
   * Updates the signal with the stored value
   */
  #loadPremiumStatus(): Observable<boolean> {
    return from(Preferences.get({ key: this.#STORAGE_KEY })).pipe(
      map((result) => result.value === 'true'),
      tap((isPremium) => this.#isPremiumUnlocked.set(isPremium)),
      catchError((error) => {
        console.error('Failed to load premium status:', error);
        return of(false);
      })
    );
  }

  // ==================== Platform Detection ====================

  /**
   * Check if running on a native mobile platform
   */
  #isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Check if the cordova-plugin-purchase store is available
   */
  #isStoreAvailable(): boolean {
    return typeof store !== 'undefined';
  }

  // ==================== Development Helpers ====================

  /**
   * FOR TESTING ONLY - BROWSER DEVELOPMENT ONLY
   * Manually unlock premium without purchase
   * Blocked on native platforms to prevent production abuse
   */
  unlockPremiumForTesting(): Observable<void> {
    if (this.#isNativePlatform()) {
      console.error('⛔ Testing methods are disabled on mobile devices');
      this.#toastService.presentToast(
        'Testing methods are disabled on devices',
        2000,
        'bottom'
      );
      return of(undefined);
    }

    console.warn(
      '⚠️ TESTING: Unlocking premium without purchase (Browser only)'
    );

    return this.#unlockPremium().pipe(
      tap(() => {
        this.#toastService.presentToast(
          'Premium unlocked (TEST MODE - Browser only)',
          2000,
          'bottom'
        );
      })
    );
  }

  /**
   * FOR TESTING ONLY - BROWSER DEVELOPMENT ONLY
   * Reset premium status
   * Blocked on native platforms to prevent production abuse
   */
  resetPremiumForTesting(): Observable<void> {
    if (this.#isNativePlatform()) {
      console.error('⛔ Testing methods are disabled on mobile devices');
      this.#toastService.presentToast(
        'Testing methods are disabled on devices',
        2000,
        'bottom'
      );
      return of(undefined);
    }

    console.warn('⚠️ TESTING: Resetting premium status (Browser only)');

    return this.#savePremiumStatus(false).pipe(
      tap(() => {
        this.#isPremiumUnlocked.set(false);
        this.#toastService.presentToast(
          'Premium reset (TEST MODE - Browser only)',
          2000,
          'bottom'
        );
      })
    );
  }
}
