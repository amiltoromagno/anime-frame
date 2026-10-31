import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // Change these before the first store release — the Android application ID
  // cannot be changed after publishing.
  appId: 'dev.animeframe.app',
  appName: 'Anime Frame',

  // `nuxt generate` with MOBILE_BUILD=true writes the SPA here.
  webDir: '.output/public',

  server: {
    // Default on Android (Capacitor 5+): the WebView origin is https://localhost,
    // which is also the origin allowlisted in server/middleware/cors.ts.
    androidScheme: 'https',
  },

  android: {
    allowMixedContent: false,
  },
}

export default config
