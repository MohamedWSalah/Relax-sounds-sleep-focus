import {
  Component,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { switchMap } from 'rxjs/operators';
import { IonRange, IonIcon } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { Sound, SoundsService } from 'src/app/services/sounds.service';
import { ToastControllerService } from 'src/app/services/toast.service';
import { MixesService } from 'src/app/services/mixes.service';
import { SaveMixModalComponent } from 'src/app/components/save-mix-modal/save-mix-modal.component';

@Component({
  selector: 'app-sounds',
  imports: [CommonModule, IonRange, IonIcon],
  templateUrl: './sounds.page.html',
  styleUrl: './sounds.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoundsPage {
  #soundsService = inject(SoundsService);
  #toastController = inject(ToastControllerService);
  #destroyRef = inject(DestroyRef);
  #modalController = inject(ModalController);
  #mixesService = inject(MixesService);

  selectedCategory = this.#soundsService.selectedCategory;
  categories = this.#soundsService.categories;
  filteredSounds = this.#soundsService.filteredSounds;

  // Check if there are any playing sounds
  hasPlayingSounds = computed(
    () => this.#soundsService.playingSounds().length > 0
  );

  selectCategory(categoryId: string): void {
    this.#soundsService.selectCategory(categoryId);
  }

  toggleSound(selectedSound: Sound): void {
    this.#soundsService.toggleSound(selectedSound);
  }

  setVolume(
    sound: Sound,
    value: number | { value: number } | { lower: number; upper: number }
  ): void {
    this.#soundsService.setVolume(sound, value);
  }

  toggleMute(sound: Sound): void {
    this.#soundsService.toggleMute(sound);
  }

  isFavorite(soundId: string): boolean {
    return this.#soundsService.isFavorite(soundId);
  }

  toggleFavorite(sound: Sound, event: Event): void {
    event.stopPropagation();

    // Dismiss any existing toast first, then show new toast
    this.#toastController
      .dismiss()
      .pipe(
        switchMap(() => this.#soundsService.toggleFavorite(sound.id)),
        switchMap((isNowFavorite) =>
          this.#toastController.create({
            message: isNowFavorite
              ? `Added to Favorites 🌙`
              : `Removed from Favorites 💨`,
            duration: 1500,
            position: 'top',
            translucent: true,
            animated: true,
            buttons: [
              {
                text: 'x',
                role: 'cancel',
                handler: () => {
                  console.log('Dismiss clicked');
                },
              },
            ],
          })
        ),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe({
        error: (error) => {
          console.warn('Failed to toggle favorite or show toast:', error);
        },
      });
  }

  // Open Save Mix Modal
  async openSaveMixModal() {
    const playingSounds = this.#soundsService.playingSounds();

    if (playingSounds.length === 0) {
      return;
    }

    const modal = await this.#modalController.create({
      component: SaveMixModalComponent,
      cssClass: 'save-mix-modal',
      backdropDismiss: true,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'save' && data?.name) {
      const result = this.#mixesService.saveMix(data.name, playingSounds);

      if (result.success) {
        this.#toastController
          .create({
            message: result.isUpdate
              ? `✅ Mix "${data.name}" updated!`
              : `✅ Mix "${data.name}" saved!`,
            duration: 2000,
            position: 'top',
            color: 'primary',
            translucent: true,
            animated: true,
            buttons: [
              {
                text: 'x',
                role: 'cancel',
              },
            ],
          })
          .pipe(takeUntilDestroyed(this.#destroyRef))
          .subscribe({
            error: (error) => {
              console.warn('Failed to show toast:', error);
            },
          });
      }
    }
  }

  // Removed ngOnDestroy to preserve sounds when switching tabs
  // The service will handle cleanup when the app is actually closed
}
