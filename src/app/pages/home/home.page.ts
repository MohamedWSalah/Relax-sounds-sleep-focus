import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

interface Sound {
  id: string;
  name: string;
  icon: string;
  file: string;
  selected: boolean;
  loading?: boolean;
  volume: number; // 0-1 range
  muted: boolean;
  audio?: HTMLAudioElement;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit, OnDestroy {
  sounds = signal<Sound[]>([
    {
      id: 'rain',
      name: 'Rain',
      icon: '🌧️',
      file: 'rain.mp3',
      selected: false,
      volume: 1,
      muted: false,
    },
    {
      id: 'ocean',
      name: 'Ocean',
      icon: '🌊',
      file: 'ocean.mp3',
      selected: false,
      volume: 1,
      muted: false,
    },
    {
      id: 'wind',
      name: 'Wind',
      icon: '🌬️',
      file: 'wind.mp3',
      selected: false,
      volume: 1,
      muted: false,
    },
    {
      id: 'campfire',
      name: 'Campfire',
      icon: '🔥',
      file: 'campfire.mp3',
      selected: false,
      volume: 1,
      muted: false,
    },
    {
      id: 'birds',
      name: 'Birds',
      icon: '🐦',
      file: 'birds.mp3',
      selected: false,
      volume: 1,
      muted: false,
    },
    {
      id: 'crickets',
      name: 'Crickets',
      icon: '🦗',
      file: 'crickets.mp3',
      selected: false,
      volume: 1,
      muted: false,
    },
    {
      id: 'thunder',
      name: 'Thunder',
      icon: '🌩️',
      file: 'thunder.mp3',
      selected: false,
      volume: 1,
      muted: false,
    },
    {
      id: 'test-loop',
      name: 'Test Loop',
      icon: '🔊',
      file: 'test-loop.mp3',
      selected: false,
      volume: 1,
      muted: false,
    },
  ]);

  constructor() {}

  ngOnInit(): void {}

  private updateSoundProperty(
    soundId: string,
    property: keyof Sound,
    value: any
  ): void {
    const currentSounds = this.sounds();
    const updatedSounds = currentSounds.map((s) => {
      if (s.id === soundId) {
        // Preserve the audio instance when updating
        const updatedSound = { ...s, [property]: value };
        if (s.audio) {
          updatedSound.audio = s.audio;
        }
        return updatedSound;
      }
      return s;
    });
    this.sounds.set(updatedSounds);
  }

  toggleSound(sound: Sound): void {
    const currentSounds = this.sounds();
    const updatedSounds = currentSounds.map((s) => {
      if (s.id === sound.id) {
        // Preserve the audio instance when updating
        const updatedSound = { ...s, selected: !s.selected };
        if (s.audio) {
          updatedSound.audio = s.audio;
        }
        return updatedSound;
      }
      return s;
    });
    this.sounds.set(updatedSounds);

    const updatedSound = updatedSounds.find((s) => s.id === sound.id)!;
    if (updatedSound.selected) {
      this.playSound(updatedSound);
    } else {
      this.stopSound(updatedSound);
    }
  }

  playSound(sound: Sound): void {
    if (!sound.audio) {
      this.updateSoundProperty(sound.id, 'loading', true);
      const audio = new Audio(`assets/sounds/${sound.file}`);
      audio.loop = true;
      audio.volume = 0;

      // Handle audio loading
      audio.addEventListener('canplaythrough', () => {
        this.updateSoundProperty(sound.id, 'loading', false);
      });

      // Handle audio loading errors
      audio.addEventListener('error', (e) => {
        console.warn(`Failed to load sound: ${sound.name}`, e);
        this.updateSoundProperty(sound.id, 'loading', false);
      });

      // Update the signal with the new audio instance
      const currentSounds = this.sounds();
      const updatedSounds = currentSounds.map((s) => {
        if (s.id === sound.id) {
          return { ...s, audio };
        }
        return s;
      });
      this.sounds.set(updatedSounds);
      sound.audio = audio;
    }

    sound.audio.play().catch((error) => {
      console.warn(`Failed to play sound: ${sound.name}`, error);
      this.updateSoundProperty(sound.id, 'loading', false);
    });

    // Set volume based on current settings
    const targetVolume = sound.muted ? 0 : sound.volume;
    this.fadeAudio(sound.audio, targetVolume, 500);
  }

  stopSound(sound: Sound): void {
    if (sound.audio) {
      this.fadeAudio(sound.audio, 0, 500, () => {
        sound.audio?.pause();
        sound.audio!.currentTime = 0;
      });
    }
  }

  fadeAudio(
    audio: HTMLAudioElement,
    toVolume: number,
    duration: number,
    onComplete?: () => void
  ): void {
    // Clear any existing fade interval for this audio
    if (audio.dataset['fadeInterval']) {
      clearInterval(parseInt(audio.dataset['fadeInterval']));
    }

    const steps = 20;
    const stepTime = duration / steps;
    const delta = (toVolume - audio.volume) / steps;
    let step = 0;

    const fadeInterval = setInterval(() => {
      audio.volume = Math.max(0, Math.min(1, audio.volume + delta));
      step++;
      if (step >= steps || Math.abs(audio.volume - toVolume) < 0.01) {
        audio.volume = toVolume;
        clearInterval(fadeInterval);
        delete audio.dataset['fadeInterval'];
        if (onComplete) onComplete();
      }
    }, stepTime);

    // Store interval ID for cleanup
    audio.dataset['fadeInterval'] = fadeInterval.toString();
  }

  stopAllSounds(): void {
    this.sounds().forEach((sound) => {
      if (sound.audio) {
        sound.audio.pause();
        sound.audio.currentTime = 0;
        sound.audio.volume = 0;
        // Clear any pending fade intervals
        if (sound.audio.dataset['fadeInterval']) {
          clearInterval(parseInt(sound.audio.dataset['fadeInterval']));
          delete sound.audio.dataset['fadeInterval'];
        }
      }
    });

    // Reset all sounds to unselected state
    const currentSounds = this.sounds();
    const updatedSounds = currentSounds.map((s) => ({ ...s, selected: false }));
    this.sounds.set(updatedSounds);
  }

  setVolume(
    sound: Sound,
    value: number | { value: number } | { lower: number; upper: number }
  ): void {
    let volumeValue: number;
    if (typeof value === 'number') {
      volumeValue = value;
    } else if ('value' in value) {
      volumeValue = value.value;
    } else {
      volumeValue = value.lower; // Use lower value for range
    }

    const newVolume = volumeValue / 100; // Convert from 0-100 to 0-1
    this.updateSoundProperty(sound.id, 'volume', newVolume);

    const updatedSound = this.sounds().find((s) => s.id === sound.id)!;
    if (updatedSound.audio && !updatedSound.muted) {
      updatedSound.audio.volume = newVolume;
    }
  }

  toggleMute(sound: Sound): void {
    this.updateSoundProperty(sound.id, 'muted', !sound.muted);

    const updatedSound = this.sounds().find((s) => s.id === sound.id)!;
    if (updatedSound.audio) {
      updatedSound.audio.volume = updatedSound.muted ? 0 : updatedSound.volume;
    }
  }

  ngOnDestroy(): void {
    this.stopAllSounds();
  }
}
