import { Injectable, inject } from '@angular/core';
import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
  RemoteConfig,
} from 'firebase/remote-config';
import { Observable, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';

/**
 * Remote Config Service
 * Handles Firebase Remote Config operations
 * Manages app configuration data fetched from Firebase
 */
@Injectable({
  providedIn: 'root',
})
export class RemoteConfigService {
  #firebaseService = inject(FirebaseService);
  #remoteConfig?: RemoteConfig;
  #isInitialized = false;

  // Remote Config parameter keys
  readonly #KEYS = {
    SOUND_LIST: 'sound_list',
    BASE_CATEGORIES: 'base_categories',
  } as const;

  // Default values if Remote Config fails
  readonly #DEFAULTS = {
    [this.#KEYS.SOUND_LIST]: '[]',
    [this.#KEYS.BASE_CATEGORIES]: '[]',
  };

  readonly #SETTINGS = {
    // How long to cache Remote Config before allowing a fresh fetch
    // Since we only fetch once on app open, this prevents excessive fetches
    // if user closes/reopens the app multiple times quickly
    MINIMUM_FETCH_INTERVAL: 3600000, // 1 hour (3600000ms) - recommended for production
    // MINIMUM_FETCH_INTERVAL: 0, // Use 0 during development to always get fresh data

    // Maximum time to wait for fetch to complete before timing out
    FETCH_TIMEOUT: 10000, // 10 seconds
  };

  initialize(): void {
    if (this.#isInitialized) {
      console.log('Remote Config already initialized');
      return;
    }

    const app = this.#firebaseService.app;
    if (!app) {
      console.error(
        'Firebase app not initialized. Cannot initialize Remote Config.'
      );
      return;
    }

    this.#remoteConfig = getRemoteConfig(app);
    this.#remoteConfig.settings.minimumFetchIntervalMillis =
      this.#SETTINGS.MINIMUM_FETCH_INTERVAL;
    this.#remoteConfig.settings.fetchTimeoutMillis =
      this.#SETTINGS.FETCH_TIMEOUT;
    this.#remoteConfig.defaultConfig = this.#DEFAULTS;

    this.#isInitialized = true;
    console.log('Remote Config initialized');
  }

  fetchAndActivate(): Observable<boolean> {
    if (!this.#remoteConfig) {
      console.warn('Remote Config not initialized. Cannot fetch.');
      return of(false);
    }

    return from(fetchAndActivate(this.#remoteConfig)).pipe(
      tap(() => console.log('Remote Config fetched and activated')),
      map(() => true),
      catchError((err) => {
        console.error('Failed to fetch Remote Config:', err);
        return of(false);
      })
    );
  }

  initializeAndFetch(): Observable<void> {
    this.initialize();

    return this.fetchAndActivate().pipe(
      tap((success) => {
        if (success) {
          this.#logConfigData();
        } else {
          console.log('Using default Remote Config values');
        }
      }),
      map(() => void 0)
    );
  }

  #logConfigData(): void {
    console.log('=== Remote Config Data ===');
    console.log('Sound List:', this.getSoundList());
    console.log('Base Categories:', this.getBaseCategories());
    console.log('========================');
  }

  getSoundList(): any[] {
    return this.#getConfigValue(this.#KEYS.SOUND_LIST);
  }

  getBaseCategories(): any[] {
    return this.#getConfigValue(this.#KEYS.BASE_CATEGORIES);
  }

  #getConfigValue(key: string): any[] {
    if (!this.#remoteConfig) {
      console.warn(
        `Remote Config not initialized. Returning empty array for ${key}`
      );
      return [];
    }

    try {
      const jsonString = getValue(this.#remoteConfig, key).asString();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error(`Error parsing ${key} from Remote Config:`, error);
      return [];
    }
  }

  // ==================== Getters ====================

  get isInitialized(): boolean {
    return this.#isInitialized;
  }
}
