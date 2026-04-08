import { ref, watch, type Ref } from 'vue'
import { cloneFlashcardDocument, fromDateTimeLocalValue, toDateTimeLocalValue } from '../helpers/flashcard-converters'
import { flashcardSchema, type FlashcardDocument } from '../models/schemas/flashcard.schema'

export const useFlashcardEditor = <TCard extends FlashcardDocument>(card: Ref<TCard | null>) => {
  const isEditing = ref(false)
  const draftCard = ref<TCard | null>(null)
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

  const saveEditing = (): TCard | null => {
    if (!draftCard.value) {
      return null
    }

    const validatedCard = flashcardSchema.parse({
      ...draftCard.value,
      knownAt: fromDateTimeLocalValue(knownAtInput.value),
    })

    const updatedCard = {
      ...draftCard.value,
      ...validatedCard,
    } satisfies TCard

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
