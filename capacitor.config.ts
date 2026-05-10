import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.academiavallenata.app',
  appName: 'Academia Vallenata',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // url descomenta para dev en LAN: 'http://192.168.X.X:5173'
    cleartext: true,
  },
  android: {
    backgroundColor: '#1f2937',
    // permite arrancar full-screen, sigue tu manifest.json
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1f2937',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1f2937',
    },
  },
};

export default config;
