<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { cloneFlashcardDocument } from '../helpers/flashcard-converters'
import type { FlashcardListItem } from '../stores/use-flashcards-store'

const props = withDefaults(defineProps<{
  cards: FlashcardListItem[]
  title?: string
  subtitle?: string
  selectionMode?: boolean
}>(), {
  title: undefined,
  subtitle: undefined,
  selectionMode: false,
})

const currentIndex = defineModel<number>({ default: 0 })
const showKnownCards = defineModel<boolean>('showKnownCards', { default: false })

const emit = defineEmits<{
  know: [card: FlashcardListItem]
  dontKnow: [card: FlashcardListItem]
  save: [card: FlashcardListItem]
  delete: []
  change: [index: number]
  toggleSelection: [index: number]
  openList: []
}>()

const { t } = useI18n()

const localCards = ref<FlashcardListItem[]>([])
const isFlipped = ref(false)
const dragOffsetX = ref(0)
const isDragging = ref(false)
const activePointerId = ref<number | null>(null)
const dragStartX = ref(0)
const isSpeaking = ref(false)

const totalCards = computed(() => localCards.value.length)
const activeCard = computed(() => localCards.value[currentIndex.value] ?? null)
const visibleDeckCards = computed(() => localCards.value.slice(currentIndex.value, currentIndex.value + 3))
const hasCards = computed(() => totalCards.value > 0)
const deckTitle = computed(() => props.title ?? t('flashcards.title'))
const currentPositionLabel = computed(() => (totalCards.value ? `${Math.min(currentIndex.value + 1, totalCards.value)} / ${totalCards.value}` : '0 / 0'))
const progressValue = computed(() => (totalCards.value ? Math.round(((currentIndex.value + 1) / totalCards.value) * 100) : 0))

const speechLanguageByLabel: Record<string, string> = {
  en: 'en-US',
  english: 'en-US',
  pl: 'pl-PL',
  polish: 'pl-PL',
  de: 'de-DE',
  german: 'de-DE',
  es: 'es-ES',
  spanish: 'es-ES',
  fr: 'fr-FR',
  french: 'fr-FR',
  it: 'it-IT',
  italian: 'it-IT',
}

const clampIndex = (index: number) => {
  if (!localCards.value.length) {
    return 0
  }

  return Math.max(0, Math.min(index, localCards.value.length - 1))
}

const setCurrentCard = (index: number) => {
  const clampedIndex = clampIndex(index)
  currentIndex.value = clampedIndex
  emit('change', clampedIndex)
}

const syncUiState = () => {
  isFlipped.value = false
  dragOffsetX.value = 0
  isDragging.value = false
  activePointerId.value = null
}

const updateCardAtCurrentIndex = (updatedCard: FlashcardListItem) => {
  if (!activeCard.value) {
    return
  }

  const nextCards = [...localCards.value]
  nextCards[currentIndex.value] = cloneFlashcardDocument(updatedCard)
  localCards.value = nextCards
}

const moveToNextCardIfPossible = () => {
  if (totalCards.value <= 1) {
    setCurrentCard(0)
    return
  }

  if (currentIndex.value >= totalCards.value - 1) {
    setCurrentCard(0)
    return
  }

  setCurrentCard(currentIndex.value + 1)
}

const shouldAdvanceAfterStatusChange = (nextIsKnown: boolean) => {
  if (props.selectionMode) {
    return true
  }

  return nextIsKnown === showKnownCards.value
}

const handleKnow = () => {
  if (!activeCard.value) {
    return
  }

  const updatedCard: FlashcardListItem = {
    ...activeCard.value,
    isKnown: true,
    knownAt: new Date(),
  }

  updateCardAtCurrentIndex(updatedCard)
  emit('know', updatedCard)

  if (shouldAdvanceAfterStatusChange(updatedCard.isKnown)) {
    moveToNextCardIfPossible()
  }

  syncUiState()
}

const handleDontKnow = () => {
  if (!activeCard.value) {
    return
  }

  const updatedCard: FlashcardListItem = {
    ...activeCard.value,
    isKnown: false,
    knownAt: null,
  }

  updateCardAtCurrentIndex(updatedCard)
  emit('dontKnow', updatedCard)

  if (shouldAdvanceAfterStatusChange(updatedCard.isKnown)) {
    moveToNextCardIfPossible()
  }

  syncUiState()
}

const toggleFlip = () => {
  if (!activeCard.value || isDragging.value) {
    return
  }

  isFlipped.value = !isFlipped.value
}

const cardStackStyle = (stackIndex: number) => ({
  transform: `translateY(${stackIndex * 14}px) scale(${1 - stackIndex * 0.03})`,
  zIndex: 20 - stackIndex,
  opacity: stackIndex === 0 ? 1 : Math.max(0.72, 1 - stackIndex * 0.08),
})

const topCardMotionStyle = computed(() => ({
  transform: `translateX(${dragOffsetX.value}px) rotate(${dragOffsetX.value / 32}deg)`,
  transition: isDragging.value ? 'none' : 'transform 220ms ease, opacity 220ms ease',
}))

const faceBaseStyle = {
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  position: 'absolute',
  inset: '0',
  width: '100%',
  height: '100%',
} as const

const backFaceStyle = {
  transform: 'rotateY(180deg)',
} as const

const resetDragState = () => {
  dragOffsetX.value = 0
  isDragging.value = false
  activePointerId.value = null
}

const onPointerDown = (event: PointerEvent) => {
  if (!activeCard.value) {
    return
  }

  activePointerId.value = event.pointerId
  dragStartX.value = event.clientX
  dragOffsetX.value = 0
  isDragging.value = true

  const target = event.currentTarget
  if (target instanceof HTMLElement) {
    target.setPointerCapture(event.pointerId)
  }
}

const onPointerMove = (event: PointerEvent) => {
  if (!isDragging.value || activePointerId.value !== event.pointerId) {
    return
  }

  dragOffsetX.value = event.clientX - dragStartX.value
}

const finishSwipe = (event: PointerEvent) => {
  if (!isDragging.value || activePointerId.value !== event.pointerId) {
    return
  }

  const offset = dragOffsetX.value
  const threshold = 96

  if (offset <= -threshold) {
    handleDontKnow()
  }
  else if (offset >= threshold) {
    handleKnow()
  }

  resetDragState()
}

const onPointerUp = (event: PointerEvent) => {
  finishSwipe(event)
}

const onPointerCancel = (event: PointerEvent) => {
  finishSwipe(event)
}

const resolveSpeechLanguage = (language: string | null | undefined) => {
  if (!language) {
    return 'en-US'
  }

  return speechLanguageByLabel[language.toLowerCase()] ?? 'en-US'
}

const stopSpeaking = () => {
  if (!import.meta.client || !('speechSynthesis' in window)) {
    return
  }

  window.speechSynthesis.cancel()
  isSpeaking.value = false
}

const speakCardText = (text: string, language: string | null | undefined) => {
  if (!import.meta.client || !('speechSynthesis' in window)) {
    return
  }

  if (!text.trim()) {
    return
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = resolveSpeechLanguage(language)
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

const toggleSpeakActiveCardText = () => {
  const card = activeCard.value
  if (!card) {
    return
  }

  if (isSpeaking.value) {
    stopSpeaking()
    return
  }

  speakCardText(card.text, card.language)
}

onBeforeUnmount(() => {
  stopSpeaking()
})

watch(
  () => props.cards,
  (cards) => {
    localCards.value = cards.map(cloneFlashcardDocument)
    currentIndex.value = clampIndex(currentIndex.value)
    syncUiState()
  },
  { immediate: true },
)
</script>

<template>
  <VCard
    class="mx-auto d-flex flex-column"
    max-width="1600"
    rounded="xl"
    elevation="10"
  >
    <VCardText class="pa-4 pa-md-6">
      <div class="mb-4">
        <div class="d-none d-lg-flex align-center justify-space-between ga-3">
          <p class="text-title-large font-weight-bold my-1">{{ deckTitle }}</p>

          <div class="d-flex align-center ga-2 flex-nowrap">
            <VBtn
              color="primary"
              variant="flat"
              prepend-icon="mdi-view-list"
              @click="emit('openList')"
            >
              {{ t('flashcards.listTitle') }}
            </VBtn>
            <VChip
              :color="showKnownCards ? 'grey' : 'error'"
              variant="tonal"
            >
              {{ t('flashcards.unknown') }}
            </VChip>
            <VSwitch
              v-model="showKnownCards"
              color="success"
              hide-details
              inset
              density="compact"
              class="ma-0"
            />
            <VChip
              :color="showKnownCards ? 'success' : 'grey'"
              variant="tonal"
            >
              {{ t('flashcards.known') }}
            </VChip>
            <VChip
              color="primary"
              variant="flat">
              {{ currentPositionLabel }}
            </VChip>
            <VChip
              color="secondary"
              variant="tonal">
              {{ progressValue }}%
            </VChip>
          </div>
        </div>

        <div class="d-none d-sm-flex d-lg-none flex-column ga-3">
          <div class="d-flex align-center justify-space-between ga-2">
            <p class="text-title-large font-weight-bold my-1">{{ deckTitle }}</p>
            <VBtn
              color="primary"
              variant="flat"
              prepend-icon="mdi-view-list"
              @click="emit('openList')"
            >
              {{ t('flashcards.listTitle') }}
            </VBtn>
          </div>

          <div class="d-flex align-center justify-end ga-2 flex-wrap">
            <VChip
              :color="showKnownCards ? 'grey' : 'error'"
              variant="tonal"
            >
              {{ t('flashcards.unknown') }}
            </VChip>
            <VSwitch
              v-model="showKnownCards"
              color="success"
              hide-details
              inset
              density="compact"
              class="ma-0"
            />
            <VChip
              :color="showKnownCards ? 'success' : 'grey'"
              variant="tonal"
            >
              {{ t('flashcards.known') }}
            </VChip>
            <VChip
              color="primary"
              variant="flat">
              {{ currentPositionLabel }}
            </VChip>
            <VChip
              color="secondary"
              variant="tonal">
              {{ progressValue }}%
            </VChip>
          </div>
        </div>

        <div class="d-flex d-sm-none flex-column ga-3">
          <div class="d-flex align-center justify-space-between ga-2">
            <p class="text-title-large font-weight-bold my-1">{{ deckTitle }}</p>
            <VBtn
              color="primary"
              variant="flat"
              prepend-icon="mdi-view-list"
              @click="emit('openList')"
            >
              {{ t('flashcards.listTitle') }}
            </VBtn>
          </div>

          <div class="d-flex align-center justify-center ga-2 flex-wrap">
            <VChip
              :color="showKnownCards ? 'grey' : 'error'"
              variant="tonal"
            >
              {{ t('flashcards.unknown') }}
            </VChip>
            <VSwitch
              v-model="showKnownCards"
              color="success"
              hide-details
              inset
              density="compact"
              class="ma-0"
            />
            <VChip
              :color="showKnownCards ? 'success' : 'grey'"
              variant="tonal"
            >
              {{ t('flashcards.known') }}
            </VChip>
          </div>

          <div class="d-flex align-center justify-center ga-2 flex-wrap">
            <VChip
              color="primary"
              variant="flat">
              {{ currentPositionLabel }}
            </VChip>
            <VChip
              color="secondary"
              variant="tonal">
              {{ progressValue }}%
            </VChip>
          </div>
        </div>
      </div>

      <VProgressLinear
        :model-value="progressValue"
        color="primary"
        rounded
        height="10"
        class="mb-5"
      />

      <VAlert
        v-if="!hasCards"
        type="info"
        variant="tonal"
        class="mb-0"
      >
        {{ t('flashcards.noCards') }}
      </VAlert>

      <VCard
        v-else
        class="h-100 ma-0 pa-0"
        variant="flat"
      >
        <VCardText class="pa-0 pa-sm-6">
          <div class="d-flex justify-end align-center ga-2 mb-3">
            <VTooltip
              v-if="activeCard?.hint"
              :text="`${t('flashcards.hint')}: ${activeCard.hint}`"
              location="left"
            >
              <template #activator="{ props: tooltipProps }">
                <VBtn
                  v-bind="tooltipProps"
                  icon="mdi-help-circle-outline"
                  variant="text"
                  color="primary"
                  :disabled="!activeCard"
                />
              </template>
            </VTooltip>

            <VBtn
              :icon="isSpeaking ? 'mdi-stop-circle-outline' : 'mdi-play-circle-outline'"
              variant="text"
              color="primary"
              :disabled="!activeCard"
              :aria-label="t('flashcards.playAudio')"
              :title="t('flashcards.playAudio')"
              @click="toggleSpeakActiveCardText"
            />
          </div>

          <div
            class="mx-auto mb-6"
            style="max-width: 740px;"
          >
            <div
              class="position-relative"
              style="min-height: 360px; perspective: 1600px; touch-action: pan-y;"
            >
              <div
                v-for="(card, stackIndex) in visibleDeckCards"
                :key="`${card.id}-${stackIndex}`"
                class="position-absolute top-0 start-0 w-100 h-100"
                :style="cardStackStyle(stackIndex)"
              >
                <template v-if="stackIndex === 0">
                  <div
                    class="position-relative h-100"
                    :style="topCardMotionStyle"
                    @pointerdown="onPointerDown"
                    @pointermove="onPointerMove"
                    @pointerup="onPointerUp"
                    @pointercancel="onPointerCancel"
                    @click="toggleFlip"
                  >
                    <div
                      class="position-relative h-100"
                      :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 260ms ease', transformStyle: 'preserve-3d' }"
                    >
                      <div :style="faceBaseStyle">
                        <VCard
                          class="h-100 d-flex flex-column bg-surface"
                          rounded="xl"
                          elevation="4"
                          variant="outlined">
                          <VCardText class="d-flex flex-column h-100 pa-5 pa-md-6 ga-4">
                            <div class="d-flex align-center justify-space-between ga-2">
                              <VChip
                                color="primary"
                                variant="tonal"
                                prepend-icon="mdi-text-box-outline">
                                {{ t('flashcards.text') }}
                              </VChip>
                              <VChip
                                color="secondary"
                                variant="tonal">
                                {{ t('flashcards.swipeHint') }}
                              </VChip>
                            </div>

                            <div class="d-flex flex-column ga-3 flex-grow-1 justify-center">
                              <p class="text-overline mb-0 text-medium-emphasis">
                                {{ t('flashcards.text') }}
                              </p>
                              <p class="text-headline-medium text-md-h2 font-weight-bold text-wrap mb-0">
                                {{ card.text }}
                              </p>

                              <VDivider class="my-2" />

                              <div class="d-flex ga-2 flex-wrap">
                                <VChip
                                  color="primary"
                                  variant="tonal">
                                  {{ t('flashcards.language') }}: {{ card.language }}
                                </VChip>
                                <VChip
                                  color="secondary"
                                  variant="tonal">
                                  {{ t('flashcards.level') }}: {{ t(`flashcards.levels.${card.level}`) }}
                                </VChip>
                              </div>
                            </div>

                            <p class="text-body-small text-medium-emphasis mb-0">
                              {{ t('flashcards.cardTapHint') }}
                            </p>
                          </VCardText>
                        </VCard>
                      </div>

                      <div :style="[faceBaseStyle, backFaceStyle]">
                        <VCard
                          class="h-100 d-flex flex-column bg-surface"
                          rounded="xl"
                          elevation="4"
                          variant="outlined">
                          <VCardText class="d-flex flex-column h-100 pa-5 pa-md-6 ga-4">
                            <div class="d-flex align-center justify-space-between ga-2">
                              <VChip
                                color="success"
                                variant="tonal"
                                prepend-icon="mdi-translate">
                                {{ t('flashcards.translation') }}
                              </VChip>
                              <VChip
                                :color="card.isKnown ? 'success' : 'error'"
                                variant="tonal">
                                {{ card.isKnown ? t('flashcards.known') : t('flashcards.unknown') }}
                              </VChip>
                            </div>

                            <div class="d-flex flex-column ga-3 flex-grow-1 justify-center">
                              <p class="text-overline mb-0 text-medium-emphasis">
                                {{ t('flashcards.translation') }}
                              </p>
                              <p class="text-headline-medium text-md-h2 font-weight-bold text-wrap mb-0">
                                {{ card.translation }}
                              </p>

                            </div>

                            <p class="text-body-small text-medium-emphasis mb-0">
                              {{ t('flashcards.cardFlipHint') }}
                            </p>
                          </VCardText>
                        </VCard>
                      </div>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <VCard
                    class="h-100 bg-surface"
                    rounded="xl"
                    elevation="4"
                    variant="outlined">
                    <VCardText class="d-flex flex-column justify-center h-100 pa-5 pa-md-6">
                      <div class="d-flex align-center justify-space-between ga-2 mb-4">
                        <VChip
                          color="secondary"
                          variant="tonal">
                          {{ t('flashcards.nextCard') }} {{ stackIndex }}
                        </VChip>
                        <VChip
                          :color="card.isKnown ? 'success' : 'warning'"
                          variant="tonal">
                          {{ card.isKnown ? t('flashcards.known') : t('flashcards.unknown') }}
                        </VChip>
                      </div>
                      <p class="text-h5 font-weight-bold mb-2">
                        {{ card.text }}
                      </p>
                      <p class="text-body-medium text-medium-emphasis mb-4">
                        {{ card.language }} · {{ t(`flashcards.levels.${card.level}`) }}
                      </p>
                      <p class="text-body-small text-medium-emphasis mb-0">
                        {{ t('flashcards.stackPreview') }}
                      </p>
                    </VCardText>
                  </VCard>
                </template>
              </div>
            </div>
          </div>

          <div class="d-flex justify-center align-center ga-3 flex-wrap mb-6">
            <VBtn
              color="error"
              variant="outlined"
              prepend-icon="mdi-close-circle-outline"
              :disabled="!activeCard"
              @click="handleDontKnow"
            >
              {{ t('flashcards.unknown') }}
            </VBtn>

            <VBtn
              color="success"
              variant="flat"
              prepend-icon="mdi-check-circle-outline"
              :disabled="!activeCard"
              @click="handleKnow"
            >
              {{ t('flashcards.known') }}
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VCardText>
  </VCard>
</template>
