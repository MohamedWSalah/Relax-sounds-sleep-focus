import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Location } from '@angular/common';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [CommonModule, IonicModule],
})
export class SettingsPage implements OnInit {
  backgroundParticles: number[] = [];

  // Settings state
  masterVolume = signal(80);
  highQualityAudio = signal(true);
  sleepTimer = signal('off');
  darkMode = signal(true);
  notifications = signal(true);
  backgroundPlay = signal(true);

  constructor(private location: Location) {}

  ngOnInit(): void {
    // Generate background particles
    this.backgroundParticles = Array.from({ length: 25 }, (_, i) => i);
  }

  goBack(): void {
    this.location.back();
  }

  setMasterVolume(value: number): void {
    this.masterVolume.set(value);
  }

  toggleHighQuality(checked: boolean): void {
    this.highQualityAudio.set(checked);
  }

  setSleepTimer(value: string): void {
    this.sleepTimer.set(value);
  }

  toggleDarkMode(checked: boolean): void {
    this.darkMode.set(checked);
  }

  toggleNotifications(checked: boolean): void {
    this.notifications.set(checked);
  }

  toggleBackgroundPlay(checked: boolean): void {
    this.backgroundPlay.set(checked);
  }

  openPremium(): void {
    // Navigate to premium modal or page
    console.log('Open premium');
  }

  openPrivacy(): void {
    // Open privacy policy
    console.log('Open privacy policy');
  }

  openTerms(): void {
    // Open terms of service
    console.log('Open terms of service');
  }
}
