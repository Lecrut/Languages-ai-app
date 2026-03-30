// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@nuxtjs/html-validator',
    '@nuxtjs/google-fonts',
    '@nuxt/ui',
    '@nuxt/scripts',
    '@nuxt/image',
    '@logto/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/seo',
    '@nuxtjs/device',
    '@nuxtjs/emotion',
    '@nuxtjs/eslint-module',
    '@nuxtjs/tailwindcss'
  ],

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