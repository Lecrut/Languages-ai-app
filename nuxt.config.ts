// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  app: {
    head: {
      title: 'Lingai',
      titleTemplate: '%s | Lingai',
      htmlAttrs: {
        lang: 'pl',
      },
      meta: [
        {
          name: 'description',
          content: 'Personalized English learning app with AI generated tasks',
        },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/images/logo_blue.png',
        },
        {
          rel: 'shortcut icon',
          type: 'image/png',
          href: '/images/logo_blue.png',
        },
        {
          rel: 'apple-touch-icon',
          href: '/images/logo_blue.png',
        },
      ],
    },
  },

  plugins: [
    '~~/plugins/vuetify.ts',
    '~~/plugins/auth-init.client.ts',
    '~~/plugins/pwa-dev-cleanup.client.ts',
  ],

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
    '@nuxtjs/google-fonts',
    '@nuxt/scripts',
    '@nuxt/image',
    '@pinia/nuxt',
    '@nuxtjs/seo',
    '@nuxtjs/device',
    '@nuxtjs/emotion'
  ],

  ogImage: {
    zeroRuntime: true,
  },

  googleFonts: {
    families: {
      'Open Sans': [400, 600, 700],
      'Plus Jakarta Sans': [400, 500, 600, 700],
    },
    display: 'swap',
  },

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
    },
    devOptions: {
      enabled: false,
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
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'workbox-window',
        'firebase/auth',
        'firebase/app',
      ],
    },
    ssr: {
      noExternal: ['vuetify']
    }
  },

  i18n: {
    restructureDir: '',
    vueI18n: './i18n.config.ts',
    langDir: 'locales',
    defaultLocale: 'pl',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'pl', name: 'Polski', language: 'pl-PL', file: 'pl.json' },
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' }
    ]
  },

  site: {
    name: 'Lingai',
    url: process.env.SITE_URL || 'https://languages-ai.vercel.app',
  },

  robots: {
    groups: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin'],
      },
    ],
  },

  sitemap: {
    sources: ['/sitemap.xml'],
  },

  runtimeConfig: {
    public: {
      appName: import.meta.env.APP_NAME || 'Lingai',
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