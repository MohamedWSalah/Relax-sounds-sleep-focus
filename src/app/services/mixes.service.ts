import { Injectable, signal } from '@angular/core';

export interface MixSound {
  id: string;
  volume: number;
}

export interface Mix {
  name: string;
  sounds: MixSound[];
  createdAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class MixesService {
  private readonly STORAGE_KEY = 'sleep_calm_mixes';
  private mixesSignal = signal<Mix[]>([]);

  constructor() {
    this.loadMixesFromStorage();
  }

  // Get all mixes
  getMixes() {
    return this.mixesSignal;
  }

  // Load mixes from localStorage
  private loadMixesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const mixes = JSON.parse(stored) as Mix[];
        this.mixesSignal.set(mixes);
      }
    } catch (error) {
      console.error('Error loading mixes:', error);
      this.mixesSignal.set([]);
    }
  }

  // Save mixes to localStorage
  private saveMixesToStorage(mixes: Mix[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mixes));
      this.mixesSignal.set(mixes);
    } catch (error) {
      console.error('Error saving mixes:', error);
    }
  }

  // Save or update a mix
  saveMix(
    name: string,
    sounds: MixSound[]
  ): { success: boolean; isUpdate: boolean } {
    if (!name || !name.trim()) {
      return { success: false, isUpdate: false };
    }

    if (!sounds || sounds.length === 0) {
      return { success: false, isUpdate: false };
    }

    const currentMixes = [...this.mixesSignal()];
    const existingIndex = currentMixes.findIndex(
      (mix) => mix.name.toLowerCase() === name.trim().toLowerCase()
    );

    const newMix: Mix = {
      name: name.trim(),
      sounds: sounds,
      createdAt: Date.now(),
    };

    if (existingIndex >= 0) {
      // Update existing mix
      currentMixes[existingIndex] = newMix;
      this.saveMixesToStorage(currentMixes);
      return { success: true, isUpdate: true };
    } else {
      // Create new mix
      currentMixes.push(newMix);
      this.saveMixesToStorage(currentMixes);
      return { success: true, isUpdate: false };
    }
  }

  // Delete a mix
  deleteMix(name: string): boolean {
    const currentMixes = [...this.mixesSignal()];
    const filteredMixes = currentMixes.filter(
      (mix) => mix.name.toLowerCase() !== name.toLowerCase()
    );

    if (filteredMixes.length === currentMixes.length) {
      return false; // Mix not found
    }

    this.saveMixesToStorage(filteredMixes);
    return true;
  }

  // Get a specific mix by name
  getMix(name: string): Mix | undefined {
    return this.mixesSignal().find(
      (mix) => mix.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Check if a mix name already exists
  mixExists(name: string): boolean {
    return this.mixesSignal().some(
      (mix) => mix.name.toLowerCase() === name.trim().toLowerCase()
    );
  }
}
