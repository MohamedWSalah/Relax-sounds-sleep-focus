import type { SoundData } from '../types';

/**
 * Wind category sounds
 */
export const WIND_SOUNDS: SoundData[] = [
  {
    id: 'wind-trees',
    name: 'Wind Through Trees',
    icon: '🌬️',
    file: 'Wind/wind_in_trees.mp3',
    description: 'Leaves swaying in wind',
    category: 'wind',
    subcategory: 'soft',
    premium: false,
  },
  {
    id: 'wind-winter',
    name: 'Winter Wind',
    icon: '🌬️',
    file: 'Wind/wind_winter.mp3',
    description: 'Cold winter wind',
    category: 'wind',
    subcategory: 'strong',
    premium: true,
  },
  {
    id: 'wind-gusts',
    name: 'Wind Gusts',
    icon: '🌬️',
    file: 'Wind/wind_gusts.mp3',
    description: 'Heavy windy gusts',
    category: 'wind',
    subcategory: 'strong',
    premium: true,
  },
];

