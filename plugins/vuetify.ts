import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    defaults: {
      global: {
        rounded: 'xl',
      },
      VCard: {
        rounded: 'xl',
        elevation: 6,
      },
      VBtn: {
        rounded: 'xl',
      },
      VTextField: {
        variant: 'outlined',
      },
      VAlert: {
        rounded: 'lg',
      },
    },
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          dark: false,
          colors: {
            background: '#eaf6ff',
            surface: '#f7fbff',
            primary: '#0a2e6d',
            secondary: '#2456a8',
            info: '#1f6fe5',
            success: '#0f766e',
            warning: '#b45309',
            error: '#b91c1c',
          },
        },
        dark: {
          dark: true,
          colors: {
            background: '#0a0c10',
            surface: '#161a22',
            primary: '#3b82f6',
            secondary: '#60a5fa',
            info: '#93c5fd',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
          },
        },
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
