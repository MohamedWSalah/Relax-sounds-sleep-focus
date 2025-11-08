/**
 * Base sound data without runtime properties.
 * The service will initialize these with default values for selected, volume, muted, etc.
 */
export interface SoundData {
  id: string;
  name: string;
  icon: string;
  file: string;
  description?: string;
  premium: boolean;
  category: string;
  subcategory?: string;
}

/**
 * Sound with runtime properties added by the service.
 */
export interface Sound {
  id: string;
  name: string;
  icon: string;
  file: string;
  selected: boolean;
  loading?: boolean;
  volume: number; // 0-1 range
  muted: boolean;
  audio?: HTMLAudioElement;
  description?: string;
  premium?: boolean;
  category: string;
  subcategory?: string;
}

/**
 * Subcategory for organizing sounds within a category.
 */
export interface Subcategory {
  id: string;
  name: string;
}

/**
 * Category for organizing sounds.
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories?: Subcategory[];
}
