<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../../stores/use-auth-store'
import { useResultsStore } from '../../stores/use-results-store'
import { useSnackbarStore } from '../../stores/use-snackbar-store'
import { useTaskSessionStore } from '../../stores/use-task-session-store'
import { useUserProfileStore } from '../../stores/use-user-profile-store'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const authStore = useAuthStore()
const resultsStore = useResultsStore()
const taskSessionStore = useTaskSessionStore()
const userProfileStore = useUserProfileStore()
const isResultSaved = ref(false)
const isStartingSession = ref(false)
const { setPageTitle } = usePageHead()
const isEmailVerified = computed(() => authStore.user?.emailVerified ?? false)

onMounted(() => {
  setPageTitle(t('play.title'))
})

const languageLabelByCode: Record<string, string> = {
  pl: 'Polish',
  en: 'English',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
}

const startSession = async () => {
  if (!isEmailVerified.value) {
    return
  }

  if (isStartingSession.value) {
    return
  }

  isStartingSession.value = true
  isResultSaved.value = false

  try {
    const profile = userProfileStore.profile

    await taskSessionStore.generateTasksWithAi({
      subject: languageLabelByCode[profile?.learningLanguage ?? 'en'] ?? 'English',
      nativeLanguage: languageLabelByCode[profile?.appLanguage ?? 'pl'] ?? 'Polish',
      topic: 'Daily life and communication',
      level: 'A2-B1',
    })

    taskSessionStore.startSession()
  }
  catch {
    // Errors are handled by taskSessionStore.generationError watcher/snackbar.
  }
  finally {
    isStartingSession.value = false
  }
}

const submitAnswer = (answer: string) => {
  taskSessionStore.submitCurrentAnswer(answer)
}

const goToNextTask = () => {
  taskSessionStore.goToNextTask()
}

const resendVerificationEmail = async () => {
  const snackbarStore = useSnackbarStore()
  try {
    await authStore.resendVerificationEmail()
    snackbarStore.showSuccess(t('auth.verificationEmailSent') || 'Verification email sent. Please check your inbox.')
  }
  catch {
    // Error is handled in auth store
  }
}

watch(
  () => taskSessionStore.generationError,
  (error) => {
    if (error) {
      const snackbarStore = useSnackbarStore()
      snackbarStore.showError(error)
    }
  },
)

watch(
  () => taskSessionStore.completed,
  async (completed) => {
    if (!completed || isResultSaved.value) {
      return
    }

    const currentUser = authStore.user
    if (!currentUser?.uid) {
      return
    }

    try {
      await resultsStore.saveResultSummary(currentUser.uid, taskSessionStore.taskResults)
      isResultSaved.value = true
    }
    catch {
      return
    }
  },
)
</script>

<template>
  <VRow class="justify-center">
    <VCol cols="12" sm="11" md="10" lg="9" xl="8">
      <VCard v-if="!isEmailVerified" class="elevation-8">
        <VCardText class="pt-8 text-center">
          <VCardTitle class="text-h5 mb-4">{{ t('auth.verifyEmailTitle') || 'Verify your email address' }}</VCardTitle>

          <VAlert
            type="warning"
            variant="tonal"
            class="mb-6"
          >
            {{ t('auth.verifyEmailDescription') || 'Please verify your email to unlock all features.' }}
          </VAlert>

          <VBtn
            color="warning"
            variant="flat"
            :loading="authStore.loading"
            @click="resendVerificationEmail"
          >
            {{ t('auth.resendVerification') || 'Resend' }}
          </VBtn>
        </VCardText>
      </VCard>

      <VCard v-else-if="!taskSessionStore.started" class="elevation-8">
        <VCardText class="pt-8 text-center">
          <VCardTitle class="text-h4 mb-4">{{ t('play.title') }}</VCardTitle>
          <p class="text-body1 mb-6 text-medium-emphasis">{{ t('play.description') }}</p>

          <VBtn
            color="primary"
            size="large"
            :loading="isStartingSession || taskSessionStore.generating"
            :disabled="isStartingSession || taskSessionStore.generating"
            @click="startSession"
          >
            {{ t('play.play') || t('play.start') }}
          </VBtn>
        </VCardText>
      </VCard>

      <TaskSessionBoard
        v-else-if="isEmailVerified"
        :task="taskSessionStore.currentTask"
        :task-number="taskSessionStore.currentTaskNumber"
        :total-tasks="taskSessionStore.totalTasks"
        :correct-count="taskSessionStore.correctCount"
        :incorrect-count="taskSessionStore.incorrectCount"
        :completed="taskSessionStore.completed"
        :current-answer-correct="taskSessionStore.currentEvaluation?.isCorrect ?? null"
        :current-answer="taskSessionStore.currentEvaluation?.userAnswer ?? null"
        @submit-answer="submitAnswer"
        @next="goToNextTask"
        @restart="startSession"
      />
    </VCol>
  </VRow>
</template>
