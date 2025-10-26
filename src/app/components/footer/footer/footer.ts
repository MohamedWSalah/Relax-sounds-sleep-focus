import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'moon-footer',
  imports: [CommonModule, IonIcon],
  template: `<div class="navigation-bar">
    <button
      class="nav-item"
      [class.active]="activeTab() === 'sounds'"
      (click)="onTabClick('sounds')"
    >
      <ion-icon name="musical-notes-outline" class="nav-icon"></ion-icon>
      <span class="nav-label">Sounds</span>
    </button>

    <button
      class="nav-item"
      [class.active]="activeTab() === 'timer'"
      (click)="onTabClick('timer')"
    >
      <ion-icon name="hourglass-outline" class="nav-icon"></ion-icon>
      <span class="nav-label">Timer</span>
    </button>

    <!-- Central Play/Pause Button -->
    <button
      class="main-play-button"
      [class.playing]="isPlaying()"
      (click)="onPlayPauseClick()"
    >
      <ion-icon
        [name]="isPlaying() ? 'pause' : 'play'"
        class="main-play-icon"
      ></ion-icon>
    </button>

    <button
      class="nav-item"
      [class.active]="activeTab() === 'mixes'"
      (click)="onTabClick('mixes')"
    >
      <ion-icon name="bookmark-outline" class="nav-icon"></ion-icon>
      <span class="nav-label">Mixes</span>
    </button>

    <button
      class="nav-item"
      [class.active]="activeTab() === 'settings'"
      (click)="onTabClick('settings')"
    >
      <ion-icon name="settings-outline" class="nav-icon"></ion-icon>
      <span class="nav-label">Settings</span>
    </button>
  </div>`,
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  activeTab = input<'sounds' | 'timer' | 'mixes' | 'settings'>('sounds');
  isPlaying = input<boolean>(false);
  tabChanged = output<'sounds' | 'timer' | 'mixes' | 'settings'>();
  playPauseClicked = output<void>();

  onTabClick(tab: 'sounds' | 'timer' | 'mixes' | 'settings') {
    this.tabChanged.emit(tab);
  }

  onPlayPauseClick() {
    this.playPauseClicked.emit();
  }
}
