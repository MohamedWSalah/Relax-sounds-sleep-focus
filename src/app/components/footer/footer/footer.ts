import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'moon-footer',
  imports: [CommonModule, IonButton, IonIcon],
  template: `<div class="footer-bar">
    <ion-button fill="clear" class="footer-button" routerLink="/sleep-timer">
      <ion-icon name="time-outline" slot="start"></ion-icon>
      Sleep Timer
    </ion-button>

    <ion-button fill="clear" class="footer-button">
      <ion-icon name="settings-outline" slot="start"></ion-icon>
      Settings
    </ion-button>
  </div>`,
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {}
