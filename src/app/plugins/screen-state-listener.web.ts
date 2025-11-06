import { WebPlugin } from '@capacitor/core';
import type { ScreenStateListenerPlugin } from '../types';

export class ScreenStateListenerWeb
  extends WebPlugin
  implements ScreenStateListenerPlugin
{
  async startListening(): Promise<void> {
    console.log(
      'ScreenStateListener: Web implementation - using Page Visibility API'
    );

    // Use Page Visibility API for web
    if (typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          this.notifyListeners('screenOff', { state: 'off' });
        } else {
          this.notifyListeners('screenOn', { state: 'on' });
          this.notifyListeners('userPresent', { state: 'unlocked' });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
  }

  async stopListening(): Promise<void> {
    console.log('ScreenStateListener: Stopped listening (web)');
  }
}
