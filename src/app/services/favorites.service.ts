import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Sound } from './sounds.service';

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
    this.loadFavorites();
  }

  /**
   * Load favorites from storage on service initialization
   */
  private async loadFavorites(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      if (value) {
        const favorites = JSON.parse(value);
        this.#favorites.set(favorites);
      }
    } catch (error) {
      console.warn('Failed to load favorites from storage:', error);
    }
  }

  /**
   * Save favorites to storage
   */
  private async saveFavorites(): Promise<void> {
    try {
      const favorites = this.#favorites();
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(favorites),
      });
    } catch (error) {
      console.warn('Failed to save favorites to storage:', error);
    }
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
  async toggleFavorite(soundId: string): Promise<boolean> {
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

    // Save to storage
    await this.saveFavorites();

    return isNowFavorite;
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
  async addToFavorites(soundId: string): Promise<void> {
    const currentFavorites = this.#favorites();
    if (!currentFavorites.includes(soundId)) {
      const newFavorites = [...currentFavorites, soundId];
      this.#favorites.set(newFavorites);
      await this.saveFavorites();
    }
  }

  /**
   * Remove a sound from favorites
   */
  async removeFromFavorites(soundId: string): Promise<void> {
    const currentFavorites = this.#favorites();
    const newFavorites = currentFavorites.filter((id) => id !== soundId);
    this.#favorites.set(newFavorites);
    await this.saveFavorites();
  }

  /**
   * Clear all favorites
   */
  async clearFavorites(): Promise<void> {
    this.#favorites.set([]);
    await this.saveFavorites();
  }
}
