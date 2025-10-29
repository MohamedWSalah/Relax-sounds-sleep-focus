import { Injectable, signal, computed, inject } from '@angular/core';
import { MusicControlsService } from './music-controls.service';
import { FavoritesService } from './favorites.service';
import { InAppPurchaseService } from './in-app-purchase.service';
import { Observable, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export interface Sound {
  id: string;
  name: string;
  icon: string;
  file: string;
  selected: boolean;
  loading?: boolean;
  volume: number; // 0-1 range
  muted: boolean;
  audio?: HTMLAudioElement;
  description?: string;
  premium?: boolean;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class SoundsService {
  #musicControlsService = inject(MusicControlsService);
  #favoritesService = inject(FavoritesService);
  #inAppPurchaseService = inject(InAppPurchaseService);

  constructor() {
    // Set up event handlers to avoid circular dependency
    this.#musicControlsService.setEventHandlers({
      pauseAllSounds: () => this.pauseAllSounds(),
      resumeAllSounds: () => this.resumeAllSounds(),
      stopAllSounds: () => this.stopAllSounds(),
    });
  }

  #isPlaying = signal<boolean>(false);

  #sounds = signal<Sound[]>([
    {
      id: 'rain',
      name: 'Rain',
      icon: '🌧️',
      file: 'rain.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Gentle rainfall',
      category: 'nature',
      premium: false,
    },
    {
      id: 'ocean',
      name: 'Ocean',
      icon: '🌊',
      file: 'ocean.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Ocean waves',
      category: 'nature',
      premium: false,
    },
    {
      id: 'wind',
      name: 'Wind',
      icon: '🌬️',
      file: 'wind.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Soft breeze',
      category: 'nature',
      premium: false,
    },
    {
      id: 'campfire',
      name: 'Campfire',
      icon: '🔥',
      file: 'campfire.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Crackling fire',
      category: 'nature',
      premium: true,
    },
    {
      id: 'birds',
      name: 'Birds',
      icon: '🐦',
      file: 'birds.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Morning birds',
      category: 'nature',
      premium: false,
    },
    {
      id: 'thunder',
      name: 'Thunder',
      icon: '🌩️',
      file: 'thunder.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Distant thunder',
      category: 'nature',
      premium: true,
    },
    {
      id: 'forest',
      name: 'Forest',
      icon: '🌲',
      file: 'forest-ambience.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Deep forest sounds',
      category: 'nature',
      premium: false,
    },
    {
      id: 'stream',
      name: 'Stream',
      icon: '🏞️',
      file: 'mountain-stream.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Mountain stream',
      category: 'nature',
      premium: false,
    },
    {
      id: 'crickets',
      name: 'Crickets',
      icon: '🦗',
      file: 'night-crickets.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Night crickets',
      category: 'nature',
      premium: false,
    },
    {
      id: 'leaves',
      name: 'Leaves',
      icon: '🍂',
      file: 'rustling-leaves.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Rustling leaves',
      category: 'nature',
      premium: false,
    },
    {
      id: 'waterfall',
      name: 'Waterfall',
      icon: '💧',
      file: 'waterfall-sound.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Cascading waterfall',
      category: 'nature',
      premium: true,
    },

    {
      id: 'city-traffic',
      name: 'City Traffic',
      icon: '🚗',
      file: 'city-traffic.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Urban sounds',
      category: 'city',
      premium: true,
    },
    {
      id: 'coffee-shop',
      name: 'Coffee Shop',
      icon: '☕',
      file: 'coffee-shop.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Café ambiance',
      category: 'city',
      premium: true,
    },
    {
      id: 'singing-bowl',
      name: 'Singing Bowl',
      icon: '🔔',
      file: 'singing-bowl.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Tibetan bowl',
      category: 'meditation',
      premium: true,
    },
    {
      id: 'piano',
      name: 'Piano',
      icon: '🎹',
      file: 'piano.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Soft piano',
      category: 'instruments',
      premium: true,
    },
    {
      id: 'whisper',
      name: 'Whisper',
      icon: '👂',
      file: 'whisper.mp3',
      selected: false,
      volume: 1,
      muted: false,
      description: 'Gentle whispers',
      category: 'asmr',
      premium: true,
    },
  ]);

  #selectedCategory = signal<string>('nature');

  #baseCategories = signal<Category[]>([
    { id: 'nature', name: 'Nature', icon: '🌿' },
    { id: 'city', name: 'City', icon: '🏙️' },
    { id: 'meditation', name: 'Meditation', icon: '🧘' },
    { id: 'instruments', name: 'Instruments', icon: '🎵' },
    { id: 'asmr', name: 'ASMR', icon: '✨' },
  ]);

  sounds = computed(() => this.#sounds());
  selectedCategory = computed(() => this.#selectedCategory());
  isPlaying = computed(() => this.#isPlaying());

  // Get currently playing sounds for saving mixes
  playingSounds = computed(() =>
    this.#sounds()
      .filter((sound) => sound.selected)
      .map((sound) => ({ id: sound.id, volume: sound.volume }))
  );

  // Dynamic categories that include Favorites if there are any
  categories = computed(() => {
    const baseCategories = this.#baseCategories();
    const favorites = this.#favoritesService.favorites();

    // If there are favorites, add the Favorites category at the beginning
    if (favorites.length > 0) {
      return [
        { id: 'favorites', name: 'Favorites', icon: '❤️' },
        ...baseCategories,
      ];
    }

    return baseCategories;
  });

  filteredSounds = computed(() => {
    const selectedCategory = this.#selectedCategory();

    if (selectedCategory === 'favorites') {
      // Return only favorite sounds
      return this.#favoritesService.getFavoriteSounds(this.#sounds());
    }

    // Return sounds filtered by category
    return this.#sounds().filter(
      (sound) => sound.category === selectedCategory
    );
  });

  selectCategory(categoryId: string): void {
    this.#selectedCategory.set(categoryId);
  }

  // Favorites methods
  isFavorite(soundId: string): boolean {
    return this.#favoritesService.isFavorite(soundId);
  }

  toggleFavorite(soundId: string): Observable<boolean> {
    return this.#favoritesService.toggleFavorite(soundId);
  }

  getFavorites(): string[] {
    return this.#favoritesService.getFavorites();
  }

  // ==================== Premium Access Methods ====================

  /**
   * Get premium unlock status as a reactive signal
   * Use this in templates to show/hide premium UI elements
   */
  get isPremiumUnlocked() {
    return this.#inAppPurchaseService.isPremiumUnlocked;
  }

  /**
   * Check if a sound is accessible to the user
   * - Free sounds are always accessible
   * - Premium sounds require premium unlock
   * @param sound - The sound to check
   * @returns true if the sound can be played, false otherwise
   */
  isSoundAccessible(sound: Sound): boolean {
    if (!sound.premium) {
      return true; // Free sounds are always accessible
    }
    return this.#inAppPurchaseService.isPremiumUnlockedSync();
  }

  /**
   * Check if a sound is locked (premium and not unlocked)
   * @param sound - The sound to check
   * @returns true if the sound is locked, false otherwise
   */
  isSoundLocked(sound: Sound): boolean {
    return (
      (sound.premium ?? false) &&
      !this.#inAppPurchaseService.isPremiumUnlockedSync()
    );
  }

  private updateSoundProperty(
    soundId: string,
    property: keyof Sound,
    value: any
  ): void {
    const currentSounds = this.#sounds();
    const updatedSounds = currentSounds.map((s) => {
      if (s.id === soundId) {
        // Preserve the audio instance when updating
        const updatedSound = { ...s, [property]: value };
        if (s.audio) {
          updatedSound.audio = s.audio;
        }
        return updatedSound;
      }
      return s;
    });
    this.#sounds.set(updatedSounds);
  }

  toggleSound(selectedSound: Sound): void {
    // Check if sound is accessible (premium check)
    if (!this.isSoundAccessible(selectedSound)) {
      console.log(
        'Sound is locked. Premium access required:',
        selectedSound.name
      );
      // Don't toggle - the UI should handle showing the premium modal
      return;
    }

    const newSelectedState = !selectedSound.selected;

    this.#sounds.update((s) =>
      s.map((sound) =>
        sound.id === selectedSound.id
          ? { ...sound, selected: newSelectedState }
          : sound
      )
    );

    if (newSelectedState) {
      this.playSound(selectedSound);
    } else {
      this.stopSound(selectedSound);
    }

    // Notify music controls service about the change
    const playingSounds = this.#sounds().filter((sound) => sound.selected);
    this.#musicControlsService.updatePlayingState(playingSounds);
  }

  playSound(sound: Sound): void {
    if (!sound.audio) {
      this.updateSoundProperty(sound.id, 'loading', true);
      const audio = new Audio(`assets/sounds/${sound.file}`);
      audio.loop = true;
      audio.volume = 0;

      // Handle audio loading
      audio.addEventListener('canplaythrough', () => {
        this.updateSoundProperty(sound.id, 'loading', false);
      });

      // Handle audio loading errors
      audio.addEventListener('error', (e) => {
        console.warn(`Failed to load sound: ${sound.name}`, e);
        this.updateSoundProperty(sound.id, 'loading', false);
      });

      // Update the signal with the new audio instance
      const currentSounds = this.#sounds();
      const updatedSounds = currentSounds.map((s) => {
        if (s.id === sound.id) {
          return { ...s, audio };
        }
        return s;
      });
      this.#sounds.set(updatedSounds);
      sound.audio = audio;
    }

    sound.audio.play().catch((error) => {
      console.warn(`Failed to play sound: ${sound.name}`, error);
      this.updateSoundProperty(sound.id, 'loading', false);
    });

    // Set volume based on current settings
    const targetVolume = sound.muted ? 0 : sound.volume;
    this.fadeAudio(sound.audio, targetVolume, 500);

    // Resume all other selected sounds that might be paused
    this.#resumeAllSelectedSounds();

    // Update playing state
    this.#isPlaying.set(true);
  }

  stopSound(sound: Sound): void {
    if (sound.audio) {
      this.fadeAudio(sound.audio, 0, 500, () => {
        sound.audio?.pause();
        sound.audio!.currentTime = 0;
      });
    }
  }

  fadeAudio(
    audio: HTMLAudioElement,
    toVolume: number,
    duration: number,
    onComplete?: () => void
  ): void {
    // Clear any existing fade interval for this audio
    if (audio.dataset['fadeInterval']) {
      clearInterval(parseInt(audio.dataset['fadeInterval']));
    }

    const steps = 20;
    const stepTime = duration / steps;
    const delta = (toVolume - audio.volume) / steps;
    let step = 0;

    const fadeInterval = setInterval(() => {
      audio.volume = Math.max(0, Math.min(1, audio.volume + delta));
      step++;
      if (step >= steps || Math.abs(audio.volume - toVolume) < 0.01) {
        audio.volume = toVolume;
        clearInterval(fadeInterval);
        delete audio.dataset['fadeInterval'];
        if (onComplete) onComplete();
      }
    }, stepTime);

    // Store interval ID for cleanup
    audio.dataset['fadeInterval'] = fadeInterval.toString();
  }

  pauseAllSounds(): void {
    const sounds = this.#sounds();
    let completedFades = 0;
    const soundsToPause = sounds.filter(
      (sound) => sound.selected && sound.audio && !sound.audio.paused
    );

    if (soundsToPause.length === 0) {
      this.#isPlaying.set(false);
      return;
    }

    soundsToPause.forEach((sound) => {
      if (sound.audio) {
        // Fade out before pausing
        this.fadeAudio(sound.audio, 0, 300, () => {
          try {
            sound.audio?.pause();
          } catch (error) {
            console.error(`Failed to pause ${sound.name}:`, error);
          }

          completedFades++;
          if (completedFades === soundsToPause.length) {
            // All fades complete, update playing state
            this.#isPlaying.set(false);
          }
        });
      }
    });

    // Force update the signals to ensure consistency
    this.#sounds.set([...sounds]);
  }

  resumeAllSounds(): void {
    const sounds = this.#sounds();
    const hasSelectedSounds = sounds.some((sound) => sound.selected);

    if (!hasSelectedSounds) {
      return; // No sounds to resume
    }

    sounds.forEach((sound) => {
      if (sound.selected && sound.audio && sound.audio.paused) {
        sound.audio.play().catch((error) => {
          console.warn(`Failed to resume sound: ${sound.name}`, error);
        });

        // Fade in from current volume to target volume
        const targetVolume = sound.muted ? 0 : sound.volume;
        this.fadeAudio(sound.audio, targetVolume, 300);
      }
    });

    // Force update the signals to ensure consistency
    this.#sounds.set([...sounds]);

    // Update playing state
    this.#isPlaying.set(true);
  }

  stopAllSounds(): void {
    const sounds = this.#sounds();
    let completedFades = 0;
    const soundsToStop = sounds.filter(
      (sound) => sound.audio && !sound.audio.paused
    );

    if (soundsToStop.length === 0) {
      // No sounds playing, just reset state
      const updatedSounds = sounds.map((s) => ({ ...s, selected: false }));
      this.#sounds.set(updatedSounds);
      this.#musicControlsService.updatePlayingState([]);
      this.#isPlaying.set(false);
      return;
    }

    soundsToStop.forEach((sound) => {
      if (sound.audio) {
        // Fade out before stopping
        this.fadeAudio(sound.audio, 0, 400, () => {
          if (sound.audio) {
            sound.audio.pause();
            sound.audio.currentTime = 0;
          }

          completedFades++;
          if (completedFades === soundsToStop.length) {
            // All fades complete, reset state
            const currentSounds = this.#sounds();
            const updatedSounds = currentSounds.map((s) => ({
              ...s,
              selected: false,
            }));
            this.#sounds.set(updatedSounds);

            // Notify music controls service about the change
            this.#musicControlsService.updatePlayingState([]);

            // Update playing state
            this.#isPlaying.set(false);
          }
        });
      }
    });
  }

  setVolume(
    sound: Sound,
    value: number | { value: number } | { lower: number; upper: number }
  ): void {
    let volumeValue: number;
    if (typeof value === 'number') {
      volumeValue = value;
    } else if ('value' in value) {
      volumeValue = value.value;
    } else {
      volumeValue = value.lower; // Use lower value for range
    }

    const newVolume = volumeValue / 100; // Convert from 0-100 to 0-1
    this.updateSoundProperty(sound.id, 'volume', newVolume);

    const updatedSound = this.#sounds().find((s) => s.id === sound.id)!;
    if (updatedSound.audio && !updatedSound.muted) {
      updatedSound.audio.volume = newVolume;
    }
  }

  toggleMute(sound: Sound): void {
    this.updateSoundProperty(sound.id, 'muted', !sound.muted);

    const updatedSound = this.#sounds().find((s) => s.id === sound.id)!;
    if (updatedSound.audio) {
      updatedSound.audio.volume = updatedSound.muted ? 0 : updatedSound.volume;
    }
  }

  #resumeAllSelectedSounds(): void {
    const sounds = this.#sounds();
    sounds.forEach((sound) => {
      if (sound.selected && sound.audio && sound.audio.paused) {
        sound.audio.play().catch((error) => {
          console.warn(`Failed to resume sound: ${sound.name}`, error);
        });
      }
    });
  }

  // Load a mix - stop current sounds and play mix sounds
  loadMix(mixSounds: { id: string; volume: number }[]): void {
    // First, stop all currently playing sounds
    this.stopAllSounds();

    // Then, play each sound from the mix
    const currentSounds = this.#sounds();
    mixSounds.forEach(({ id, volume }) => {
      const sound = currentSounds.find((s) => s.id === id);
      if (sound) {
        // Set the volume first (convert from 0-1 to 0-100 for setVolume)
        this.setVolume(sound, volume * 100);
        // Then toggle the sound on
        if (!sound.selected) {
          this.toggleSound(sound);
        }
      }
    });
  }
}
