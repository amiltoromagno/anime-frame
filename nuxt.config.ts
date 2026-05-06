// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  nitro: {
    preset: 'cloudflare_pages',
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
    public: {
      malClientId: '',
      malRedirectUri: 'http://localhost:3000/auth/callback',
      malApiBaseUrl: 'https://api.myanimelist.net/v2',
    },
  },

  app: {
    head: {
      title: 'Anime Frame — Your Modern Anime Tracker',
      meta: [
        { name: 'description', content: 'Track, discover, and explore anime with Anime Frame — a modern anime database powered by Jikan API.' },
      ],
      link: [
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
