import { Category } from '../services/sounds.service';
import soundsDataJson from './sounds-data.json';

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
  premium?: boolean;
  category: string;
  subcategory?: string;
}

/**
 * Structure of the JSON data file.
 */
interface SoundsDataJson {
  sounds: SoundData[];
  categories: Category[];
  defaultCategory: string;
}

/**
 * All available sounds configuration loaded from JSON.
 * Runtime properties (selected, volume, muted, audio, loading) are added by the service.
 */
export const SOUNDS_DATA: SoundData[] = (
  soundsDataJson as unknown as SoundsDataJson
).sounds;

/**
 * Base categories for sounds loaded from JSON.
 */
export const BASE_CATEGORIES: Category[] = (
  soundsDataJson as unknown as SoundsDataJson
).categories;

/**
 * Default selected category from JSON.
 */
export const DEFAULT_CATEGORY: string = (
  soundsDataJson as unknown as SoundsDataJson
).defaultCategory;
