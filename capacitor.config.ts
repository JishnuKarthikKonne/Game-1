import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.paradox.game',
  appName: 'PARADOX',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    CapacitorCookies: {
      enabled: false,
    },
    CapacitorHttp: {
      enabled: false,
    },
  },
};

export default config;
