<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../../stores/use-auth-store'
import { useFlashcardsStore } from '../../stores/use-flashcards-store'
import { useResultsStore } from '../../stores/use-results-store'
import { useSnackbarStore } from '../../stores/use-snackbar-store'
import { useTaskSessionStore } from '../../stores/use-task-session-store'
import { useUserProfileStore } from '../../stores/use-user-profile-store'
import { DEFAULT_LEARNING_LEVEL } from '../../constants/learning-levels'
import {
  DEFAULT_TASK_TOPIC,
  TASK_TOPICS,
  type TaskTopicId,
} from '../../constants/task-topics'
import { TASKS_PER_SESSION_DEFAULT, clampTasksPerSession } from '../../constants/task-session-settings'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const authStore = useAuthStore()
const flashcardsStore = useFlashcardsStore()
const resultsStore = useResultsStore()
const snackbarStore = useSnackbarStore()
const taskSessionStore = useTaskSessionStore()
const userProfileStore = useUserProfileStore()
const taskLoader = useTaskLoader()
const isResultSaved = ref(false)
const isStartingSession = ref(false)
const selectedTopic = ref<TaskTopicId>(DEFAULT_TASK_TOPIC)
type TaskLoadMode = 'new' | 'improve' | 'repeat' | 'ai'
const selectedMode = ref<TaskLoadMode | null>(null)
const { setPageTitle } = usePageHead()
const isEmailVerified = computed(() => authStore.user?.emailVerified ?? false)
const isTaskLoading = computed(() => isStartingSession.value || taskLoader.loading.value)

onMounted(() => {
  setPageTitle(t('play.title'))
  taskSessionStore.initializeRecovery()
})

const languageLabelByCode: Record<string, string> = {
  pl: 'Polish',
  en: 'English',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
}

const preferredSubject = computed(() => languageLabelByCode[userProfileStore.profile?.learningLanguage ?? 'en'] ?? 'English')

const topicOptions = computed(() => TASK_TOPICS.map(topic => ({
  title: t(`play.topics.${topic.id}`),
  value: topic.id,
})))

const selectedPromptTopic = computed(() => {
  const current = TASK_TOPICS.find(topic => topic.id === selectedTopic.value)

  return current?.promptTopic ?? TASK_TOPICS[0].promptTopic
})

const taskLoadModeOptions = computed(() => [
  {
    mode: 'new' as const,
    label: t('play.newTasks') || 'New tasks',
    icon: 'mdi-plus-circle',
    description: t('play.newTasksDescription') || 'Tasks you haven\'t done before',
  },
  {
    mode: 'improve' as const,
    label: t('play.improveTask') || 'Tasks to improve',
    icon: 'mdi-autorenew',
    description: t('play.improveTaskDescription') || 'Tasks you failed before',
  },
  {
    mode: 'repeat' as const,
    label: t('play.repeatTasks') || 'Repeat',
    icon: 'mdi-reload',
    description: t('play.repeatTasksDescription') || 'Tasks you already passed',
  },
  {
    mode: 'ai' as const,
    label: t('play.aiTasks') || 'AI Tasks',
    icon: 'mdi-lightbulb',
    description: t('play.aiTasksDescription') || 'Generate new tasks with AI',
  },
])

const startSessionWithMode = async (mode: TaskLoadMode) => {
  if (!isEmailVerified.value) {
    return
  }

  if (isTaskLoading.value) {
    return
  }

  isStartingSession.value = true
  isResultSaved.value = false
  selectedMode.value = mode

  try {
    const profile = userProfileStore.profile
    const currentUser = authStore.user

    if (!currentUser?.uid) {
      throw new Error('User not logged in')
    }

    if (!profile) {
      snackbarStore.showError('Poczekaj, aż preferencje profilu się załadują, i spróbuj ponownie.')
      return
    }

    const tasksCount = clampTasksPerSession(profile?.tasksPerSession ?? TASKS_PER_SESSION_DEFAULT)

    const tasks = await taskLoader.loadTasks({
      mode,
      tasksCount,
      userId: currentUser.uid,
      preferredSubject: preferredSubject.value,
      preferredLevel: profile.level,
      aiPromptParams: {
        subject: preferredSubject.value,
        topic: selectedPromptTopic.value,
        level: profile?.level ?? DEFAULT_LEARNING_LEVEL,
      },
    })

    taskSessionStore.setSessionTasks(tasks)
    taskSessionStore.startSession()
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load tasks'
    snackbarStore.showError(message)
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

const generateFlashcardsFromSession = async () => {
  const uid = authStore.user?.uid
  if (!uid) {
    return
  }

  const sessionTaskResults = taskSessionStore.taskResults

  if (sessionTaskResults.length === 0) {
    snackbarStore.showError(t('results.noTasksForFlashcards'))
    return
  }

  try {
    await flashcardsStore.generateFromTaskResults(uid, sessionTaskResults)
    taskSessionStore.reset()
    isResultSaved.value = false
    selectedMode.value = null
    await router.push(localePath('/user/flashcards'))
  }
  catch (error) {
    const message = error instanceof Error ? error.message : t('results.flashcardsGenerateError')
    snackbarStore.showError(message)
  }
}

const closeSession = async () => {
  taskSessionStore.reset()
  isResultSaved.value = false
  selectedMode.value = null
  await router.push(localePath('/user'))
}

const resendVerificationEmail = async () => {
  try {
    await authStore.resendVerificationEmail()
    snackbarStore.showSuccess(t('auth.verificationEmailSent') || 'Verification email sent. Please check your inbox.')
  }
  // eslint-disable-next-line
  catch (_e) {}
}

watch(
  () => taskLoader.error.value,
  (error) => {
    if (error) {
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
    <VCol
      cols="12"
      sm="11"
      md="10"
      lg="9"
      xl="8">
      <VCard
        v-if="!isEmailVerified"
        class="elevation-8">
        <VCardText class="pt-8 text-center">
          <VCardTitle class="text-headline-large mb-4">{{ t('auth.verifyEmailTitle') || 'Verify your email address' }}</VCardTitle>

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

      <VCard
        v-else-if="!taskSessionStore.started"
        class="elevation-8">
        <template v-if="taskSessionStore.hasRecoverableSession">
          <VCardText class="pt-8 text-center">
            <VCardTitle class="text-headline-large mb-4">{{ t('play.resumeTitle') }}</VCardTitle>
            <p class="text-body-large mb-6 text-medium-emphasis">{{ t('play.resumeDescription') }}</p>

            <VBtn
              color="primary"
              size="large"
              @click="taskSessionStore.resumeRecoverableSession()"
            >
              {{ t('play.resume') }}
            </VBtn>
          </VCardText>
        </template>

        <VCardText
          v-else
          class="pt-8">
          <VCardTitle class="text-headline-large mb-2 text-center">{{ t('play.title') }}</VCardTitle>
          <!-- <p class="text-body-large mb-6 text-center text-medium-emphasis">{{ t('play.description') }}</p> -->

          <VCard
            variant="tonal"
            color="primary"
            class="mb-6"
          >
            <VCardText class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3">
              <div>
                <p class="text-body-large font-weight-bold mb-1">{{ t('play.flashcardsTitle') }}</p>
                <p class="text-body-small mb-0 text-medium-emphasis">{{ t('play.flashcardsDescription') }}</p>
              </div>

              <VBtn
                color="primary"
                variant="flat"
                prepend-icon="mdi-cards-outline"
                :to="localePath('/user/flashcards')"
              >
                {{ t('play.flashcardsCta') }}
              </VBtn>
            </VCardText>
          </VCard>

          <div class="mb-6">
            <p class="text-body-medium font-weight-bold mb-4">{{ t('play.selectTopic') || 'Select a topic:' }}</p>
            <VSelect
              v-model="selectedTopic"
              :items="topicOptions"
              item-title="title"
              item-value="value"
              :label="t('play.topicLabel')"
              prepend-inner-icon="mdi-shape-outline"
              variant="outlined"
              :disabled="isTaskLoading"
            />
          </div>

          <div>
            <p class="text-body-medium font-weight-bold mb-4">{{ t('play.selectMode') || 'Choose a task set:' }}</p>
            <VProgressLinear
              v-if="isTaskLoading"
              indeterminate
              color="primary"
              class="mb-4"
            />
            <VRow>
              <VCol
                v-for="option in taskLoadModeOptions"
                :key="option.mode"
                cols="12"
                sm="6"
              >
                <VCard
                  :class="['h-100 cursor-pointer', selectedMode === option.mode ? 'border-primary border-2' : '']"
                  variant="outlined"
                  :color="selectedMode === option.mode ? 'primary-container' : ''"
                  :disabled="isTaskLoading"
                  @click="startSessionWithMode(option.mode)"
                >
                  <VCardText class="d-flex flex-column align-center text-center gap-2 pa-4">
                    <VIcon
                      size="32"
                      :icon="option.icon" />
                    <p class="text-body-large font-weight-bold">{{ option.label }}</p>
                    <p class="text-body-small text-medium-emphasis">{{ option.description }}</p>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </div>
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
        @restart="startSessionWithMode('ai')"
        @generate-flashcards="generateFlashcardsFromSession"
        @close="closeSession"
      />
    </VCol>
  </VRow>
</template>
