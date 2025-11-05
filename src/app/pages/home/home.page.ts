import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { Particles } from 'src/app/components/particles/particles';
import { Footer } from 'src/app/components/footer/footer/footer';
import { SoundsPage } from '../sounds-page/sounds.page';
import { SleepTimerPage } from '../sleep-timer/sleep-timer.page';
import { SettingsPage } from '../settings/settings.page';
import { MixesComponent } from '../mixes/mixes.component';
import { SoundsService } from 'src/app/services/sounds.service';
import { Mix } from 'src/app/services/mixes.service';

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
    SleepTimerPage,
    SettingsPage,
    MixesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements AfterViewInit {
  private soundsService = inject(SoundsService);
  @ViewChild(IonContent) content?: IonContent;
  
  activeTab = signal<'sounds' | 'timer' | 'mixes' | 'settings'>('sounds');
  isScrolled = signal(false);

  // Get playing state from sounds service
  isPlaying = this.soundsService.isPlaying;

  ngAfterViewInit() {
    // Listen to scroll events
    this.content?.getScrollElement().then((element) => {
      element.addEventListener('scroll', () => {
        const scrollTop = element.scrollTop;
        this.isScrolled.set(scrollTop > 50);
      });
    });
  }

  onScroll(event: any) {
    const scrollTop = event.detail.scrollTop;
    this.isScrolled.set(scrollTop > 50);
  }

  onTabChanged(tab: 'sounds' | 'timer' | 'mixes' | 'settings') {
    this.activeTab.set(tab);
    // Reset scroll state and position when switching tabs
    this.isScrolled.set(false);
    // Scroll to top
    this.content?.scrollToTop(0);
  }

  onMixLoaded(mix: Mix) {
    // Load the mix in the sounds service
    this.soundsService.loadMix(mix.sounds);
    // Don't switch tabs - let user stay on mixes page
  }

  onMixPaused() {
    // Stop all sounds when mix is paused
    this.soundsService.stopAllSounds();
  }

  onStartCreating() {
    // Switch to sounds tab to start creating a mix
    this.activeTab.set('sounds');
  }

  onPlayPauseClicked() {
    if (this.isPlaying()) {
      // If sounds are playing, pause them
      this.soundsService.pauseAllSounds();
    } else {
      // If sounds are paused or no sounds playing, resume them
      this.soundsService.resumeAllSounds();
    }
  }
}
