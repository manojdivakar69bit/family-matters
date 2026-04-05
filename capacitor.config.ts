import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.callmyfamily.app',
  appName: 'Call My Family',
  webDir: 'dist',
  server: {
    url: "https://aaa4df69-e823-426b-b73f-a01f09c3246e.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
};

export default config;
