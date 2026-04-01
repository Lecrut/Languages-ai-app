<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatDateTime } from '../../helpers/format-date'
import { useAuthStore } from '../../stores/use-auth-store'
import { useResultsStore } from '../../stores/use-results-store'
import { useDisplay } from 'vuetify'

definePageMeta({
  middleware: 'auth',
})

const { t, locale } = useI18n()
const { lgAndUp } = useDisplay()
const authStore = useAuthStore()
const resultsStore = useResultsStore()
const selectedSessionId = ref<string | null>(null)
const detailsDialogVisible = ref(false)
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
const selectedSession = computed(() => resultsStore.sessions.find(session => session.id === selectedSessionId.value) ?? null)
const orderedTasks = computed(() => {
  if (!selectedSession.value) {
    return []
  }

  return [...selectedSession.value.tasks].sort((firstTask, secondTask) => Number(secondTask.isPassed) - Number(firstTask.isPassed))
})

const openSessionDetails = (sessionId: string) => {
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

  await resultsStore.fetchLatestSessions(uid, { loadMore: true })
}

watch(
  () => authStore.user?.uid,
  async (uid) => {
    if (!uid) {
      return
    }

    await resultsStore.fetchLatestSessions(uid)
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
  <VRow>
    <VCol cols="12" md="4" lg="3">
      <VCard>
        <VCardTitle class="text-h6">{{ t('results.statsTitle') }}</VCardTitle>
        <VCardText class="d-flex flex-column ga-4">
          <VProgressCircular
            :model-value="summaryAccuracy"
            color="primary"
            :size="120"
            :width="12"
            class="align-self-center"
          >
            <span class="text-h6">{{ summaryAccuracy }}%</span>
          </VProgressCircular>

          <VChip color="success" variant="flat" prepend-icon="mdi-check">
            {{ t('results.correctCount', { count: summaryCorrectCount }) }}
          </VChip>

          <VChip color="info" variant="tonal">
            {{ t('results.averageCorrectPerSession', { count: averageCorrectPerSession }) }}
          </VChip>

          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ t('results.statsInfo') }}
          </p>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" md="8" lg="6">
      <VCard class="mb-4">
        <VCardTitle class="text-h5">{{ t('results.title') }}</VCardTitle>
        <VCardText>{{ t('results.description') }}</VCardText>
      </VCard>

      <VCard
        v-for="session in resultsStore.sessions"
        :key="session.id"
        class="mb-3 cursor-pointer"
        :variant="selectedSessionId === session.id ? 'tonal' : 'elevated'"
        @click="openSessionDetails(session.id)"
      >
        <VCardText class="d-flex flex-column ga-3">
          <div class="d-flex align-center justify-space-between flex-wrap ga-2">
            <span class="text-subtitle-1">{{ formatDateTime(session.date, locale) }}</span>
            <VChip color="primary" variant="tonal">
              {{ t('results.sessionTasks', { count: session.totalTasks }) }}
            </VChip>
          </div>

          <div class="d-flex ga-2 flex-wrap">
            <VChip color="success" variant="flat" prepend-icon="mdi-check">
              {{ t('results.correctCount', { count: session.correctCount }) }}
            </VChip>
            <VChip color="error" variant="flat" prepend-icon="mdi-close">
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

      <VAlert
        v-if="!resultsStore.sessions.length"
        type="info"
        variant="tonal"
        class="mt-4"
      >
        {{ t('results.empty') }}
      </VAlert>
    </VCol>

    <VCol v-if="lgAndUp" cols="12" lg="3">
      <VCard>
        <VCardTitle class="text-h6">{{ t('results.detailsTitle') }}</VCardTitle>
        <VCardText v-if="selectedSession" class="d-flex flex-column ga-3">
          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ formatDateTime(selectedSession.date, locale) }}
          </p>

          <VCard
            v-for="task in orderedTasks"
            :key="task.id"
            :color="task.isPassed ? 'success' : 'error'"
            variant="tonal"
          >
            <VCardText class="d-flex flex-column ga-2">
              <div class="d-flex align-center ga-2">
                <VIcon :icon="task.isPassed ? 'mdi-check' : 'mdi-close'" />
                <span class="text-subtitle-2">{{ task.question }}</span>
              </div>
              <p class="mb-0 text-body-2">
                {{ t('results.userAnswerLabel') }}: {{ task.userAnswer }}
              </p>
              <p class="mb-0 text-body-2">
                {{ t('results.correctAnswerLabel') }}: {{ task.correctAnswer }}
              </p>
            </VCardText>
          </VCard>
        </VCardText>
        <VCardText v-else>
          <VAlert type="info" variant="tonal">
            {{ t('results.selectSession') }}
          </VAlert>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <ClientOnly>
    <VDialog v-model="detailsDialogVisible" max-width="720">
      <VCard>
        <VCardTitle class="text-h6">{{ t('results.detailsTitle') }}</VCardTitle>
        <VCardText v-if="selectedSession" class="d-flex flex-column ga-3">
          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ formatDateTime(selectedSession.date, locale) }}
          </p>

          <VCard
            v-for="task in orderedTasks"
            :key="task.id"
            :color="task.isPassed ? 'success' : 'error'"
            variant="tonal"
          >
            <VCardText class="d-flex flex-column ga-2">
              <div class="d-flex align-center ga-2">
                <VIcon :icon="task.isPassed ? 'mdi-check' : 'mdi-close'" />
                <span class="text-subtitle-2">{{ task.question }}</span>
              </div>
              <p class="mb-0 text-body-2">
                {{ t('results.userAnswerLabel') }}: {{ task.userAnswer }}
              </p>
              <p class="mb-0 text-body-2">
                {{ t('results.correctAnswerLabel') }}: {{ task.correctAnswer }}
              </p>
            </VCardText>
          </VCard>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="detailsDialogVisible = false">
            {{ t('results.close') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </ClientOnly>
</template>
