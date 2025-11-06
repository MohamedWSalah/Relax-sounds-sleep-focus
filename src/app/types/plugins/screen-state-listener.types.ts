import type { PluginListenerHandle } from '@capacitor/core';

/**
 * Screen state listener plugin interface for Capacitor.
 */
export interface ScreenStateListenerPlugin {
  /**
   * Start listening to screen state changes
   */
  startListening(): Promise<void>;

  /**
   * Stop listening to screen state changes
   */
  stopListening(): Promise<void>;

  /**
   * Listen for screen on events
   */
  addListener(
    eventName: 'screenOn',
    listenerFunc: (data: { state: 'on' }) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Listen for screen off events
   */
  addListener(
    eventName: 'screenOff',
    listenerFunc: (data: { state: 'off' }) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Listen for user present (unlocked) events
   */
  addListener(
    eventName: 'userPresent',
    listenerFunc: (data: { state: 'unlocked' }) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Remove all listeners for this plugin
   */
  removeAllListeners(): Promise<void>;
}

