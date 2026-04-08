<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import type { TaskSessionTask } from '../stores/use-task-session-store'
import { normalizeAnswer } from '../helpers/normalize-answer'

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
  generateFlashcards: []
  close: []
}>()

const { t } = useI18n()

const selectedArrangeWords = ref<string[]>([])
const shuffledArrangeWords = ref<string[]>([])
const isSpeaking = ref(false)
const { mdAndUp } = useDisplay()

const optionColors = ['primary', 'success', 'warning', 'info'] as const

const hasTask = computed(() => Boolean(props.task))
const isArrangeTask = computed(() => props.task?.type === 'arrange_words')
const canSubmitArrangeAnswer = computed(() => selectedArrangeWords.value.length > 0)
const arrangedAnswer = computed(() => selectedArrangeWords.value.join(' '))
const isAnswered = computed(() => props.currentAnswerCorrect !== null)
const scorePercentage = computed(() => {
  if (!props.totalTasks) {
    return 0
  }

  return Math.round((props.correctCount / props.totalTasks) * 100)
})
const selectedAnswerLabel = computed(() => props.currentAnswer ?? '')
const correctAnswerLabel = computed(() => props.task?.correctAnswer ?? '')
const taskHint = computed(() => {
  const hint = props.task?.hint

  if (typeof hint !== 'string') {
    return null
  }

  const normalizedHint = hint.trim()

  return normalizedHint.length > 0 ? normalizedHint : null
})
const questionTypographyClass = computed(() => (mdAndUp.value ? 'text-headline-medium' : 'text-title-large'))
const taskTypeInstruction = computed(() => {
  switch (props.task?.type) {
    case 'arrange_words':
      return t('play.taskInstructions.arrangeWords')
    case 'fill_blank_select':
      return t('play.taskInstructions.fillBlankSelect')
    case 'odd_one_out':
      return t('play.taskInstructions.oddOneOut')
    case 'multiple_choice':
      return t('play.taskInstructions.multipleChoice')
    default:
      return ''
  }
})
const showSelectedAnswerTile = computed(() => {
  if (!isAnswered.value) {
    return false
  }

  return normalizeAnswer(selectedAnswerLabel.value) !== normalizeAnswer(correctAnswerLabel.value)
})

watch(
  () => props.task?.id,
  () => {
    selectedArrangeWords.value = []
    shuffledArrangeWords.value = [...(props.task?.options ?? [])].sort(() => Math.random() - 0.5)
  },
  { immediate: true },
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

const arrangeWordOptions = computed(() => shuffledArrangeWords.value.length > 0
  ? shuffledArrangeWords.value
  : (props.task?.options ?? []),
)

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

const speakAnswer = (text: string) => {
  if (!('speechSynthesis' in window)) {
    return
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9

  utterance.onstart = () => {
    isSpeaking.value = true
  }

  utterance.onend = () => {
    isSpeaking.value = false
  }

  utterance.onerror = () => {
    isSpeaking.value = false
  }

  window.speechSynthesis.speak(utterance)
}

const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    isSpeaking.value = false
  }
}

const speakQuestionWithAnswer = (question: string, answer: string) => {
  if (question.includes('_')) {
    const questionWithAnswer = question.replace(/_+/, answer)
    speakAnswer(questionWithAnswer)
  }
  else {
    speakAnswer(answer)
  }
}
</script>

<template>
  <VCard
    class="mx-auto"
    max-width="1200">
    <VCardText class="pa-3 pa-sm-4 pa-md-6">
      <VRow
        v-if="!completed"
        class="mb-3"
        align="center"
        justify="space-between"
        no-gutters>
        <VCol
          cols="12"
          md="6"
          class="mb-2 mb-md-0">
          <VChip
            color="primary"
            variant="flat"
            size="large">
            {{ $t('play.taskProgress', { current: taskNumber, total: totalTasks }) }}
          </VChip>
        </VCol>
        <VCol
          cols="12"
          md="6"
          class="d-flex justify-md-end ga-2 flex-wrap">
          <VChip
            color="success"
            variant="tonal">
            {{ $t('play.correctCount', { count: correctCount }) }}
          </VChip>
          <VChip
            color="error"
            variant="tonal">
            {{ $t('play.incorrectCount', { count: incorrectCount }) }}
          </VChip>
        </VCol>
      </VRow>

      <VRow
        v-if="completed"
        class="justify-center">
        <VCol
          cols="12"
          md="8"
          lg="6">
          <VCard
            variant="flat"
            class="mb-4">
            <VCardTitle class="text-center font-weight-bold">{{ $t('play.summaryTitle') }}</VCardTitle>
            <VCardText class="d-flex flex-column align-center ga-4">
              <VProgressCircular
                :model-value="scorePercentage"
                :size="140"
                :width="14"
                color="success"
              >
                <span class="text-headline-small">{{ scorePercentage }}%</span>
              </VProgressCircular>

              <div class="d-flex ga-3 flex-wrap justify-center">
                <VChip
                  color="success"
                  variant="flat"
                  size="large">
                  {{ $t('play.correctCount', { count: correctCount }) }}
                </VChip>
                <VChip
                  color="error"
                  variant="flat"
                  size="large">
                  {{ $t('play.incorrectCount', { count: incorrectCount }) }}
                </VChip>
              </div>

              <p class="text-body-large mb-0">{{ $t('play.sessionCompleted') }}</p>
            </VCardText>
          </VCard>

          <div class="d-flex flex-column ga-3">
            <VBtn
              block
              color="primary"
              size="x-large"
              prepend-icon="mdi-cards-outline"
              @click="emit('generateFlashcards')"
            >
              {{ $t('play.generateFlashcards') }}
            </VBtn>

            <VBtn
              block
              color="primary"
              variant="tonal"
              size="large"
              @click="emit('close')"
            >
              {{ $t('play.close') }}
            </VBtn>
          </div>
        </VCol>
      </VRow>

      <VRow v-else-if="hasTask">
        <VCol cols="12">
          <div class="px-1 px-md-2 pb-2 pb-md-4">
            <div class="d-flex flex-wrap ga-2 mb-2">
              <VChip
                size="small"
                variant="tonal"
                color="primary">
                {{ task?.targetLanguage ?? task?.subject }}
              </VChip>
              <VChip
                size="small"
                variant="tonal"
                color="secondary">
                {{ task?.level }}
              </VChip>
              <VChip
                size="small"
                variant="tonal"
                color="info">
                {{ task?.topic }}
              </VChip>
            </div>
            <div
              v-if="taskTypeInstruction"
              class="text-body-medium text-medium-emphasis font-italic my-4">
              {{ taskTypeInstruction }}
            </div>
            <div class="d-flex align-start ga-2">
              <div :class="[questionTypographyClass, 'font-weight-bold mb-0 text-wrap whitespace-normal flex-grow-1']">
                {{ task?.question }}
              </div>
              <VTooltip
                v-if="taskHint"
                location="top"
                max-width="320"
              >
                <template #activator="{ props: tooltipProps }">
                  <VBtn
                    v-bind="tooltipProps"
                    icon="mdi-help-circle-outline"
                    variant="text"
                    color="info"
                    size="small"
                    density="comfortable"
                    :aria-label="$t('play.hint') || 'Hint'"
                  />
                </template>
                <span>{{ taskHint }}</span>
              </VTooltip>
            </div>
          </div>
        </VCol>

        <VCol cols="12">
          <VSheet
            class="pa-3 pa-sm-4 pa-md-6 rounded-lg"
            color="surface"
          >
            <div
              v-if="isArrangeTask && !isAnswered"
              class="d-flex flex-column ga-4">
              <div class="d-flex ga-2 flex-wrap justify-center min-h-25">
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

              <VRow density="compact">
                <VCol
                  v-for="(option, optionIndex) in arrangeWordOptions"
                  :key="`${option}-${optionIndex}`"
                  cols="12"
                  sm="6"
                >
                  <VBtn
                    block
                    class="text-none text-wrap text-body-small py-2 whitespace-normal h-auto"
                    :color="optionColors[optionIndex % optionColors.length]"
                    variant="flat"
                    :disabled="isAnswered"
                    @click="addArrangeWord(option)"
                  >
                    {{ option }}
                  </VBtn>
                </VCol>
              </VRow>

              <div class="d-flex justify-center ga-2 flex-wrap">
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

            <VRow
              v-else-if="!isAnswered"
              density="compact">
              <VCol
                v-for="(option, optionIndex) in task?.options"
                :key="`${option}-${optionIndex}`"
                cols="12"
                sm="6"
              >
                <VBtn
                  block
                  class="text-none text-wrap text-body-small py-2 whitespace-normal h-auto"
                  :color="optionColors[optionIndex % optionColors.length]"
                  variant="flat"
                  :disabled="isAnswered"
                  @click="submitOptionAnswer(option)"
                >
                  {{ option }}
                </VBtn>
              </VCol>
            </VRow>

            <div
              v-if="isAnswered"
              class="d-flex flex-column ga-3">
              <VCard
                variant="flat"
                color="success">
                <VCardText class="d-flex align-center justify-space-between ga-2">
                  <div class="d-flex align-center ga-2">
                    <VIcon icon="mdi-check" />
                    <div>
                      <p class="text-body-small my-0">{{ $t('play.correctAnswerTile') }}</p>
                      <p class="mb-0 text-body-large font-weight-bold">{{ correctAnswerLabel }}</p>
                    </div>
                  </div>
                  <div class="d-flex ga-1">
                    <VBtn
                      v-if="isSpeaking"
                      icon
                      variant="text"
                      size="small"
                      @click="stopSpeaking"
                    >
                      <VIcon icon="mdi-stop" />
                    </VBtn>
                    <VBtn
                      v-else
                      icon
                      variant="text"
                      size="small"
                      @click="speakQuestionWithAnswer(task?.question || '', correctAnswerLabel)"
                    >
                      <VIcon icon="mdi-play" />
                    </VBtn>
                  </div>
                </VCardText>
              </VCard>

              <VCard
                v-if="showSelectedAnswerTile"
                variant="flat"
                color="error">
                <VCardText class="d-flex align-center justify-space-between ga-2">
                  <div class="d-flex align-center ga-2">
                    <VIcon icon="mdi-close" />
                    <div>
                      <p class="text-body-small my-0">{{ $t('play.selectedAnswerTile') }}</p>
                      <p class="mb-0 text-body-large font-weight-bold">{{ selectedAnswerLabel }}</p>
                    </div>
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

<style scoped>
:deep(.v-btn.text-wrap) {
  height: auto !important;
  min-height: 44px !important;
}

:deep(.v-btn.text-wrap .v-btn__content) {
  white-space: normal !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  display: block !important;
  padding: 8px !important;
  line-height: 1.4 !important;
  text-align: center !important;
}
</style>
