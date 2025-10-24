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

    <button
      class="nav-item"
      [class.active]="activeTab() === 'mixes'"
      (click)="onTabClick('mixes')"
    >
      <ion-icon name="bookmark-outline" class="nav-icon"></ion-icon>
      <span class="nav-label">Mixes</span>
    </button>
  </div>`,
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  activeTab = input<'sounds' | 'timer' | 'mixes'>('sounds');
  tabChanged = output<'sounds' | 'timer' | 'mixes'>();

  onTabClick(tab: 'sounds' | 'timer' | 'mixes') {
    this.tabChanged.emit(tab);
  }
}
