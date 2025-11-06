import type { SoundData } from '../types';

export const BEACH_SOUNDS: SoundData[] = [
  {
    id: 'beach-small-waves',
    name: 'Small Waves',
    icon: '🏖️',
    file: 'Beach/beach_small_waves.mp3',
    description: 'Small waves on the beach',
    category: 'beach',
    subcategory: 'gentle',
    premium: false,
  },
  {
    id: 'beach-seaside',
    name: 'Seaside',
    icon: '🏖️',
    file: 'Beach/beach_seaside.mp3',
    description: 'Seaside ambience on the beach',
    category: 'beach',
    subcategory: 'gentle',
    premium: false,
  },
  {
    id: 'beach-slushy-waves',
    name: 'Slushy Waves',
    icon: '🏖️',
    file: 'Beach/beach_slushy_waves.mp3',
    description: 'Slushy waves on the beach',
    category: 'beach',
    subcategory: 'medium',
    premium: true,
  },
  {
    id: 'beach-large-waves',
    name: 'Large Waves',
    icon: '🏖️',
    file: 'Beach/beach_large_waves.mp3',
    description: 'Large waves on the beach',
    category: 'beach',
    subcategory: 'strong',
    premium: true,
  },
];
