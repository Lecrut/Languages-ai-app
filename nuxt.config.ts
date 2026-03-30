// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@vite-pwa/nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/html-validator',
    '@nuxtjs/google-fonts',
    '@nuxt/scripts',
    '@nuxt/image',
    '@logto/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/seo',
    '@nuxtjs/device',
    '@nuxtjs/emotion',
    '@nuxtjs/eslint-module'
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Languages AI',
      short_name: 'LangAI',
      description: 'Personalized English learning app with AI generated tasks',
      theme_color: '#0a2e6d',
      background_color: '#eaf6ff',
      display: 'standalone',
      orientation: 'portrait',
      lang: 'pl',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,json,woff2}'],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },

  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css'
  ],

  build: {
    transpile: ['vuetify']
  },

  vite: {
    ssr: {
      noExternal: ['vuetify']
    }
  },

  i18n: {
    defaultLocale: 'pl',
    strategy: 'prefix_except_default',
    langDir: 'locales',
    locales: [
      { code: 'pl', name: 'Polski', file: 'pl.json' },
      { code: 'en', name: 'English', file: 'en.json' }
    ]
  },

  runtimeConfig: {
    public: {
      apiKey: import.meta.env.apiKey,
      authDomain: import.meta.env.authDomain,
      projectId: import.meta.env.projectId,
      storageBucket: import.meta.env.storageBucket,
      messagingSenderId: import.meta.env.messagingSenderId,
      appId: import.meta.env.appId,
      measurementId: import.meta.env.measurementId,
    },
  },
})