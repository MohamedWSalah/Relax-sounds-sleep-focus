import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moon.relaxsoundssleepfocus',
  appName: 'Relax Sounds: Sleep Focus',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Ensure plugins configuration is always defined
    App: {
      // App plugin configuration
    },
    Haptics: {
      // Haptics plugin configuration
    },
    Keyboard: {
      // Keyboard plugin configuration
    },
    StatusBar: {
      // StatusBar plugin configuration
    },
  },
  // Add environment configuration to prevent undefined values
  android: {
    // Android-specific configuration
  },
  ios: {
    // iOS-specific configuration
  },
};

export default config;
