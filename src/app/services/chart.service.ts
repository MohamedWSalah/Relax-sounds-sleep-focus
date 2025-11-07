import { Injectable } from '@angular/core';
import { Chart, registerables } from 'chart.js';

/**
 * Chart Service
 * Handles Chart.js initialization
 * Registers Chart.js components once at app startup
 */
@Injectable({
  providedIn: 'root',
})
export class ChartService {
  private static isRegistered = false;

  constructor() {
    if (!ChartService.isRegistered) {
      Chart.register(...registerables);
      ChartService.isRegistered = true;
    }
  }

  /**
   * Get Chart class for creating charts
   */
  get Chart(): typeof Chart {
    return Chart;
  }
}

