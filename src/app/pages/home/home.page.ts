import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

interface Sound {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [CommonModule, IonicModule],
})
export class HomePage implements OnInit {
  sounds: Sound[] = [
    { id: 'rain', name: 'Rain', icon: '🌧️', selected: false },
    { id: 'ocean', name: 'Ocean', icon: '🌊', selected: false },
    { id: 'wind', name: 'Wind', icon: '🌬️', selected: false },
    { id: 'campfire', name: 'Campfire', icon: '🔥', selected: false },
    { id: 'birds', name: 'Birds', icon: '🐦', selected: false },
    { id: 'thunder', name: 'Thunder', icon: '🌩️', selected: false },
  ];

  constructor() {}

  ngOnInit(): void {}

  toggleSound(sound: Sound): void {
    sound.selected = !sound.selected;
  }
}
