import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vehicletracker.app',
  appName: 'vehicle-expense-tracker',
  webDir: 'build',
  server: {
    url: 'http://localhost:3000',
    cleartext: true
  }
};

export default config;
