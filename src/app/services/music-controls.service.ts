import { Injectable, signal, computed } from '@angular/core';
import { CapacitorMusicControls } from 'capacitor-music-controls-plugin';
import { App } from '@capacitor/app';
import type { Sound } from '../types';

@Injectable({
  providedIn: 'root',
})
export class MusicControlsService {
  #isControlsVisible = signal(false);
  #isPlaying = signal(false);
  #isAppInForeground = signal(true);
  #listenersSetup = false;

  // Event handlers for sounds service actions
  #pauseAllSoundsHandler?: () => void;
  #resumeAllSoundsHandler?: () => void;
  #stopAllSoundsHandler?: () => void;

  isControlsVisible = computed(() => this.#isControlsVisible());
  isPlaying = computed(() => this.#isPlaying());
  isAppInForeground = computed(() => this.#isAppInForeground());

  #playingSounds = signal<Sound[]>([]);

  #trackInfo = computed(() => {
    const playingSounds = this.#playingSounds();
    if (playingSounds.length === 0) return null;

    const firstSound = playingSounds[0];
    const additionalSounds = playingSounds.slice(1, 4);

    let trackName = firstSound.name;
    if (additionalSounds.length > 0) {
      const otherNames = additionalSounds.map((s) => s.name).join(', ');
      trackName += ` + ${otherNames}`;
    }

    return {
      track: trackName,
      artist: 'Relax Sounds',
      ticker:
        playingSounds.length > 1
          ? `${playingSounds.length} sounds playing`
          : `${firstSound.name} playing`,
    };
  });

  constructor() {
    this.#setupAppStateListeners();
    // Don't set up music control listeners in constructor
    // Set them up when controls are first shown
  }

  #setupAppStateListeners(): void {
    App.addListener('appStateChange', ({ isActive }) => {
      this.#isAppInForeground.set(isActive);

      if (isActive) {
        this.#hideControls();
      } else if (this.#playingSounds().length > 0) {
        this.#showControls();
      }
    });
  }

  #setupMusicControlListeners(): void {
    if (this.#listenersSetup) {
      return;
    }

    try {
      // iOS listener
      CapacitorMusicControls.addListener(
        'controlsNotification',
        (info: any) => {
          this.#handleControlsEvent(info);
        }
      );

      // Android listener (for Android 13+)
      document.addEventListener('controlsNotification', (event: any) => {
        const info = { message: event.message, position: 0 };
        this.#handleControlsEvent(info);
      });

      this.#listenersSetup = true;
    } catch (error) {
      console.error('Failed to set up music control listeners:', error);
    }
  }

  #handleControlsEvent(action: any): void {
    const message = action.message;

    switch (message) {
      case 'music-controls-next':
        // next
        break;
      case 'music-controls-previous':
        // previous
        break;
      case 'music-controls-pause':
        this.#pauseAllSounds();
        break;
      case 'music-controls-play':
        this.#resumeAllSounds();
        break;
      case 'music-controls-destroy':
        this.#hideControls();
        break;

      // External controls (iOS only)
      case 'music-controls-toggle-play-pause':
        if (this.#isPlaying()) {
          this.#pauseAllSounds();
        } else {
          this.#resumeAllSounds();
        }
        break;
      case 'music-controls-skip-to':
        // do something
        break;
      case 'music-controls-skip-forward':
        // Do something
        break;
      case 'music-controls-skip-backward':
        // Do something
        break;

      // Headset events (Android only)
      case 'music-controls-media-button':
        // Do something
        break;
      case 'music-controls-headset-unplugged':
        // Do something
        break;
      case 'music-controls-headset-plugged':
        // Do something
        break;
      default:
        break;
    }
  }

  #showControls(): void {
    const trackInfo = this.#trackInfo();
    if (!trackInfo) return;

    // Set up music control listeners when controls are first shown
    this.#setupMusicControlListeners();

    CapacitorMusicControls.create({
      track: trackInfo.track,
      artist: trackInfo.artist,
      cover: 'assets/icon/favicon.png',
      isPlaying: this.#isPlaying(),
      dismissable: true,
      hasPrev: false,
      hasNext: false,
      hasClose: true,
      ticker: trackInfo.ticker,
      album: 'Calm Collection',
      duration: 0,
      elapsed: 0,
      playIcon: 'media_play',
      pauseIcon: 'media_pause',
      closeIcon: 'media_close',
      hasScrubbing: false,
      hasSkipBackward: false,
      hasSkipForward: false,
      nextIcon: 'media_next',
      notificationIcon: 'media_notification',
      prevIcon: 'media_prev',
    })
      .then(() => {
        this.#isControlsVisible.set(true);
      })
      .catch((error) => {
        console.error('Failed to create music controls:', error);
      });
  }

  #hideControls(): void {
    if (this.#isControlsVisible()) {
      CapacitorMusicControls.destroy()
        .then(() => {
          this.#isControlsVisible.set(false);
        })
        .catch((error) => {
          console.error('Failed to hide music controls:', error);
        });
    }
  }

  setEventHandlers(handlers: {
    pauseAllSounds: () => void;
    resumeAllSounds: () => void;
    stopAllSounds: () => void;
  }): void {
    this.#pauseAllSoundsHandler = handlers.pauseAllSounds;
    this.#resumeAllSoundsHandler = handlers.resumeAllSounds;
    this.#stopAllSoundsHandler = handlers.stopAllSounds;
  }

  #pauseAllSounds(): void {
    this.#pauseAllSoundsHandler?.();
    this.#isPlaying.set(false);
    this.#updateControls();
  }

  #resumeAllSounds(): void {
    this.#resumeAllSoundsHandler?.();
    this.#isPlaying.set(true);
    this.#updateControls();
  }

  #stopAllSounds(): void {
    this.#stopAllSoundsHandler?.();
    this.#isPlaying.set(false);
    this.#hideControls();
  }

  #updateControls(): void {
    if (this.#isControlsVisible()) {
      const trackInfo = this.#trackInfo();
      if (trackInfo) {
        // Update whether the music is playing
        try {
          CapacitorMusicControls.updateIsPlaying({
            isPlaying: this.#isPlaying(), // affects Android only
          });
        } catch (error) {
          console.error('Failed to update music controls:', error);
        }
      }
    }
  }

  updatePlayingState(playingSounds: Sound[]): void {
    this.#playingSounds.set(playingSounds);
    const hasPlayingSounds = playingSounds.length > 0;
    this.#isPlaying.set(hasPlayingSounds);

    if (!this.#isAppInForeground()) {
      if (hasPlayingSounds) {
        this.#showControls();
      } else {
        this.#hideControls();
      }
    }
  }
}
