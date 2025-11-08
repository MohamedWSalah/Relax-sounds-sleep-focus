import type { Category } from '../types';

/**
 * All available sound categories with their subcategories
 */
export const BASE_CATEGORIES: Category[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: '🌧️',
    subcategories: [
      { id: 'gentle', name: 'Gentle' },
      { id: 'heavy', name: 'Heavy' },
    ],
  },
  {
    id: 'wind',
    name: 'Wind',
    icon: '🌬️',
    subcategories: [
      { id: 'soft', name: 'Soft' },
      { id: 'strong', name: 'Strong' },
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: '🌲',
    subcategories: [
      { id: 'birds', name: 'Birds' },
      { id: 'campfire', name: 'Campfire' },
      { id: 'forest', name: 'Forest' },
    ],
  },
  {
    id: 'beach',
    name: 'Beach',
    icon: '🏖️',
    subcategories: [
      { id: 'waves', name: 'Waves' },
      { id: 'shore', name: 'Shore' },
      { id: 'swimming', name: 'Swimming' },
    ],
  },
  { id: 'city', name: 'City', icon: '🚗' },
  { id: 'asmr', name: 'ASMR', icon: '✨' },
];

/**
 * Default selected category when the app starts
 */
export const DEFAULT_CATEGORY = 'rain';
