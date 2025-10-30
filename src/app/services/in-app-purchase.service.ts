import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { ToastControllerService } from './toast.service';

import 'cordova-plugin-purchase';

/**
 * In-App Purchase Service
 *
 * Handles premium unlock functionality using Google Play Store billing.
 * Uses Promises for clean async/await patterns.
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
  readonly #platform = inject(Platform);

  // Configuration constants
  readonly #PRODUCT_ID = 'premium_access';
  readonly #STORAGE_KEY = 'premium_unlocked';
  readonly #RESTORE_CHECK_DELAY = 2000;

  // Premium unlock state (reactive signal)
  readonly #isPremiumUnlocked = signal<boolean>(false);
  readonly #productsLoaded = signal<boolean>(false);
  #store?: CdvPurchase.Store;

  #isInitialized = false;

  constructor() {
    // Platform initialization happens in initialize() method
  }

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
   * Returns a Promise that:
   * - Loads saved premium status from local storage
   * - Initializes the Play Store plugin (native only)
   * - Checks for existing purchases
   */
  async initialize() {
    if (this.#isInitialized) {
      return true;
    }

    try {
      // Load saved premium status
      await this.#loadPremiumStatus();

      // Wait for platform to be ready
      await this.#platform.ready();

      // Check if we're on native and CdvPurchase is available
      if (this.#isNativePlatform() && typeof CdvPurchase !== 'undefined') {
        // Assign the store
        this.#store = CdvPurchase.store;
        console.log('CdvPurchase store is available');

        // Initialize the store
        this.#initializeStore();
      }

      this.#isInitialized = true;
      console.log('Initialized in-app purchase service');
      return true;
    } catch (error) {
      console.error('Failed to initialize In-App Purchase:', error);
      return false;
    }
  }

  /**
   * Initialize the cordova-plugin-purchase store
   * Registers the premium product and sets up event handlers
   */
  #initializeStore(): void {
    if (!this.#store) {
      console.error('Store not available');
      return;
    }

    // Register the premium product as a non-consumable (one-time purchase)
    this.#store.register([
      {
        id: this.#PRODUCT_ID,
        type: CdvPurchase.ProductType.NON_CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      },
    ]);

    // Set up event handlers
    this.#setupStoreEventHandlers();

    // Initialize the store
    this.#store.initialize([CdvPurchase.Platform.GOOGLE_PLAY]);
  }

  /**
   * Set up all store event handlers for purchase lifecycle
   */
  #setupStoreEventHandlers(): void {
    if (!this.#store) {
      return;
    }

    // Setup event handlers using the when() API
    this.#store
      .when()
      .productUpdated(() => {
        console.log(
          'Products loaded from the store:',
          JSON.stringify(this.#store?.products)
        );

        // Mark products as loaded
        this.#productsLoaded.set(true);

        // Check if user already owns the premium product
        if (this.#store?.owned(this.#PRODUCT_ID)) {
          this.#unlockPremium();
        }
      })
      .approved((transaction) => {
        console.log('Purchase approved:', transaction);
        transaction.verify();
      })
      .verified((receipt) => {
        console.log('Purchase verified:', receipt);
        receipt.finish();
        this.#unlockPremium();
      })
      .finished((transaction) => {
        console.log('Purchase finished:', transaction);
      })
      .receiptUpdated((receipt) => {
        // Check if user owns the premium product
        if (this.#store?.owned(this.#PRODUCT_ID)) {
          this.#unlockPremium();
        }
      });
  }

  // ==================== Purchase Operations ====================

  /**
   * Initiate premium purchase through Google Play Store
   *
   * Returns a Promise that:
   * - Checks if already unlocked
   * - Validates native platform availability
   * - Initiates the purchase flow
   *
   * The actual unlock happens in the store event handlers
   */
  async purchasePremium(): Promise<void> {
    // Already unlocked
    if (this.#isPremiumUnlocked()) {
      this.#toastService.presentToast(
        'You already have premium access!',
        2000,
        'bottom'
      );
      return;
    }

    // Not on native platform
    if (!this.#isNativePlatform() || !this.#isStoreAvailable()) {
      this.#toastService.presentToast(
        'In-app purchases are only available on mobile devices',
        3000,
        'bottom'
      );
      return;
    }

    try {
      if (!this.#store) {
        throw new Error('Store not initialized');
      }

      const product = this.#store.get(this.#PRODUCT_ID);
      console.log('Available products:', this.#store.products);

      if (!product) {
        console.error(
          'Product not found. Available products:',
          this.#store.products
        );
        throw new Error('Product not found in store. Please contact support.');
      }

      const offer = product.getOffer();
      if (!offer) {
        console.error('No offer available for product:', product);
        throw new Error('No offer available for product');
      }

      // Initiate purchase flow (async, handled by store events)
      const error = await offer.order();

      if (error) {
        if (error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
          console.log('Payment cancelled by user');
          this.#toastService.presentToast('Purchase cancelled', 2000, 'bottom');
        } else {
          console.error('Failed to purchase:', error);
          this.#toastService.presentToast(
            'Purchase failed. Please try again.',
            2000,
            'bottom'
          );
        }
      }
    } catch (error) {
      console.error('Failed to initiate purchase:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.#toastService.presentToast(
        `Failed to start purchase: ${errorMessage}`,
        3000,
        'bottom'
      );
    }
  }

  /**
   * Restore previous purchases from Google Play Store
   *
   * Useful when:
   * - User reinstalls the app
   * - User switches devices
   * - User clears app data
   */
  async restorePurchases(): Promise<void> {
    // Not on native platform
    if (!this.#isNativePlatform() || !this.#isStoreAvailable()) {
      this.#toastService.presentToast(
        'Purchase restoration is only available on mobile devices',
        3000,
        'bottom'
      );
      return;
    }

    try {
      // Show loading state
      this.#toastService.presentToast('Restoring purchases...', 2000, 'bottom');

      if (this.#store) {
        this.#store.restorePurchases();
      }

      // Wait a bit for the store to process
      await new Promise((resolve) =>
        setTimeout(resolve, this.#RESTORE_CHECK_DELAY)
      );

      const message = this.#isPremiumUnlocked()
        ? 'Premium access restored!'
        : 'No previous purchases found';
      this.#toastService.presentToast(message, 2000, 'bottom');
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      this.#toastService.presentToast(
        'Failed to restore purchases. Please try again.',
        2000,
        'bottom'
      );
    }
  }

  // ==================== Premium Status Management ====================

  /**
   * Unlock premium access
   * Updates signal and persists to local storage
   */
  async #unlockPremium(): Promise<void> {
    await this.#savePremiumStatus(true);
    this.#isPremiumUnlocked.set(true);
  }

  /**
   * Save premium status to Capacitor Preferences
   * Persists across app restarts
   */
  async #savePremiumStatus(status: boolean): Promise<void> {
    try {
      await Preferences.set({
        key: this.#STORAGE_KEY,
        value: status.toString(),
      });
    } catch (error) {
      console.error('Failed to save premium status:', error);
    }
  }

  /**
   * Load premium status from Capacitor Preferences
   * Updates the signal with the stored value
   */
  async #loadPremiumStatus(): Promise<boolean> {
    try {
      const result = await Preferences.get({ key: this.#STORAGE_KEY });
      const isPremium = result.value === 'true';
      this.#isPremiumUnlocked.set(isPremium);
      return isPremium;
    } catch (error) {
      console.error('Failed to load premium status:', error);
      return false;
    }
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
    return this.#store !== undefined;
  }

  // ==================== Development Helpers ====================

  /**
   * FOR TESTING ONLY - BROWSER DEVELOPMENT ONLY
   * Manually unlock premium without purchase
   * Blocked on native platforms to prevent production abuse
   */
  async unlockPremiumForTesting(): Promise<void> {
    if (this.#isNativePlatform()) {
      console.error('⛔ Testing methods are disabled on mobile devices');
      this.#toastService.presentToast(
        'Testing methods are disabled on devices',
        2000,
        'bottom'
      );
      return;
    }

    console.warn(
      '⚠️ TESTING: Unlocking premium without purchase (Browser only)'
    );

    await this.#unlockPremium();
    this.#toastService.presentToast(
      'Premium unlocked (TEST MODE - Browser only)',
      2000,
      'bottom'
    );
  }

  /**
   * FOR TESTING ONLY - BROWSER DEVELOPMENT ONLY
   * Reset premium status
   * Blocked on native platforms to prevent production abuse
   */
  async resetPremiumForTesting(): Promise<void> {
    if (this.#isNativePlatform()) {
      console.error('⛔ Testing methods are disabled on mobile devices');
      this.#toastService.presentToast(
        'Testing methods are disabled on devices',
        2000,
        'bottom'
      );
      return;
    }

    console.warn('⚠️ TESTING: Resetting premium status (Browser only)');

    await this.#savePremiumStatus(false);
    this.#isPremiumUnlocked.set(false);
    this.#toastService.presentToast(
      'Premium reset (TEST MODE - Browser only)',
      2000,
      'bottom'
    );
  }
}
