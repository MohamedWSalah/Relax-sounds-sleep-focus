import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { Particles } from 'src/app/components/particles/particles';
import { Footer } from 'src/app/components/footer/footer/footer';
import { SoundsPage } from '../sounds-page/sounds.page';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    Particles,
    RouterModule,
    Footer,
    SoundsPage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
