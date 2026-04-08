import { ref, watch, type Ref } from 'vue'
import { cloneFlashcardDocument, fromDateTimeLocalValue, toDateTimeLocalValue } from '../helpers/flashcard-converters'
import { flashcardSchema, type FlashcardDocument } from '../models/schemas/flashcard.schema'

export const useFlashcardEditor = (card: Ref<FlashcardDocument | null>) => {
  const isEditing = ref(false)
  const draftCard = ref<FlashcardDocument | null>(null)
  const knownAtInput = ref('')

  const syncDraft = () => {
    if (!card.value) {
      draftCard.value = null
      knownAtInput.value = ''
      isEditing.value = false
      return
    }

    draftCard.value = cloneFlashcardDocument(card.value)
    knownAtInput.value = toDateTimeLocalValue(card.value.knownAt)
    isEditing.value = false
  }

  const startEditing = () => {
    if (!card.value) {
      return
    }

    draftCard.value = cloneFlashcardDocument(card.value)
    knownAtInput.value = toDateTimeLocalValue(card.value.knownAt)
    isEditing.value = true
  }

  const cancelEditing = () => {
    syncDraft()
  }

  const saveEditing = (): FlashcardDocument | null => {
    if (!draftCard.value) {
      return null
    }

    const updatedCard = flashcardSchema.parse({
      ...draftCard.value,
      knownAt: fromDateTimeLocalValue(knownAtInput.value),
    })

    isEditing.value = false
    return updatedCard
  }

  watch(
    card,
    () => {
      syncDraft()
    },
    { immediate: true },
  )

  return {
    isEditing,
    draftCard,
    knownAtInput,
    startEditing,
    cancelEditing,
    saveEditing,
  }
}
