/**
 * Sound configuration within a mix.
 */
export interface MixSound {
  id: string;
  volume: number;
}

/**
 * Saved mix configuration.
 */
export interface Mix {
  name: string;
  sounds: MixSound[];
  createdAt: number;
}

