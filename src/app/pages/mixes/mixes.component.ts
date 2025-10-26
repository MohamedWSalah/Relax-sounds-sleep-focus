import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  Output,
  EventEmitter,
  signal,
  effect,
} from '@angular/core';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { AlertController, ToastController } from '@ionic/angular';
import { MixesService, Mix } from '../../services/mixes.service';
import { SoundsService } from '../../services/sounds.service';

@Component({
  selector: 'app-mixes',
  templateUrl: './mixes.component.html',
  styleUrls: ['./mixes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, IonButton],
})
export class MixesComponent {
  @Output() mixLoaded = new EventEmitter<Mix>();
  @Output() mixPaused = new EventEmitter<void>();
  @Output() startCreating = new EventEmitter<void>();

  private mixesService = inject(MixesService);
  private soundsService = inject(SoundsService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  mixes = computed(() => this.mixesService.getMixes()());
  expandedMix = signal<string | null>(null); // Only one mix can be expanded at a time
  playingMix = signal<string | null>(null); // Track which mix is currently playing

  readonly MAX_VISIBLE_SOUNDS = 3;

  constructor() {
    // Sync playingMix with sounds service playing state
    effect(() => {
      const isPlaying = this.soundsService.isPlaying();
      if (!isPlaying) {
        // When sounds are paused/stopped, clear the playing mix indicator
        this.playingMix.set(null);
      }
    });
  }

  // Map sound IDs to display names
  private soundNames: Record<string, string> = {
    rain: 'Rain',
    thunder: 'Thunder',
    ocean: 'Ocean',
    fire: 'Fire',
    forest: 'Forest',
    wind: 'Wind',
    birds: 'Birds',
    night: 'Night',
  };

  getSoundName(soundId: string): string {
    return this.soundNames[soundId] || soundId;
  }

  isExpanded(mixName: string): boolean {
    return this.expandedMix() === mixName;
  }

  toggleExpand(mixName: string, event: Event): void {
    event.stopPropagation(); // Prevent triggering loadMix
    // If clicking the currently expanded mix, collapse it
    // Otherwise, expand this mix (collapsing any other)
    this.expandedMix.set(this.expandedMix() === mixName ? null : mixName);
  }

  getVisibleSounds(mix: Mix): typeof mix.sounds {
    if (
      this.isExpanded(mix.name) ||
      mix.sounds.length <= this.MAX_VISIBLE_SOUNDS
    ) {
      return mix.sounds;
    }
    return mix.sounds.slice(0, this.MAX_VISIBLE_SOUNDS);
  }

  getRemainingCount(mix: Mix): number {
    return Math.max(0, mix.sounds.length - this.MAX_VISIBLE_SOUNDS);
  }

  isPlaying(mixName: string): boolean {
    return this.playingMix() === mixName;
  }

  async togglePlayPause(mix: Mix, event: Event) {
    event.stopPropagation(); // Prevent any parent click handlers

    if (this.isPlaying(mix.name)) {
      // Pause the currently playing mix
      this.playingMix.set(null);
      this.mixPaused.emit();

      const toast = await this.toastController.create({
        message: `⏸️ Paused "${mix.name}"`,
        duration: 2000,
        position: 'top',
        color: 'primary',
        cssClass: 'custom-toast',
      });
      await toast.present();
    } else {
      // Play this mix
      this.playingMix.set(mix.name);
      this.mixLoaded.emit(mix);

      const toast = await this.toastController.create({
        message: `🎵 Playing "${mix.name}"`,
        duration: 2000,
        position: 'top',
        color: 'primary',
        cssClass: 'custom-toast',
      });
      await toast.present();
    }
  }

  async confirmDelete(mix: Mix) {
    const alert = await this.alertController.create({
      header: 'Delete Mix?',
      message: `Are you sure you want to delete "${mix.name}"?`,
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          cssClass: 'alert-button-delete',
          handler: () => {
            this.deleteMix(mix);
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteMix(mix: Mix) {
    const success = this.mixesService.deleteMix(mix.name);

    if (success) {
      this.toastController.dismiss();
      const toast = await this.toastController.create({
        message: `Mix "${mix.name}" deleted`,
        duration: 2000,
        position: 'top',
        color: 'primary',
        cssClass: 'custom-toast',
      });
      await toast.present();
    }
  }

  onStartCreating(): void {
    this.startCreating.emit();
  }
}
