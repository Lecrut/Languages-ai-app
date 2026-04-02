<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../../stores/use-auth-store'
import { useUserProfileStore } from '../../stores/use-user-profile-store'
import {
  TASKS_PER_SESSION_DEFAULT,
  TASKS_PER_SESSION_MAX,
  TASKS_PER_SESSION_MIN,
  clampTasksPerSession,
} from '../../constants/task-session-settings'

definePageMeta({
  middleware: 'auth',
})

const { t, setLocale, locale } = useI18n()
const authStore = useAuthStore()
const userProfileStore = useUserProfileStore()
const { setPageTitle } = usePageHead()
type AppLocale = 'pl' | 'en'

onMounted(() => {
  setPageTitle(t('profile.title'))
})

const nick = ref('')
const appLanguage = ref<AppLocale>('pl')
const learningLanguage = ref('en')
const tasksPerSession = ref(TASKS_PER_SESSION_DEFAULT)
const saveSuccess = ref(false)
const isEditing = ref(false)

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

const profile = computed(() => userProfileStore.profile)

const createdAtFormatted = computed(() => {
  if (!profile.value?.createdAt) {
    return '-'
  }

  return new Date(profile.value.createdAt).toLocaleString()
})

const syncFormFromProfile = () => {
  if (!profile.value) {
    return
  }

  nick.value = profile.value.nick
  appLanguage.value = profile.value.appLanguage === 'en' ? 'en' : 'pl'
  learningLanguage.value = profile.value.learningLanguage
  tasksPerSession.value = clampTasksPerSession(profile.value.tasksPerSession)
}

const startEditing = () => {
  if (!profile.value) {
    return
  }

  userProfileStore.clearProfileError()
  saveSuccess.value = false
  isEditing.value = true
}

const cancelEditing = async () => {
  if (!profile.value) {
    return
  }

  syncFormFromProfile()
  saveSuccess.value = false
  userProfileStore.clearProfileError()
  isEditing.value = false

  const nextLocale: AppLocale = profile.value.appLanguage === 'en' ? 'en' : 'pl'

  if (locale.value !== nextLocale) {
    await setLocale(nextLocale)
  }
}

const isFormDirty = computed(() => {
  if (!profile.value) {
    return false
  }

  return nick.value !== profile.value.nick
    || appLanguage.value !== profile.value.appLanguage
    || learningLanguage.value !== profile.value.learningLanguage
    || clampTasksPerSession(tasksPerSession.value) !== clampTasksPerSession(profile.value.tasksPerSession)
})

watch(
  profile,
  () => {
    syncFormFromProfile()
  },
  { immediate: true },
)

watch(isFormDirty, (isDirty) => {
  if (isDirty) {
    saveSuccess.value = false
  }
})

const isProfileReady = computed(() => Boolean(profile.value))

const canSaveProfile = computed(() => (
  isProfileReady.value
  && isFormDirty.value
  && Boolean(nick.value)
  && tasksPerSession.value >= TASKS_PER_SESSION_MIN
  && tasksPerSession.value <= TASKS_PER_SESSION_MAX
))

const handleSaveProfile = async () => {
  if (!authStore.user) {
    return
  }

  saveSuccess.value = false

  try {
    await userProfileStore.updateProfile(authStore.user.uid, {
      nick: nick.value,
      appLanguage: appLanguage.value,
      learningLanguage: learningLanguage.value,
      tasksPerSession: clampTasksPerSession(tasksPerSession.value),
    })

    if (locale.value !== appLanguage.value) {
      await setLocale(appLanguage.value)
    }

    saveSuccess.value = true
    isEditing.value = false
  }
  catch {
    // Error message is handled in the profile store.
  }
}
</script>

<template>
  <VRow justify="center">
    <VCol cols="12" md="10" lg="8">
      <VRow>
        <VCol cols="12" md="5">
          <VCard class="h-100">
            <VCardTitle class="text-h6 my-3">{{ t('profile.accountTitle') }}</VCardTitle>
            <VCardText class="d-flex flex-column ga-3">
              <div class="text-body-2">
                {{ t('profile.email') }}: {{ authStore.user?.email ?? profile?.email ?? '-' }}
              </div>
              <div class="text-body-2">
                {{ t('profile.createdAt') }}: {{ createdAtFormatted }}
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" md="7" class="d-flex justify-center">
          <VCard class="w-100 mx-auto pb-6 pb-md-8">
            <VCardTitle class="text-h5 text-center my-3">{{ t('profile.title') }}</VCardTitle>
            <VCardText class="px-6">
              <VAlert
                v-if="userProfileStore.error"
                type="error"
                variant="tonal"
                class="mb-3"
              >
                {{ userProfileStore.error }}
              </VAlert>

              <VAlert
                v-if="saveSuccess"
                type="success"
                variant="tonal"
                class="mb-3"
              >
                {{ t('profile.saveSuccess') }}
              </VAlert>

              <VRow>
                <VCol cols="12">
                  <VTextField
                    v-model="nick"
                    :label="t('profile.nick')"
                    prepend-inner-icon="mdi-account"
                    variant="outlined"
                    class="mb-3"
                    :readonly="!isEditing || userProfileStore.loading"
                  />
                </VCol>

                <VCol cols="12">
                  <VSelect
                    v-model="appLanguage"
                    :items="appLanguageOptions"
                    item-title="title"
                    item-value="value"
                    :label="t('profile.appLanguage')"
                    prepend-inner-icon="mdi-translate"
                    variant="outlined"
                    class="mb-3"
                    :disabled="!isEditing || userProfileStore.loading"
                  />
                </VCol>

                <VCol cols="12">
                  <VSelect
                    v-model="learningLanguage"
                    :items="learningLanguageOptions"
                    item-title="title"
                    item-value="value"
                    :label="t('profile.learningLanguage')"
                    prepend-inner-icon="mdi-book-open-page-variant"
                    variant="outlined"
                    class="mb-3"
                    :disabled="!isEditing || userProfileStore.loading"
                  />
                </VCol>

                <VCol cols="12">
                  <VSlider
                    v-model="tasksPerSession"
                    :label="t('profile.tasksPerSession')"
                    :min="TASKS_PER_SESSION_MIN"
                    :max="TASKS_PER_SESSION_MAX"
                    :step="1"
                    :thumb-label="true"
                    color="primary"
                    :disabled="!isEditing || userProfileStore.loading"
                    class="mt-2"
                  />
                  <div class="text-caption text-medium-emphasis">
                    {{ t('profile.tasksPerSessionHint', { min: TASKS_PER_SESSION_MIN, max: TASKS_PER_SESSION_MAX }) }}
                  </div>
                </VCol>
              </VRow>
            </VCardText>
            <VCardActions class="justify-center pt-0 pb-4 pb-md-6 d-flex flex-column align-center ga-2">
              <template v-if="isEditing">
                <VBtn
                  color="primary"
                  size="large"
                  class="px-10"
                  :loading="userProfileStore.saving || userProfileStore.loading"
                  :disabled="!canSaveProfile"
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
          </VCard>
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>
