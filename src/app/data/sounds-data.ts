import { RAIN_SOUNDS } from './rain-sounds';
import { WIND_SOUNDS } from './wind-sounds';
import { NATURE_SOUNDS } from './nature-sounds';
import type { SoundData } from '../types';
import { BEACH_SOUNDS } from './beach-sounds';
import { CITY_SOUNDS } from './city-sounds';
import { ASMR_SOUNDS } from './ASMR-sounds';
export { BASE_CATEGORIES, DEFAULT_CATEGORY } from './categories';
export type { Category } from '../types';

/**
 * All available sounds configuration combined from separate category files.
 * Runtime properties (selected, volume, muted, audio, loading) are added by the service.
 */
export const SOUNDS_DATA: SoundData[] = [
  ...RAIN_SOUNDS,
  ...WIND_SOUNDS,
  ...NATURE_SOUNDS,
  ...BEACH_SOUNDS,
  ...CITY_SOUNDS,
  ...ASMR_SOUNDS,
];
