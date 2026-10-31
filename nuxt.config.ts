// https://nuxt.com/docs/api/configuration/nuxt-config

// The Android/Capacitor build is a static SPA: no Nitro server runs on the
// device, so API calls go to the deployed Cloudflare origin instead.
const isMobileBuild = process.env.MOBILE_BUILD === 'true'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: !isMobileBuild,

  nitro: {
    preset: isMobileBuild ? 'static' : 'cloudflare_pages',
  },

  css: ['~/assets/css/app.css'],

  vite: {
    plugins: [
      // @ts-ignore
      (await import('@tailwindcss/vite')).default(),
    ],
  },

  runtimeConfig: {
    // Private — server-side only, never exposed to the browser
    malClientSecret: '',
    // Extra CORS origins for the native app / live reload (comma-separated)
    corsAllowedOrigins: '',
    public: {
      malClientId: '',
      malRedirectUri: 'http://localhost:3000/auth/callback',
      malApiBaseUrl: 'https://api.myanimelist.net/v2',
      // Absolute API origin for the mobile build. Empty = same origin (web).
      apiBase: '',
    },
  },

  app: {
    head: {
      title: 'Anime Frame — Your Modern Anime Tracker',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Track, discover, and explore anime with Anime Frame — a modern anime database powered by the official MyAnimeList API.' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'alternate icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap' },
      ],
      htmlAttrs: {
        'data-theme': 'dark',
      },
    },
  },
})
