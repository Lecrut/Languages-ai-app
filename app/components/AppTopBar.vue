<script setup lang="ts">
import { useDisplay, useTheme } from 'vuetify'
import { useAuthStore } from '../stores/use-auth-store'
import { useUserProfileStore } from '../stores/use-user-profile-store'

const { t, setLocale, locale } = useI18n()
const localePath = useLocalePath()
const theme = useTheme()
const { smAndDown } = useDisplay()
const authStore = useAuthStore()
const userProfileStore = useUserProfileStore()
const route = useRoute()
const router = useRouter()

const isDarkTheme = computed(() => theme.global.name.value === 'dark')
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentRoutePath = computed(() => route.path)
const homePath = computed(() => localePath('/'))
const nextLocale = computed(() => (locale.value === 'pl' ? 'en' : 'pl'))
const nextLocaleLabel = computed(() => (nextLocale.value === 'pl' ? t('app.switchToPl') : t('app.switchToEn')))
const currentProfileTheme = computed(() => userProfileStore.profile?.appTheme ?? null)

const loggedOutNavigationItems = computed(() => [
  {
    title: t('nav.login'),
    icon: 'mdi-login',
    to: localePath('/auth/login'),
  },
])

const guestMobileNavigationItems = computed(() => [
  {
    title: t('nav.login'),
    icon: 'mdi-login',
    to: localePath('/auth/login'),
  },
  {
    title: t('nav.home'),
    icon: 'mdi-home-outline',
    to: localePath('/'),
  },
  {
    title: t('auth.register'),
    icon: 'mdi-account-plus-outline',
    to: localePath('/auth/register'),
  },
])

const loggedInNavigationItems = computed(() => [
  {
    title: t('nav.play'),
    icon: 'mdi-controller',
    to: localePath('/user'),
  },
  {
    title: t('nav.results'),
    icon: 'mdi-trophy-outline',
    to: localePath('/user/results'),
  },
  {
    title: t('nav.profile'),
    icon: 'mdi-account-circle-outline',
    to: localePath('/user/profile'),
  },
])

const navigationItems = computed(() => {
  if (isAuthenticated.value) {
    return loggedInNavigationItems.value
  }

  return loggedOutNavigationItems.value
})

const mobileNavigationItems = computed(() => {
  if (isAuthenticated.value) {
    return loggedInNavigationItems.value
  }

  return guestMobileNavigationItems.value
})

const setTheme = (themeName: 'light' | 'dark') => {
  theme.change(themeName)

  if (!authStore.isAuthenticated || !authStore.user?.uid || !userProfileStore.profile) {
    if (import.meta.client) {
      localStorage.setItem('app-theme', themeName)
    }

    return
  }

  void userProfileStore.updateProfile(authStore.user.uid, {
    nick: userProfileStore.profile.nick,
    appLanguage: userProfileStore.profile.appLanguage,
    learningLanguage: userProfileStore.profile.learningLanguage,
    appTheme: themeName,
    level: userProfileStore.profile.level,
    tasksPerSession: userProfileStore.profile.tasksPerSession,
  })
}

const toggleLocale = () => {
  setLocale(nextLocale.value)
}

const navigateHome = async () => {
  if (route.path === homePath.value) {
    return
  }

  await router.push(homePath.value)
}

const logout = async () => {
  await authStore.logout()
  await router.push(localePath('/auth/login'))
}

watch(
  currentProfileTheme,
  (themeName) => {
    if (themeName === 'light' || themeName === 'dark') {
      theme.change(themeName)
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  if (!authStore.initialized) {
    authStore.initAuth()
  }
})
</script>

<template>
  <VAppBar color="primary" rounded="0">
    <VContainer class="d-flex align-center justify-space-between">
      <VBtn
        variant="text"
        class="font-weight-bold text-body-large px-0 text-none"
        @click="navigateHome"
      >
        {{ t('app.title') }}
      </VBtn>
      <div class="d-flex ga-2">
        <template v-if="!smAndDown">
          <template v-if="isAuthenticated">
            <VBtn
              v-for="item in navigationItems"
              :key="item.to"
              variant="text"
              :to="item.to"
              :prepend-icon="item.icon"
            >
              {{ item.title }}
            </VBtn>

            <VBtn
              variant="text"
              prepend-icon="mdi-logout"
              @click="logout"
            >
              {{ t('nav.logout') }}
            </VBtn>
          </template>

          <VBtn
            v-if="!isAuthenticated"
            size="small"
            variant="outlined"
            class="border-md"
            prepend-icon="mdi-login"
            :to="localePath('/auth/login')"
          >
            {{ t('nav.login') }}
          </VBtn>
        </template>

        <VBtn
          v-if="!isAuthenticated"
          size="small"
          variant="outlined"
          class="border-md"
          :prepend-icon="isDarkTheme ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
          @click="setTheme(isDarkTheme ? 'light' : 'dark')"
        >
          {{ isDarkTheme ? t('app.themeDark') : t('app.themeLight') }}
        </VBtn>
        <VBtn
          v-if="!isAuthenticated"
          size="small"
          variant="outlined"
          class="border-md"
          prepend-icon="mdi-translate"
          @click="toggleLocale"
        >
          {{ nextLocaleLabel }}
        </VBtn>
      </div>
    </VContainer>
  </VAppBar>

  <ClientOnly>
    <VBottomNavigation
      v-if="smAndDown"
      grow
      color="primary"
      rounded="0"
      :model-value="currentRoutePath"
    >
      <VBtn
        v-for="item in mobileNavigationItems"
        :key="item.to"
        :to="item.to"
        :value="item.to"
      >
        <VIcon :icon="item.icon" />
        <span>{{ item.title }}</span>
      </VBtn>
    </VBottomNavigation>
  </ClientOnly>
</template>
