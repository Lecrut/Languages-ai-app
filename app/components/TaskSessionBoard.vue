<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TaskSessionTask } from '../stores/use-task-session-store'

const { t } = useI18n()

const props = defineProps<{
  task: TaskSessionTask | null
  taskNumber: number
  totalTasks: number
  correctCount: number
  incorrectCount: number
  completed: boolean
  currentAnswerCorrect: boolean | null
  currentAnswer: string | null
}>()

const emit = defineEmits<{
  submitAnswer: [answer: string]
  next: []
  restart: []
  close: []
}>()

const selectedArrangeWords = ref<string[]>([])

const optionColors = ['primary', 'success', 'warning', 'info'] as const

const hasTask = computed(() => Boolean(props.task))
const isArrangeTask = computed(() => props.task?.type === 'arrange_words')
const isFlashcardTask = computed(() => props.task?.type === 'flashcard')
const canSubmitArrangeAnswer = computed(() => selectedArrangeWords.value.length > 0)
const arrangedAnswer = computed(() => selectedArrangeWords.value.join(' '))
const isAnswered = computed(() => props.currentAnswerCorrect !== null)
const isFlashcardAnswerRevealed = ref(false)
const scorePercentage = computed(() => {
  if (!props.totalTasks) {
    return 0
  }

  return Math.round((props.correctCount / props.totalTasks) * 100)
})
const selectedAnswerLabel = computed(() => {
  if (props.task?.type !== 'flashcard') {
    return props.currentAnswer ?? ''
  }

  if (props.currentAnswer === '__flashcard_known__') {
    return t('play.flashcardKnown')
  }

  if (props.currentAnswer === '__flashcard_unknown__') {
    return t('play.flashcardUnknown')
  }

  return props.currentAnswer ?? ''
})
const correctAnswerLabel = computed(() => props.task?.correctAnswer ?? '')
const showSelectedAnswerTile = computed(() => {
  if (!isAnswered.value) {
    return false
  }

  if (isFlashcardTask.value) {
    return false
  }

  return selectedAnswerLabel.value.trim().toLowerCase() !== correctAnswerLabel.value.trim().toLowerCase()
})
const showFlashcardEvaluationTile = computed(() => isFlashcardTask.value && isAnswered.value)

watch(
  () => props.task?.id,
  () => {
    selectedArrangeWords.value = []
    isFlashcardAnswerRevealed.value = false
  },
)

const addArrangeWord = (word: string) => {
  if (isAnswered.value) {
    return
  }

  selectedArrangeWords.value.push(word)
}

const removeArrangeWord = (index: number) => {
  if (isAnswered.value) {
    return
  }

  selectedArrangeWords.value = selectedArrangeWords.value.filter((_, itemIndex) => itemIndex !== index)
}

const clearArrangeWords = () => {
  if (isAnswered.value) {
    return
  }

  selectedArrangeWords.value = []
}

const submitArrangeAnswer = () => {
  if (!canSubmitArrangeAnswer.value || isAnswered.value) {
    return
  }

  emit('submitAnswer', arrangedAnswer.value)
}

const submitOptionAnswer = (option: string) => {
  if (isAnswered.value) {
    return
  }

  emit('submitAnswer', option)
}

const revealFlashcardAnswer = () => {
  if (isAnswered.value) {
    return
  }

  isFlashcardAnswerRevealed.value = true
}

const submitFlashcardKnown = () => {
  submitOptionAnswer('__flashcard_known__')
}

const submitFlashcardUnknown = () => {
  submitOptionAnswer('__flashcard_unknown__')
}
</script>

<template>
  <VCard class="mx-auto" max-width="1200">
    <VCardText class="pa-3 pa-sm-4 pa-md-6">
      <VRow v-if="!completed" class="mb-3" align="center" justify="space-between" no-gutters>
        <VCol cols="12" md="6" class="mb-2 mb-md-0">
          <VChip color="primary" variant="flat" size="large">
            {{ $t('play.taskProgress', { current: taskNumber, total: totalTasks }) }}
          </VChip>
        </VCol>
        <VCol cols="12" md="6" class="d-flex justify-md-end ga-2 flex-wrap">
          <VChip color="success" variant="tonal">
            {{ $t('play.correctCount', { count: correctCount }) }}
          </VChip>
          <VChip color="error" variant="tonal">
            {{ $t('play.incorrectCount', { count: incorrectCount }) }}
          </VChip>
        </VCol>
      </VRow>

      <VRow v-if="completed" class="justify-center">
        <VCol cols="12" md="8" lg="6">
          <VCard variant="tonal" class="mb-4">
            <VCardTitle>{{ $t('play.summaryTitle') }}</VCardTitle>
            <VCardText class="d-flex flex-column align-center ga-4">
              <VProgressCircular
                :model-value="scorePercentage"
                :size="140"
                :width="14"
                color="success"
              >
                <span class="text-h6">{{ scorePercentage }}%</span>
              </VProgressCircular>

              <div class="d-flex ga-3 flex-wrap justify-center">
                <VChip color="success" variant="flat" size="large">
                  {{ $t('play.correctCount', { count: correctCount }) }}
                </VChip>
                <VChip color="error" variant="flat" size="large">
                  {{ $t('play.incorrectCount', { count: incorrectCount }) }}
                </VChip>
              </div>

              <p class="text-body-1 mb-0">{{ $t('play.sessionCompleted') }}</p>
            </VCardText>
          </VCard>

          <VBtn
            block
            color="primary"
            size="x-large"
            @click="emit('close')"
          >
            {{ $t('play.close') }}
          </VBtn>
        </VCol>
      </VRow>

      <VRow v-else-if="hasTask">
        <VCol cols="12">
          <div class="px-1 px-md-2 pb-2 pb-md-4">
            <p class="text-caption text-medium-emphasis mb-2">
              {{ task?.topic }}
            </p>
            <p class="text-h6 text-sm-h5 text-md-h3 font-weight-bold mb-0">
              {{ task?.question }}
            </p>
          </div>
        </VCol>

        <VCol cols="12">
          <VSheet
            class="pa-3 pa-sm-4 pa-md-6 rounded-lg"
            color="surface"
          >
            <div v-if="isArrangeTask && !isAnswered" class="d-flex flex-column ga-4">
              <div class="d-flex ga-2 flex-wrap min-h-25">
                <VChip
                  v-for="(word, index) in selectedArrangeWords"
                  :key="`${word}-${index}`"
                  color="primary"
                  variant="flat"
                  closable
                  @click:close="removeArrangeWord(index)"
                >
                  {{ word }}
                </VChip>
              </div>

              <VRow dense>
                <VCol
                  v-for="(option, optionIndex) in task?.options"
                  :key="`${option}-${optionIndex}`"
                  cols="12"
                  sm="6"
                >
                  <VBtn
                    block
                    class="text-none text-wrap py-3"
                    :color="optionColors[optionIndex % optionColors.length]"
                    variant="flat"
                    :disabled="isAnswered"
                    @click="addArrangeWord(option)"
                  >
                    {{ option }}
                  </VBtn>
                </VCol>
              </VRow>

              <div class="d-flex ga-2 flex-wrap">
                <VBtn
                  color="primary"
                  variant="flat"
                  :disabled="!canSubmitArrangeAnswer || isAnswered"
                  @click="submitArrangeAnswer"
                >
                  {{ $t('play.checkAnswer') }}
                </VBtn>
                <VBtn
                  color="secondary"
                  variant="tonal"
                  :disabled="isAnswered"
                  @click="clearArrangeWords"
                >
                  {{ $t('play.clear') }}
                </VBtn>
              </div>
            </div>

            <div v-else-if="isFlashcardTask && !isAnswered" class="d-flex flex-column ga-3">
              <VBtn
                v-if="!isFlashcardAnswerRevealed"
                color="primary"
                size="large"
                @click="revealFlashcardAnswer"
              >
                {{ $t('play.flashcardRevealAnswer') }}
              </VBtn>

              <VCard v-else variant="tonal" color="primary">
                <VCardText>
                  <p class="text-caption mb-1">{{ $t('play.correctAnswerTile') }}</p>
                  <p class="mb-0 text-h6">{{ correctAnswerLabel }}</p>
                </VCardText>
              </VCard>

              <div v-if="isFlashcardAnswerRevealed" class="d-flex ga-2 flex-wrap">
                <VBtn
                  color="success"
                  variant="flat"
                  @click="submitFlashcardKnown"
                >
                  {{ $t('play.flashcardKnown') }}
                </VBtn>
                <VBtn
                  color="error"
                  variant="tonal"
                  @click="submitFlashcardUnknown"
                >
                  {{ $t('play.flashcardUnknown') }}
                </VBtn>
              </div>
            </div>

            <VRow v-else-if="!isAnswered" dense>
              <VCol
                v-for="(option, optionIndex) in task?.options"
                :key="`${option}-${optionIndex}`"
                cols="12"
                sm="6"
              >
                <VBtn
                  block
                  class="text-none text-wrap py-3"
                  :color="optionColors[optionIndex % optionColors.length]"
                  variant="flat"
                  :disabled="isAnswered"
                  @click="submitOptionAnswer(option)"
                >
                  {{ option }}
                </VBtn>
              </VCol>
            </VRow>

            <div v-if="isAnswered" class="d-flex flex-column ga-3">
              <VCard variant="flat" color="success">
                <VCardText class="d-flex align-center ga-2">
                  <VIcon icon="mdi-check" />
                  <div>
                    <p class="text-caption mb-1">{{ $t('play.correctAnswerTile') }}</p>
                    <p class="mb-0 text-body-1">{{ correctAnswerLabel }}</p>
                  </div>
                </VCardText>
              </VCard>

              <VCard
                v-if="showFlashcardEvaluationTile"
                variant="flat"
                :color="currentAnswerCorrect ? 'success' : 'error'"
              >
                <VCardText class="d-flex align-center ga-2">
                  <VIcon :icon="currentAnswerCorrect ? 'mdi-thumb-up-outline' : 'mdi-help-circle-outline'" />
                  <div>
                    <p class="text-caption mb-1">{{ $t('play.flashcardEvaluationTile') }}</p>
                    <p class="mb-0 text-body-1">{{ selectedAnswerLabel }}</p>
                  </div>
                </VCardText>
              </VCard>

              <VCard v-if="showSelectedAnswerTile" variant="flat" color="error">
                <VCardText class="d-flex align-center ga-2">
                  <VIcon icon="mdi-close" />
                  <div>
                    <p class="text-caption mb-1">{{ $t('play.selectedAnswerTile') }}</p>
                    <p class="mb-0 text-body-1">{{ selectedAnswerLabel }}</p>
                  </div>
                </VCardText>
              </VCard>

              <VBtn
                block
                color="primary"
                size="large"
                @click="emit('next')"
              >
                {{ $t('play.nextTask') }}
              </VBtn>
            </div>
          </VSheet>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
