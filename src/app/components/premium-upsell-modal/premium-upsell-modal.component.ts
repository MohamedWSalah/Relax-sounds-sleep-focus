import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
  signal,
  Input,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import type { Sound } from 'src/app/types';
import { InAppPurchaseService } from 'src/app/services/in-app-purchase.service';

@Component({
  selector: 'app-premium-upsell-modal',
  templateUrl: './premium-upsell-modal.component.html',
  styleUrls: ['./premium-upsell-modal.component.scss'],
  imports: [CommonModule, IonIcon, IonButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PremiumUpsellModalComponent implements OnInit, OnDestroy {
  #modalController = inject(ModalController);
  #inAppPurchaseService = inject(InAppPurchaseService);

  // Input: The locked sound that triggered this modal
  @Input() sound!: Sound;

  // State
  isPreviewPlaying = signal(false);
  previewAudio: HTMLAudioElement | null = null;
  previewTimeout: number | null = null;
  #premiumCheckInterval: number | null = null;
  #premiumUnlockSubscription?: () => void;
  #previewStopped = false; // Flag to prevent callbacks after stop

  constructor() {
    // Watch for premium unlock status changes
    effect(() => {
      const isUnlocked = this.#inAppPurchaseService.isPremiumUnlocked();
      if (isUnlocked && this.previewAudio) {
        // Premium was unlocked, close modal and activate sound
        this.#handlePurchaseSuccess();
      }
    });
  }

  ngOnInit(): void {
    // Subscribe to premium unlock changes
    this.#premiumUnlockSubscription = () => {
      // Effect already handles this
    };
  }

  ngOnDestroy(): void {
    this.#stopPreview();
    if (this.#premiumCheckInterval !== null) {
      clearInterval(this.#premiumCheckInterval);
      this.#premiumCheckInterval = null;
    }
    if (this.#premiumUnlockSubscription) {
      this.#premiumUnlockSubscription();
    }
  }

  /**
   * Toggle preview playback (play/pause)
   */
  playPreview(): void {
    // If already playing, stop it
    if (this.isPreviewPlaying()) {
      this.#stopPreview();
      return;
    }

    // Otherwise, start playing
    const sound = this.sound;

    // Stop any existing preview or full sound first
    this.#stopPreview();
    this.#stopFullSound(sound);

    // Reset the stopped flag
    this.#previewStopped = false;

    // Create preview audio instance (separate from the actual sound audio)
    const previewAudio = new Audio(`assets/sounds/${sound.file}`);
    previewAudio.loop = false;
    previewAudio.volume = 0;

    // Store reference to check if it's still the active audio
    const currentAudio = previewAudio;

    const canPlayHandler = () => {
      // Only proceed if this is still the active audio and not stopped
      if (currentAudio === this.previewAudio && !this.#previewStopped) {
        // Fade in quickly
        this.#fadeAudio(previewAudio, sound.volume, 200);
        this.isPreviewPlaying.set(true);
      }
    };

    const errorHandler = (e: Event) => {
      // Only handle if this is still the active audio
      if (currentAudio === this.previewAudio) {
        console.warn(`Failed to load preview for: ${sound.name}`, e);
        this.isPreviewPlaying.set(false);
        this.#previewStopped = true;
      }
    };

    previewAudio.addEventListener('canplaythrough', canPlayHandler);
    previewAudio.addEventListener('error', errorHandler);

    // Play the audio
    previewAudio.play().catch((error) => {
      // Only handle if this is still the active audio
      if (currentAudio === this.previewAudio && !this.#previewStopped) {
        console.warn(`Failed to play preview: ${sound.name}`, error);
        this.isPreviewPlaying.set(false);
        this.#previewStopped = true;
      }
    });

    // Stop after 3 seconds
    this.previewTimeout = window.setTimeout(() => {
      if (currentAudio === this.previewAudio) {
        this.#stopPreview();
      }
    }, 20000);

    this.previewAudio = previewAudio;
  }

  /**
   * Stop preview playback
   */
  #stopPreview(): void {
    // Set stopped flag immediately to prevent any callbacks from running
    this.#previewStopped = true;

    // Set playing state to false immediately
    this.isPreviewPlaying.set(false);

    if (this.previewAudio) {
      // Stop the timeout first
      if (this.previewTimeout !== null) {
        clearTimeout(this.previewTimeout);
        this.previewTimeout = null;
      }

      // Store reference to current audio for cleanup
      const audioToStop = this.previewAudio;
      this.previewAudio = null; // Clear reference immediately

      // Fade out and clean up
      this.#fadeAudio(audioToStop, 0, 200, () => {
        // Double check the stopped flag before cleaning up
        if (this.#previewStopped) {
          audioToStop.pause();
          audioToStop.currentTime = 0;
          // Remove all event listeners by cloning (replacing the element)
          audioToStop.src = '';
        }
      });
    } else {
      // If no audio, just clear timeout
      if (this.previewTimeout !== null) {
        clearTimeout(this.previewTimeout);
        this.previewTimeout = null;
      }
    }
  }

  /**
   * Stop the full sound if it's playing
   */
  #stopFullSound(sound: Sound): void {
    if (sound.audio && !sound.audio.paused) {
      sound.audio.pause();
      sound.audio.currentTime = 0;
    }
  }

  /**
   * Fade audio volume
   */
  #fadeAudio(
    audio: HTMLAudioElement,
    toVolume: number,
    duration: number,
    onComplete?: () => void
  ): void {
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
        if (onComplete) onComplete();
      }
    }, stepTime);
  }

  /**
   * Unlock premium - triggers purchase flow
   */
  async unlockPremium(): Promise<void> {
    try {
      // Check premium status before purchase
      const wasUnlocked = this.#inAppPurchaseService.isPremiumUnlockedSync();

      await this.#inAppPurchaseService.purchasePremium();

      // After purchase attempt, check if premium was unlocked
      // Poll for a short time to catch async updates
      let checkCount = 0;
      const maxChecks = 20; // Check for 2 seconds (20 * 100ms)
      this.#premiumCheckInterval = window.setInterval(() => {
        checkCount++;
        const isNowUnlocked =
          this.#inAppPurchaseService.isPremiumUnlockedSync();

        if (isNowUnlocked && !wasUnlocked) {
          if (this.#premiumCheckInterval !== null) {
            clearInterval(this.#premiumCheckInterval);
            this.#premiumCheckInterval = null;
          }
          this.#handlePurchaseSuccess();
        } else if (checkCount >= maxChecks) {
          if (this.#premiumCheckInterval !== null) {
            clearInterval(this.#premiumCheckInterval);
            this.#premiumCheckInterval = null;
          }
          // If still not unlocked after checks, purchase likely failed/cancelled
          // Modal stays open (purchasePremium already showed toast)
        }
      }, 100);
    } catch (error) {
      console.error('Purchase failed:', error);
      // Modal stays open on failure
    }
  }

  /**
   * Handle successful purchase
   */
  #handlePurchaseSuccess(): void {
    // Close modal with success status and sound data
    const sound = this.sound;
    this.#modalController.dismiss({ success: true, sound }, 'purchased');
  }

  /**
   * Close modal (user clicked X or swiped down)
   */
  dismiss(): void {
    this.#stopPreview();
    this.#modalController.dismiss(null, 'cancel');
  }
}
