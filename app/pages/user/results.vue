<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatDateTime } from '../../helpers/format-date'
import { useAuthStore } from '../../stores/use-auth-store'
import { useFlashcardsStore } from '../../stores/use-flashcards-store'
import { useResultsStore } from '../../stores/use-results-store'
import { useSnackbarStore } from '../../stores/use-snackbar-store'
import { useStreakInfoStore } from '../../stores/use-streak-info-store'
import { useDisplay } from 'vuetify'

definePageMeta({
  middleware: 'auth',
})

const { t, locale } = useI18n()
const { lgAndUp } = useDisplay()
const authStore = useAuthStore()
const flashcardsStore = useFlashcardsStore()
const resultsStore = useResultsStore()
const snackbarStore = useSnackbarStore()
const streakInfoStore = useStreakInfoStore()
const localePath = useLocalePath()
const router = useRouter()
const selectedSessionId = ref<string | null>(null)
const detailsDialogVisible = ref(false)
const generatingFlashcards = ref(false)
const { setPageTitle } = usePageHead()

onMounted(() => {
  setPageTitle(t('results.title'))
})

const topTenSessions = computed(() => resultsStore.sessions.slice(0, 10))
const summaryCorrectCount = computed(() => topTenSessions.value.reduce((acc, session) => acc + session.correctCount, 0))
const summaryTotalCount = computed(() => topTenSessions.value.reduce((acc, session) => acc + session.totalTasks, 0))
const summaryAccuracy = computed(() => {
  if (!summaryTotalCount.value) {
    return 0
  }

  return Math.round((summaryCorrectCount.value / summaryTotalCount.value) * 100)
})
const averageCorrectPerSession = computed(() => {
  if (!topTenSessions.value.length) {
    return 0
  }

  return Number((summaryCorrectCount.value / topTenSessions.value.length).toFixed(1))
})

const formatStreakDate = (date: Date | undefined) => {
  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
  }).format(date)
}

const longestStreakCount = computed(() => streakInfoStore.streakInfo?.longestCount ?? 0)
const longestStreakRangeLabel = computed(() => t('results.streakRange', {
  from: formatStreakDate(streakInfoStore.streakInfo?.longest.from),
  to: formatStreakDate(streakInfoStore.streakInfo?.longest.to),
}))
const selectedSession = computed(() => resultsStore.sessions.find(session => session.id === selectedSessionId.value) ?? null)
const selectedSessionLanguage = computed(() => selectedSession.value?.language ?? null)
const selectedSessionLevel = computed(() => selectedSession.value?.level ?? null)
const orderedTasks = computed(() => {
  if (!selectedSession.value) {
    return []
  }

  return [...selectedSession.value.tasks].sort((firstTask, secondTask) => Number(secondTask.isPassed) - Number(firstTask.isPassed))
})

const openSessionDetails = (sessionId: string) => {
  if (selectedSessionId.value === sessionId) {
    selectedSessionId.value = null
    detailsDialogVisible.value = false
    return
  }

  selectedSessionId.value = sessionId

  if (!lgAndUp.value) {
    detailsDialogVisible.value = true
  }
}

const loadMoreSessions = async () => {
  const uid = authStore.user?.uid
  if (!uid) {
    return
  }

  try {
    await resultsStore.fetchLatestSessions(uid, { loadMore: true })
  }
  // eslint-disable-next-line
  catch (_e) {}
}

const generateFlashcardsFromSession = async () => {
  const uid = authStore.user?.uid
  if (!uid) {
    return
  }

  const activeSession = selectedSession.value
  if (!activeSession) {
    snackbarStore.showError(t('results.selectSession'))
    return
  }

  generatingFlashcards.value = true

  try {
    const sessionTasks = activeSession.tasks.map(task => ({
      taskId: task.id,
      isPassed: task.isPassed,
      question: task.question,
      correctAnswer: task.correctAnswer,
      userAnswer: task.userAnswer,
      language: activeSession.language,
      level: activeSession.level,
    }))

    if (sessionTasks.length === 0) {
      snackbarStore.showError(t('results.noTasksForFlashcards'))
      return
    }

    await flashcardsStore.generateFromTaskResults(uid, sessionTasks)
    await router.push(localePath('/user/flashcards'))
  }
  catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : t('results.flashcardsGenerateError')
    snackbarStore.showError(message)
  }
  finally {
    generatingFlashcards.value = false
  }
}

watch(
  () => authStore.user?.uid,
  async (uid) => {
    if (!uid) {
      return
    }

    try {
      await resultsStore.ensureLatestSessions(uid)
    }
    // eslint-disable-next-line
    catch (_e) {}
  },
  { immediate: true },
)

watch(
  () => lgAndUp.value,
  (isLargeScreen) => {
    if (isLargeScreen) {
      detailsDialogVisible.value = false
    }
  },
)
</script>

<template>
  <div
    class="results-board"
    :class="{ 'results-board--desktop': lgAndUp }"
  >
    <VCard class="results-panel results-panel--stats results-panel--stats-card">
      <VCardTitle class="text-headline-small px-6 pt-5 pb-2">{{ t('results.statsTitle') }}</VCardTitle>
      <VCardText class="results-panel__body d-flex flex-column ga-4">
        <VProgressCircular
          :model-value="summaryAccuracy"
          color="primary"
          :size="120"
          :width="12"
          class="align-self-center"
        >
          <span class="text-headline-small">{{ summaryAccuracy }}%</span>
        </VProgressCircular>

        <VAlert
          type="success"
          variant="tonal"
          prepend-icon="mdi-check"
        >
          {{ t('results.correctCount', { count: summaryCorrectCount }) }}
        </VAlert>

        <VAlert
          type="info"
          variant="tonal"
        >
          {{ t('results.averageCorrectPerSession', { count: averageCorrectPerSession }) }}
        </VAlert>

        <p class="text-body-medium text-medium-emphasis my-0">
          {{ t('results.statsInfo') }}
        </p>

        <VAlert
          variant="tonal"
          color="error"
          icon="mdi-fire"
        >
          {{ t('results.longestStreak', { count: longestStreakCount }) }}
          <div class="text-caption mt-1">
            {{ longestStreakRangeLabel }}
          </div>
        </VAlert>
      </VCardText>
    </VCard>

    <VCard class="results-panel results-panel--sessions">
      <VCardTitle class="text-headline-large px-6 pt-5 pb-2">{{ t('results.title') }}</VCardTitle>
      <div class="results-panel__body px-6 pt-0 pb-6">
        <div
          v-if="!resultsStore.sessions.length"
          class="mt-2"
        >
          <VAlert
            type="info"
            variant="tonal"
          >
            {{ t('results.empty') }}
          </VAlert>
        </div>

        <VCard
          v-for="session in resultsStore.sessions"
          :key="session.id"
          class="mb-3 cursor-pointer"
          :variant="selectedSessionId === session.id ? 'tonal' : 'elevated'"
          @click="openSessionDetails(session.id)"
        >
          <VCardText class="d-flex flex-column ga-3 py-3">
            <div class="d-flex align-center justify-space-between flex-wrap ga-2">
              <span class="text-body-large">{{ formatDateTime(session.date, locale) }}</span>
              <VChip
                color="primary"
                variant="tonal"
              >
                {{ t('results.sessionTasks', { count: session.totalTasks }) }}
              </VChip>
            </div>

            <div class="d-flex ga-2 flex-wrap">
              <VChip
                color="success"
                variant="flat"
                prepend-icon="mdi-check"
              >
                {{ t('results.correctCount', { count: session.correctCount }) }}
              </VChip>
              <VChip
                color="error"
                variant="flat"
                prepend-icon="mdi-close"
              >
                {{ t('results.incorrectCount', { count: session.incorrectCount }) }}
              </VChip>
            </div>
          </VCardText>
        </VCard>

        <VBtn
          v-if="resultsStore.hasMore"
          color="primary"
          variant="tonal"
          block
          :loading="resultsStore.loadingMore"
          @click="loadMoreSessions"
        >
          {{ t('results.loadMore') }}
        </VBtn>
      </div>
    </VCard>

    <VCard
      v-if="lgAndUp"
      class="results-panel results-panel--details"
    >
      <VCardTitle class="text-headline-small px-6 pt-5 pb-2">{{ t('results.detailsTitle') }}</VCardTitle>

      <div
        v-if="selectedSession"
        class="results-panel__body px-6 pb-6"
      >
        <div class="text-body-medium text-medium-emphasis mb-3">
          {{ formatDateTime(selectedSession.date, locale) }}
        </div>

        <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3 mb-4">
          <div class="d-flex ga-2 flex-wrap">
            <VChip
              v-if="selectedSessionLanguage"
              color="primary"
              variant="tonal"
              size="small"
            >
              {{ t('results.taskLanguageLabel', { value: selectedSessionLanguage }) }}
            </VChip>
            <VChip
              v-if="selectedSessionLevel"
              color="secondary"
              variant="tonal"
              size="small"
            >
              {{ t('results.taskLevelLabel', { value: selectedSessionLevel }) }}
            </VChip>
          </div>

          <VBtn
            color="primary"
            variant="flat"
            prepend-icon="mdi-cards-outline"
            :loading="generatingFlashcards || flashcardsStore.generating"
            @click="generateFlashcardsFromSession"
          >
            {{ t('results.generateFlashcards') }}
          </VBtn>
        </div>

        <VRow dense>
          <VCol
            v-for="task in orderedTasks"
            :key="task.id"
            cols="12"
            md="6"
          >
            <VCard
              :color="task.isPassed ? 'success' : 'error'"
              variant="tonal"
              class="h-100"
            >
              <VCardText class="d-flex flex-column ga-2">
                <div class="d-flex align-center ga-2">
                  <VIcon :icon="task.isPassed ? 'mdi-check' : 'mdi-close'" />
                  <span class="text-label-large">{{ task.question }}</span>
                </div>
                <p class="mb-0 text-body-medium">
                  {{ t('results.userAnswerLabel') }}: {{ task.userAnswer }}
                </p>
                <p class="mb-0 text-body-medium">
                  {{ t('results.correctAnswerLabel') }}: {{ task.correctAnswer }}
                </p>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <VCardText
        v-else
        class="results-panel__body px-6 pb-6 d-flex align-start"
      >
        <VAlert
          type="info"
          variant="tonal"
          class="w-100"
        >
          {{ t('results.selectSession') }}
        </VAlert>
      </VCardText>
    </VCard>

    <ClientOnly>
      <VDialog
        v-model="detailsDialogVisible"
        max-width="720"
      >
        <VCard>
          <VCardTitle class="text-headline-small px-6 pt-5 pb-2">{{ t('results.detailsTitle') }}</VCardTitle>
          <VCardText
            v-if="selectedSession"
            class="d-flex flex-column ga-3"
          >
            <p class="text-body-medium text-medium-emphasis mb-0">
              {{ formatDateTime(selectedSession.date, locale) }}
            </p>

            <div class="d-flex flex-column ga-3 mb-1">
              <div class="d-flex ga-2 flex-wrap">
                <VChip
                  v-if="selectedSessionLanguage"
                  color="primary"
                  variant="tonal"
                  size="small"
                >
                  {{ t('results.taskLanguageLabel', { value: selectedSessionLanguage }) }}
                </VChip>
                <VChip
                  v-if="selectedSessionLevel"
                  color="secondary"
                  variant="tonal"
                  size="small"
                >
                  {{ t('results.taskLevelLabel', { value: selectedSessionLevel }) }}
                </VChip>
              </div>

              <VBtn
                color="primary"
                variant="flat"
                prepend-icon="mdi-cards-outline"
                :loading="generatingFlashcards || flashcardsStore.generating"
                @click="generateFlashcardsFromSession"
              >
                {{ t('results.generateFlashcards') }}
              </VBtn>
            </div>

            <VCard
              v-for="task in orderedTasks"
              :key="task.id"
              :color="task.isPassed ? 'success' : 'error'"
              variant="tonal"
            >
              <VCardText class="d-flex flex-column ga-2">
                <div class="d-flex align-center ga-2">
                  <VIcon :icon="task.isPassed ? 'mdi-check' : 'mdi-close'" />
                  <span class="text-label-large">{{ task.question }}</span>
                </div>
                <p class="mb-0 text-body-medium">
                  {{ t('results.userAnswerLabel') }}: {{ task.userAnswer }}
                </p>
                <p class="mb-0 text-body-medium">
                  {{ t('results.correctAnswerLabel') }}: {{ task.correctAnswer }}
                </p>
              </VCardText>
            </VCard>
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn
              variant="text"
              @click="detailsDialogVisible = false"
            >
              {{ t('results.close') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </ClientOnly>
  </div>
</template>

<style scoped>
.results-board {
  display: block;
}

.results-panel {
  margin-bottom: 1rem;
}

.results-panel__body {
  min-height: 0;
}

.results-panel--sessions .results-panel__body,
.results-panel--details .results-panel__body {
  overflow-y: auto;
}

@media (min-width: 1280px) {
  .results-board--desktop {
    display: grid;
    grid-template-columns: minmax(300px, 3fr) minmax(360px, 4fr) minmax(420px, 5fr);
    gap: 24px;
    height: calc(100dvh - 112px);
    overflow: hidden;
  }

  .results-board--desktop .results-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    margin-bottom: 0;
  }

  .results-board--desktop .results-panel--stats,
  .results-board--desktop .results-panel--sessions,
  .results-board--desktop .results-panel--details {
    overflow: hidden;
  }

  .results-board--desktop .results-panel--stats-card {
    height: fit-content;
    align-self: start;
  }

  .results-board--desktop .results-panel--stats-card .results-panel__body {
    flex: 0 0 auto;
  }

  .results-board--desktop .results-panel--sessions .results-panel__body,
  .results-board--desktop .results-panel--details .results-panel__body {
    flex: 1 1 auto;
  }

  .results-board--desktop .results-panel--sessions .results-panel__body,
  .results-board--desktop .results-panel--details .results-panel__body {
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}
</style>
