import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonRange,
  IonContent,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { SoundsService, Sound } from '../../services/sounds.service';
import { Particles } from 'src/app/components/particles/particles';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    IonRange,
    IonContent,
    IonIcon,
    IonButton,
    Particles,
    RouterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnDestroy {
  private soundsService = inject(SoundsService);
  private toastController = inject(ToastController);

  selectedCategory = this.soundsService.selectedCategory;
  categories = this.soundsService.categories;
  filteredSounds = this.soundsService.filteredSounds;

  selectCategory(categoryId: string): void {
    this.soundsService.selectCategory(categoryId);
  }

  toggleSound(selectedSound: Sound): void {
    this.soundsService.toggleSound(selectedSound);
  }

  setVolume(
    sound: Sound,
    value: number | { value: number } | { lower: number; upper: number }
  ): void {
    this.soundsService.setVolume(sound, value);
  }

  toggleMute(sound: Sound): void {
    this.soundsService.toggleMute(sound);
  }

  isFavorite(soundId: string): boolean {
    return this.soundsService.isFavorite(soundId);
  }

  async toggleFavorite(sound: Sound, event: Event): Promise<void> {
    event.stopPropagation();
    const isNowFavorite = await this.soundsService.toggleFavorite(sound.id);
    this.toastController.dismiss();
    // Show toast notification
    const toast = await this.toastController.create({
      message: isNowFavorite
        ? `Added to Favorites 🌙`
        : `Removed from Favorites 💨`,
      duration: 200000,
      position: 'bottom',
      translucent: true,
      animated: true,
    });

    await toast.present();
  }

  ngOnDestroy(): void {
    this.soundsService.stopAllSounds();
  }
}
