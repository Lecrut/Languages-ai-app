<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '../../stores/use-auth-store'
import { useResultsStore } from '../../stores/use-results-store'
import { useTaskSessionStore } from '../../stores/use-task-session-store'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const authStore = useAuthStore()
const resultsStore = useResultsStore()
const taskSessionStore = useTaskSessionStore()
const isResultSaved = ref(false)

const startSession = () => {
  isResultSaved.value = false
  taskSessionStore.startSession()
}

const submitAnswer = (answer: string) => {
  taskSessionStore.submitCurrentAnswer(answer)
}

const goToNextTask = () => {
  taskSessionStore.goToNextTask()
}

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
  <VRow>
    <VCol cols="12" md="10" lg="8">
      <VCard v-if="!taskSessionStore.started">
        <VCardTitle class="text-h5">{{ t('play.title') }}</VCardTitle>
        <VCardText>
          <p class="mb-4">{{ t('play.description') }}</p>
          <VBtn color="primary" size="large" @click="startSession">
            {{ t('play.start') }}
          </VBtn>
        </VCardText>
      </VCard>

      <TaskSessionBoard
        v-else
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
