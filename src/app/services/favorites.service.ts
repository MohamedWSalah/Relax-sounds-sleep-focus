import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Sound } from './sounds.service';
import { Observable, from, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'favorites';

  // Signal to hold favorites list
  #favorites = signal<string[]>([]);

  // Public computed signals
  favorites = computed(() => this.#favorites());

  // We'll pass sounds from the calling service instead of injecting
  getFavoriteSounds(allSounds: Sound[]): Sound[] {
    const favoriteIds = this.#favorites();
    return allSounds.filter((sound) => favoriteIds.includes(sound.id));
  }

  constructor() {
    this.loadFavorites().subscribe();
  }

  /**
   * Load favorites from storage on service initialization
   */
  private loadFavorites(): Observable<void> {
    return from(Preferences.get({ key: this.STORAGE_KEY })).pipe(
      tap(({ value }) => {
        if (value) {
          const favorites = JSON.parse(value);
          this.#favorites.set(favorites);
        }
      }),
      switchMap(() => of(undefined as void)),
      catchError((error) => {
        console.warn('Failed to load favorites from storage:', error);
        return of(undefined as void);
      })
    );
  }

  /**
   * Save favorites to storage
   */
  private saveFavorites(): Observable<void> {
    const favorites = this.#favorites();
    return from(
      Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(favorites),
      })
    ).pipe(
      switchMap(() => of(undefined as void)),
      catchError((error) => {
        console.warn('Failed to save favorites to storage:', error);
        return of(undefined as void);
      })
    );
  }

  /**
   * Check if a sound is favorited
   */
  isFavorite(soundId: string): boolean {
    return this.#favorites().includes(soundId);
  }

  /**
   * Toggle favorite status of a sound
   */
  toggleFavorite(soundId: string): Observable<boolean> {
    const currentFavorites = this.#favorites();
    const isCurrentlyFavorite = currentFavorites.includes(soundId);

    let newFavorites: string[];
    let isNowFavorite: boolean;

    if (isCurrentlyFavorite) {
      // Remove from favorites
      newFavorites = currentFavorites.filter((id) => id !== soundId);
      isNowFavorite = false;
    } else {
      // Add to favorites
      newFavorites = [...currentFavorites, soundId];
      isNowFavorite = true;
    }

    // Update the signal
    this.#favorites.set(newFavorites);

    // Save to storage and return the result
    return this.saveFavorites().pipe(
      switchMap(() => of(isNowFavorite)),
      catchError((error) => {
        console.warn('Failed to save favorites after toggle:', error);
        return of(isNowFavorite);
      })
    );
  }

  /**
   * Get all favorite sound IDs
   */
  getFavorites(): string[] {
    return this.#favorites();
  }

  /**
   * Add a sound to favorites
   */
  addToFavorites(soundId: string): Observable<void> {
    const currentFavorites = this.#favorites();
    if (!currentFavorites.includes(soundId)) {
      const newFavorites = [...currentFavorites, soundId];
      this.#favorites.set(newFavorites);
      return this.saveFavorites();
    }
    return of(undefined as void);
  }

  /**
   * Remove a sound from favorites
   */
  removeFromFavorites(soundId: string): Observable<void> {
    const currentFavorites = this.#favorites();
    const newFavorites = currentFavorites.filter((id) => id !== soundId);
    this.#favorites.set(newFavorites);
    return this.saveFavorites();
  }

  /**
   * Clear all favorites
   */
  clearFavorites(): Observable<void> {
    this.#favorites.set([]);
    return this.saveFavorites();
  }
}
