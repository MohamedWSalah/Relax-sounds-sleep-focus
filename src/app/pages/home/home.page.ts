import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { Particles } from 'src/app/components/particles/particles';
import { Footer } from 'src/app/components/footer/footer/footer';
import { SoundsPage } from '../sounds-page/sounds.page';
import { SleepTimerPage } from '../sleep-timer/sleep-timer.page';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    Particles,
    RouterModule,
    Footer,
    SoundsPage,
    SleepTimerPage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  activeTab = signal<'sounds' | 'timer' | 'mixes'>('sounds');

  onTabChanged(tab: 'sounds' | 'timer' | 'mixes') {
    this.activeTab.set(tab);
  }
}
