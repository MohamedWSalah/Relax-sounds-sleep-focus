import {
  Component,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { switchMap, tap } from 'rxjs/operators';
import { IonRange, IonIcon } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { Sound, SoundsService } from 'src/app/services/sounds.service';
import { ToastControllerService } from 'src/app/services/toast.service';
import { MixesService } from 'src/app/services/mixes.service';
import { InAppPurchaseService } from 'src/app/services/in-app-purchase.service';
import { SaveMixModalComponent } from 'src/app/components/save-mix-modal/save-mix-modal.component';
import { of } from 'rxjs';

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
  #inAppPurchaseService = inject(InAppPurchaseService);

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
    // Check if sound is locked
    if (this.isSoundLocked(selectedSound)) {
      this.#showPremiumPrompt();
      return;
    }

    this.#soundsService.toggleSound(selectedSound);
  }

  /**
   * Show premium unlock prompt
   */
  #showPremiumPrompt(): void {
    this.#toastController.create({
      message: '🔒 Unlock premium to access all sounds',
      duration: 2000,
      position: 'bottom',
      cssClass: 'premium-toast',
      buttons: [
        {
          text: '🔓 Go Premium',
          role: 'cancel',
          handler: () => {
            // Trigger the premium purchase flow
            this.#inAppPurchaseService.purchasePremium().subscribe();
          },
        },
        {
          text: '❌',
          role: 'cancel',
        },
      ],
    });
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

  /**
   * Check if a sound is locked (requires premium access)
   */
  isSoundLocked(sound: Sound): boolean {
    return this.#soundsService.isSoundLocked(sound);
  }

  /**
   * Get premium unlock status for template
   */
  get isPremiumUnlocked() {
    return this.#soundsService.isPremiumUnlocked;
  }

  toggleFavorite(sound: Sound, event: Event): void {
    event.stopPropagation();

    this.#soundsService
      .toggleFavorite(sound.id)
      .pipe(
        tap((isNowFavorite) =>
          this.#toastController.create({
            message: isNowFavorite
              ? `Added to Favorites 🌙`
              : `Removed from Favorites 💨`,
            duration: 1500,
            position: 'top',
            translucent: true,
            animated: true,
          })
        ),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe();
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
        this.#toastController.create({
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
        });
      }
    }
  }

  // Removed ngOnDestroy to preserve sounds when switching tabs
  // The service will handle cleanup when the app is actually closed
}
