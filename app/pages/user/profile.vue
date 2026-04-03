<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../../stores/use-auth-store'
import { useUserProfileStore } from '../../stores/use-user-profile-store'
import { useSnackbarStore } from '../../stores/use-snackbar-store'
import { DEFAULT_LEARNING_LEVEL, LEARNING_LEVELS, type LearningLevel } from '../../constants/learning-levels'
import { TASKS_PER_SESSION_DEFAULT, TASKS_PER_SESSION_MAX, TASKS_PER_SESSION_MIN, clampTasksPerSession } from '../../constants/task-session-settings'

definePageMeta({
  middleware: 'auth',
})

type AppLocale = 'pl' | 'en'

const { t, locale, setLocale } = useI18n()
const authStore = useAuthStore()
const userProfileStore = useUserProfileStore()
const snackbarStore = useSnackbarStore()
const { setPageTitle } = usePageHead()

onMounted(() => {
  setPageTitle(t('profile.title'))
})

const profile = computed(() => userProfileStore.profile)
const nick = ref('')
const appLanguage = ref<AppLocale>('pl')
const learningLanguage = ref<string>('en')
const appTheme = ref<'light' | 'dark'>('light')
const level = ref<LearningLevel>(DEFAULT_LEARNING_LEVEL)
const tasksPerSession = ref(TASKS_PER_SESSION_DEFAULT)
const isEditing = ref(false)
const saveSuccess = ref(false)

const appLanguageOptions = computed(() => [
  { title: t('profile.languagePolishWithCode'), value: 'pl' as const },
  { title: t('profile.languageEnglishWithCode'), value: 'en' as const },
])

const learningLanguageOptions = computed(() => [
  { title: t('profile.languageEnglish'), value: 'en' },
  { title: t('profile.languageGerman'), value: 'de' },
  { title: t('profile.languageSpanish'), value: 'es' },
  { title: t('profile.languageFrench'), value: 'fr' },
  { title: t('profile.languageItalian'), value: 'it' },
])

const levelOptions = computed(() => LEARNING_LEVELS.map(item => ({
  title: item.toUpperCase(),
  value: item,
})))

const createdAtFormatted = computed(() => {
  if (!profile.value?.createdAt) {
    return '-'
  }

  return new Date(profile.value.createdAt).toLocaleString()
})
const themeLabel = computed(() => (profile.value?.appTheme === 'dark' ? t('app.themeDark') : t('app.themeLight')))
const themeFieldLabel = computed(() => (locale.value === 'pl' ? 'Motyw' : 'Theme'))
const themeOptions = computed(() => [
  { title: t('app.themeLight'), value: 'light' as const },
  { title: t('app.themeDark'), value: 'dark' as const },
])

const syncFormFromProfile = () => {
  if (!profile.value) {
    return
  }

  nick.value = profile.value.nick
  appLanguage.value = profile.value.appLanguage === 'en' ? 'en' : 'pl'
  learningLanguage.value = profile.value.learningLanguage
  appTheme.value = profile.value.appTheme ?? 'light'
  level.value = profile.value.level ?? DEFAULT_LEARNING_LEVEL
  tasksPerSession.value = clampTasksPerSession(profile.value.tasksPerSession)
}

watch(
  profile,
  () => {
    syncFormFromProfile()
  },
  { immediate: true },
)

const canSaveProfile = computed(() => Boolean(profile.value) && Boolean(nick.value.trim()) && Boolean(authStore.user?.uid))

const startEditing = () => {
  if (!profile.value) {
    return
  }

  saveSuccess.value = false
  userProfileStore.clearProfileError()
  syncFormFromProfile()
  isEditing.value = true
}

const cancelEditing = () => {
  syncFormFromProfile()
  saveSuccess.value = false
  isEditing.value = false
}

const handleSaveProfile = async () => {
  const uid = authStore.user?.uid
  if (!uid) {
    return
  }

  saveSuccess.value = false

  try {
    await userProfileStore.updateProfile(uid, {
      nick: nick.value.trim(),
      appLanguage: appLanguage.value,
      learningLanguage: learningLanguage.value,
      appTheme: appTheme.value,
      level: level.value,
      tasksPerSession: clampTasksPerSession(tasksPerSession.value),
    })

    if (locale.value !== appLanguage.value) {
      await setLocale(appLanguage.value)
    }

    snackbarStore.showSuccess(t('profile.saveSuccess'))
    isEditing.value = false
  }
  catch {
    // handled by store
  }
}
</script>

<template>
  <VRow justify="center">
    <VCol cols="12" md="10" lg="7">
      <VCard class="pa-2 pa-sm-4 pa-md-6">
        <VCardTitle class="text-headline-large text-center my-3">{{ t('profile.title') }}</VCardTitle>

        <VCardText class="d-flex flex-column ga-4">
          <VAlert
            v-if="userProfileStore.error"
            type="error"
            variant="tonal"
          >
            {{ userProfileStore.error }}
          </VAlert>

          <VTextField
            :model-value="authStore.user?.email ?? profile?.email ?? '-'"
            :label="t('profile.email')"
            prepend-inner-icon="mdi-email-outline"
            variant="outlined"
            readonly
          />

          <VTextField
            v-model="nick"
            :label="t('profile.nick')"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            :readonly="!isEditing"
          />

          <VSelect
            v-model="appLanguage"
            :items="appLanguageOptions"
            item-title="title"
            item-value="value"
            :label="t('profile.appLanguage')"
            prepend-inner-icon="mdi-translate"
            variant="outlined"
            :readonly="!isEditing"
          />

          <VSelect
            v-model="learningLanguage"
            :items="learningLanguageOptions"
            item-title="title"
            item-value="value"
            :label="t('profile.learningLanguage')"
            prepend-inner-icon="mdi-book-open-page-variant"
            variant="outlined"
            :readonly="!isEditing"
          />

          <VTextField
            v-if="!isEditing"
            :model-value="themeLabel"
            :label="themeFieldLabel"
            prepend-inner-icon="mdi-theme-light-dark"
            variant="outlined"
            readonly
          />

          <VSelect
            v-else
            v-model="appTheme"
            :items="themeOptions"
            item-title="title"
            item-value="value"
            :label="themeFieldLabel"
            prepend-inner-icon="mdi-theme-light-dark"
            variant="outlined"
          />

          <VSelect
            v-model="level"
            :items="levelOptions"
            item-title="title"
            item-value="value"
            :label="t('profile.learningLevel')"
            prepend-inner-icon="mdi-school"
            variant="outlined"
            :readonly="!isEditing"
          />

          <div>
            <VSlider
              v-model="tasksPerSession"
              :label="t('profile.tasksPerSession')"
              :min="TASKS_PER_SESSION_MIN"
              :max="TASKS_PER_SESSION_MAX"
              :step="1"
              :thumb-label="true"
              color="primary"
              :disabled="!isEditing"
              class="mt-2"
            />
            <div class="text-body-small text-medium-emphasis">
              {{ t('profile.tasksPerSessionHint', { min: TASKS_PER_SESSION_MIN, max: TASKS_PER_SESSION_MAX }) }}
            </div>
          </div>

        </VCardText>

        <VCardActions class="justify-center pb-4 pb-md-6 d-flex flex-column align-center ga-2">
          <template v-if="isEditing">
            <VBtn
              color="primary"
              size="large"
              class="px-10"
              :disabled="!canSaveProfile || userProfileStore.loading"
              :loading="userProfileStore.saving || userProfileStore.loading"
              @click="handleSaveProfile"
            >
              {{ t('profile.save') }}
            </VBtn>

            <VBtn
              variant="text"
              color="secondary"
              :disabled="userProfileStore.saving || userProfileStore.loading"
              @click="cancelEditing"
            >
              {{ t('profile.cancel') }}
            </VBtn>
          </template>

          <VBtn
            v-else
            color="primary"
            size="large"
            class="px-10"
            :disabled="!profile || userProfileStore.loading"
            @click="startEditing"
          >
            {{ t('profile.edit') }}
          </VBtn>
        </VCardActions>

        <VCardText class="pt-0 pb-6 text-body-medium text-medium-emphasis text-center">
          {{ t('profile.createdAt') }}: {{ createdAtFormatted }}
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
