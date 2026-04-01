<script setup lang="ts">
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

const { t } = useI18n()
const authStore = useAuthStore()
const userProfileStore = useUserProfileStore()
const router = useRouter()
const { setPageTitle } = usePageHead()

onMounted(async () => {
  setPageTitle(t('profile.title'))

  if (!authStore.user) {
    return
  }

  await userProfileStore.loadOrCreateProfile(authStore.user)
  fillFormFromProfile()
})

const nick = ref('')
const appLanguage = ref('pl')
const learningLanguage = ref('en')
const tasksPerSession = ref(TASKS_PER_SESSION_DEFAULT)
const profileEmail = ref('')
const saveSuccess = ref(false)

const appLanguageOptions = [
  { title: 'Polski (PL)', value: 'pl' },
  { title: 'English (EN)', value: 'en' },
]

const learningLanguageOptions = [
  { title: 'English', value: 'en' },
  { title: 'Polski', value: 'pl' },
  { title: 'Deutsch', value: 'de' },
  { title: 'Espanol', value: 'es' },
  { title: 'Francais', value: 'fr' },
  { title: 'Italiano', value: 'it' },
]

const createdAtFormatted = computed(() => {
  if (!userProfileStore.profile?.createdAt) {
    return '-'
  }

  return new Date(userProfileStore.profile.createdAt).toLocaleString()
})

const fillFormFromProfile = () => {
  if (!userProfileStore.profile) {
    return
  }

  nick.value = userProfileStore.profile.nick
  appLanguage.value = userProfileStore.profile.appLanguage
  learningLanguage.value = userProfileStore.profile.learningLanguage
  tasksPerSession.value = clampTasksPerSession(userProfileStore.profile.tasksPerSession)
  profileEmail.value = userProfileStore.profile.email
}

const canSaveProfile = computed(() => Boolean(
  nick.value
  && profileEmail.value
  && tasksPerSession.value >= TASKS_PER_SESSION_MIN
  && tasksPerSession.value <= TASKS_PER_SESSION_MAX,
))

onMounted(async () => {
  setPageTitle(t('profile.title'))

  if (!authStore.user) {
    return
  }

  await userProfileStore.loadOrCreateProfile(authStore.user)
  fillFormFromProfile()
})

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
      email: profileEmail.value,
    })

    saveSuccess.value = true
  }
  catch {
    // Error message is handled in the profile store.
  }
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    await router.push('/auth/login')
  }
  catch {
    // Error message is handled in the store.
  }
}
</script>

<template>
  <VRow>
    <VCol cols="12" md="10" lg="8">
      <VCard>
        <VCardTitle class="text-h5">{{ t('profile.title') }}</VCardTitle>
        <VCardText>
          <div class="mb-4">{{ t('profile.description') }}</div>

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
            <VCol cols="12" md="6">
              <VTextField
                v-model="nick"
                :label="t('profile.nick')"
                prepend-inner-icon="mdi-account"
                :disabled="userProfileStore.loading"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="profileEmail"
                :label="t('profile.email')"
                prepend-inner-icon="mdi-email-outline"
                type="email"
                :disabled="userProfileStore.loading"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="appLanguage"
                :items="appLanguageOptions"
                item-title="title"
                item-value="value"
                :label="t('profile.appLanguage')"
                prepend-inner-icon="mdi-translate"
                :disabled="userProfileStore.loading"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="learningLanguage"
                :items="learningLanguageOptions"
                item-title="title"
                item-value="value"
                :label="t('profile.learningLanguage')"
                prepend-inner-icon="mdi-book-open-page-variant"
                :disabled="userProfileStore.loading"
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
                :disabled="userProfileStore.loading"
                class="mt-2"
              />
              <div class="text-caption text-medium-emphasis">
                {{ t('profile.tasksPerSessionHint', { min: TASKS_PER_SESSION_MIN, max: TASKS_PER_SESSION_MAX }) }}
              </div>
            </VCol>
          </VRow>

          <VDivider class="my-4" />

          <div class="text-body-2 mb-1">{{ t('profile.uid') }}: {{ authStore.user?.uid ?? '-' }}</div>
          <div class="text-body-2">{{ t('profile.createdAt') }}: {{ createdAtFormatted }}</div>
        </VCardText>
        <VCardActions>
          <VBtn
            color="primary"
            :loading="userProfileStore.saving || userProfileStore.loading"
            :disabled="!canSaveProfile"
            @click="handleSaveProfile"
          >
            {{ t('profile.save') }}
          </VBtn>

          <VBtn
            color="secondary"
            variant="outlined"
            :loading="authStore.loading"
            :disabled="!authStore.isAuthenticated"
            @click="handleLogout"
          >
            {{ t('profile.logout') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VCol>
  </VRow>
</template>
