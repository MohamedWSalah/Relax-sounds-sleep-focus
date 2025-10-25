import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Signal to track current theme
  currentTheme = signal<Theme>('dark');

  constructor() {
    // Load saved theme or detect system preference
    this.initializeTheme();

    // Effect to update DOM and save preference when theme changes
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      localStorage.setItem('theme', theme);
    });
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme') as Theme;

    if (savedTheme) {
      this.currentTheme.set(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      this.currentTheme.set(prefersDark ? 'dark' : 'light');
    }
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(theme: Theme): void {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.currentTheme.set(newTheme);
  }

  /**
   * Set specific theme
   */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme();
  }

  /**
   * Check if current theme is dark
   */
  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }

  /**
   * Check if current theme is light
   */
  isLight(): boolean {
    return this.currentTheme() === 'light';
  }
}

