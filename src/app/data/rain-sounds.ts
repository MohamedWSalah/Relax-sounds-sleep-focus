import type { SoundData } from '../types';

/**
 * Rain category sounds
 */
export const RAIN_SOUNDS: SoundData[] = [
  {
    id: 'rain-light',
    name: 'Light Rain',
    icon: '🌧️',
    file: 'Rain/rain_light.mp3',
    description: 'Gentle rain noise',
    category: 'rain',
    subcategory: 'gentle',
    premium: false,
  },
  {
    id: 'rain-window',
    name: 'Rain on Window',
    icon: '🌧️',
    file: 'Rain/rain_on_window.mp3',
    description: 'Soft rain hitting glass',
    category: 'rain',
    subcategory: 'gentle',
    premium: false,
  },
  {
    id: 'rain-heavy',
    name: 'Heavy Rain',
    icon: '🌧️',
    file: 'Rain/rain_heavy.mp3',
    description: 'Intense rainfall',
    category: 'rain',
    subcategory: 'heavy',
    premium: false,
  },
  {
    id: 'rain-thunderstorm',
    name: 'Thunderstorm Rain',
    icon: '🌧️',
    file: 'Rain/rain_thunderstorm.mp3',
    description: 'Heavy rain + thunder',
    category: 'rain',
    subcategory: 'heavy',
    premium: true,
  },
];
