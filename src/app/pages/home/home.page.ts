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
import { SoundsService, Sound } from '../../services/sounds.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [CommonModule, IonRange, IonContent, IonIcon, IonButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit, OnDestroy {
  private soundsService = inject(SoundsService);

  backgroundParticles: number[] = [];

  // Service getters
  selectedCategory = this.soundsService.getSelectedCategory;
  categories = this.soundsService.categories;
  filteredSounds = this.soundsService.filteredSounds;

  ngOnInit(): void {
    // Generate background particles
    this.backgroundParticles = Array.from({ length: 35 }, (_, i) => i);
  }

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

  ngOnDestroy(): void {
    this.soundsService.stopAllSounds();
  }
}
