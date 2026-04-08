import { computed } from 'vue'
import type { FlashcardDocument } from '../models/schemas/flashcard.schema'
import type { FlashcardListItem } from '../stores/use-flashcards-store'
import { useFlashcardsStore } from '../stores/use-flashcards-store'

export const useFlashcardUpdate = () => {
  const flashcardsStore = useFlashcardsStore()

  const currentCards = computed(() => (flashcardsStore.hasPendingGenerated
    ? flashcardsStore.sortedGeneratedCards
    : flashcardsStore.savedCards))

  const isSelectionMode = computed(() => flashcardsStore.hasPendingGenerated)

  const updateCardFromDeck = async (card: FlashcardDocument, sourceIndex: number) => {
    const sourceCard = currentCards.value[sourceIndex] as FlashcardListItem | undefined
    if (!sourceCard) {
      return
    }

    const mergedCard: FlashcardListItem = {
      ...sourceCard,
      ...card,
    }

    if (flashcardsStore.hasPendingGenerated) {
      flashcardsStore.updateGeneratedCard(mergedCard)
      return
    }

    await flashcardsStore.updateSavedCard(mergedCard)
  }

  const toggleSelectionAtIndex = (index: number) => {
    if (!flashcardsStore.hasPendingGenerated) {
      return
    }

    const card = flashcardsStore.sortedGeneratedCards[index]
    if (!card) {
      return
    }

    flashcardsStore.toggleGeneratedCardSelection(card.id)
  }

  return {
    flashcardsStore,
    currentCards,
    isSelectionMode,
    updateCardFromDeck,
    toggleSelectionAtIndex,
  }
}
