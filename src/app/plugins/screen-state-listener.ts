import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import type { ScreenStateListenerPlugin } from '../types';

const ScreenStateListener = registerPlugin<ScreenStateListenerPlugin>(
  'ScreenStateListener',
  {
    web: () =>
      import('./screen-state-listener.web').then(
        (m) => new m.ScreenStateListenerWeb()
      ),
  }
);

export default ScreenStateListener;
