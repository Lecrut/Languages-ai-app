<script setup lang="ts">
import { useTheme } from 'vuetify'

const { t, setLocale } = useI18n()
const theme = useTheme()

const isDarkTheme = computed(() => theme.global.name.value === 'dark')

const setTheme = (themeName: 'light' | 'dark') => {
  theme.global.name.value = themeName

  if (import.meta.client) {
    localStorage.setItem('app-theme', themeName)
  }
}

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  const storedTheme = localStorage.getItem('app-theme')

  if (storedTheme === 'light' || storedTheme === 'dark') {
    theme.global.name.value = storedTheme
  }
})
</script>

<template>
  <VAppBar color="primary">
    <VContainer class="d-flex align-center justify-space-between">
      <div class="text-h6 font-weight-bold">{{ t('app.title') }}</div>
      <div class="d-flex ga-2">
        <VBtn variant="text" to="/">{{ t('nav.home') }}</VBtn>
        <VBtn variant="text" to="/auth">{{ t('nav.auth') }}</VBtn>
        <VBtn variant="text" to="/user/profile">{{ t('nav.profile') }}</VBtn>
        <VBtn
          size="small"
          variant="outlined"
          :prepend-icon="isDarkTheme ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
          @click="setTheme(isDarkTheme ? 'light' : 'dark')"
        >
          {{ isDarkTheme ? t('app.themeDark') : t('app.themeLight') }}
        </VBtn>
        <VBtn size="small" variant="outlined" @click="setLocale('pl')">{{ t('app.switchToPl') }}</VBtn>
        <VBtn size="small" variant="outlined" @click="setLocale('en')">{{ t('app.switchToEn') }}</VBtn>
      </div>
    </VContainer>
  </VAppBar>
</template>
