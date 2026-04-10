import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { Timestamp, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch, type DocumentData, type DocumentReference } from 'firebase/firestore'
import { AI_FLASHCARD_GENERATION_COUNT, AI_FLASHCARD_SYSTEM_INSTRUCTION, buildAiFlashcardPrompt, resolveFlashcardTranslationLanguage } from '../constants/ai-flashcard-prompts'
import { FIREBASE_COLLECTIONS } from '../constants/firebase-collections'
import { parseAiGeneratedFlashcardList } from '../models/schemas/ai-generated-flashcard.schema'
import type { ResultTaskPayload } from '../models/types/result'
import type { FlashcardDocument } from '../models/schemas/flashcard.schema'
import { useFirebase } from '../composables/useFirebase'
import { normalizeFlashcardKey, shuffleItems, toDate } from '../helpers/flashcard-converters'
import { useSharedStore } from './use-shared-store'

export interface FlashcardListItem extends FlashcardDocument {
  id: string
  normalizedKey: string
  selectedForAdd: boolean
  disabledDuplicate: boolean
}

export const useFlashcardsStore = defineStore('flashcards', () => {
  const { db, generateJsonWithAi } = useFirebase()
  const sharedStore = useSharedStore()
  const savedCards = ref<FlashcardListItem[]>([])
  const generatedCards = ref<FlashcardListItem[]>([])
  const saving = ref(false)

  const hasPendingGenerated = computed(() => generatedCards.value.length > 0)
  const selectedGeneratedCount = computed(() => generatedCards.value.filter(card => card.selectedForAdd && !card.disabledDuplicate).length)
  const generating = computed(() => sharedStore.loading)
  const loading = computed(() => sharedStore.loading)
  const error = computed(() => sharedStore.error)

  const sortBySelectionStatus = (cards: FlashcardListItem[]) => {
    const getRank = (card: FlashcardListItem) => {
      if (card.disabledDuplicate) {
        return 2
      }

      if (card.selectedForAdd) {
        return 1
      }

      return 0
    }

    return [...cards].sort((leftCard, rightCard) => {
      const rankDiff = getRank(leftCard) - getRank(rightCard)
      return rankDiff
    })
  }

  const sortedGeneratedCards = computed(() => sortBySelectionStatus(generatedCards.value))

  const refreshGeneratedDuplicateFlags = () => {
    const existingKeys = new Set(savedCards.value.map(card => card.normalizedKey))

    generatedCards.value = generatedCards.value.map(card => ({
      ...card,
      disabledDuplicate: existingKeys.has(card.normalizedKey),
      selectedForAdd: existingKeys.has(card.normalizedKey) ? false : card.selectedForAdd,
    }))
  }

  const fetchSavedCards = async (uid: string) => {
    sharedStore.startLoading()

    try {
      const userReference = doc(db, FIREBASE_COLLECTIONS.users, uid)
      const snapshot = await getDocs(query(
        collection(db, FIREBASE_COLLECTIONS.flashcards),
        where('userRef', '==', userReference),
      ))

      const nextSavedCards = snapshot.docs.map((flashcardDocument) => {
        const data = flashcardDocument.data() as {
          userRef: DocumentReference<DocumentData>
          text: string
          language: string
          level: FlashcardDocument['level']
          translation: string
          hint: string | null
          isKnown: boolean
          knownAt?: Timestamp | null
          createdAt?: Timestamp | null
          normalizedKey?: string
        }

        const normalizedKey = data.normalizedKey ?? normalizeFlashcardKey({
          text: data.text,
          translation: data.translation,
          language: data.language,
          level: data.level,
        })

        return {
          id: flashcardDocument.id,
          userRef: data.userRef,
          text: data.text,
          language: data.language,
          level: data.level,
          translation: data.translation,
          hint: data.hint ?? null,
          isKnown: Boolean(data.isKnown),
          knownAt: toDate(data.knownAt),
          createdAt: toDate(data.createdAt),
          normalizedKey,
          selectedForAdd: false,
          disabledDuplicate: false,
        } satisfies FlashcardListItem
      })

      savedCards.value = shuffleItems(nextSavedCards)

      refreshGeneratedDuplicateFlags()
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to fetch flashcards')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const generateFromTaskResults = async (uid: string, taskResults: ResultTaskPayload[], appLanguage: string) => {
    sharedStore.startLoading()

    try {
      if (taskResults.length === 0) {
        throw new Error('No task results to generate flashcards from')
      }

      await fetchSavedCards(uid)

      const translationLanguage = resolveFlashcardTranslationLanguage(appLanguage)

      const jsonText = await generateJsonWithAi({
        prompt: buildAiFlashcardPrompt(taskResults, translationLanguage),
        systemInstruction: AI_FLASHCARD_SYSTEM_INSTRUCTION,
        temperature: 0.35,
      })

      if (!jsonText) {
        throw new Error('AI response is empty')
      }

      const parsed = parseAiGeneratedFlashcardList(jsonText, AI_FLASHCARD_GENERATION_COUNT)
      const userReference = doc(db, FIREBASE_COLLECTIONS.users, uid)
      const existingKeys = new Set(savedCards.value.map(card => card.normalizedKey))

      const nextGeneratedCards = parsed.cards.map((card, index) => {
        const normalizedKey = normalizeFlashcardKey(card)
        const isDuplicate = existingKeys.has(normalizedKey)

        return {
          id: `generated-${index + 1}`,
          userRef: userReference,
          text: card.text,
          language: card.language,
          level: card.level,
          translation: card.translation,
          hint: card.hint,
          isKnown: false,
          knownAt: null,
          createdAt: null,
          normalizedKey,
          selectedForAdd: false,
          disabledDuplicate: isDuplicate,
        } satisfies FlashcardListItem
      })

      generatedCards.value = shuffleItems(nextGeneratedCards)
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to generate flashcards')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const updateGeneratedCard = (updatedCard: FlashcardListItem) => {
    generatedCards.value = generatedCards.value.map((card) => {
      if (card.id !== updatedCard.id) {
        return card
      }

      return {
        ...updatedCard,
        normalizedKey: normalizeFlashcardKey(updatedCard),
      }
    })

    refreshGeneratedDuplicateFlags()
  }

  const toggleGeneratedCardSelection = (cardId: string) => {
    generatedCards.value = generatedCards.value.map((card) => {
      if (card.id !== cardId || card.disabledDuplicate) {
        return card
      }

      return {
        ...card,
        selectedForAdd: !card.selectedForAdd,
      }
    })

    refreshGeneratedDuplicateFlags()
  }

  const saveSelectedGeneratedCards = async (uid: string) => {
    saving.value = true

    try {
      const selectedCards = generatedCards.value.filter(card => card.selectedForAdd && !card.disabledDuplicate)
      if (selectedCards.length === 0) {
        return 0
      }

      const userReference = doc(db, FIREBASE_COLLECTIONS.users, uid)
      const existingKeys = new Set(savedCards.value.map(card => card.normalizedKey))
      const batch = writeBatch(db)
      let savedCount = 0

      selectedCards.forEach((card) => {
        const normalizedKey = normalizeFlashcardKey(card)
        if (existingKeys.has(normalizedKey)) {
          return
        }

        const docRef = doc(collection(db, FIREBASE_COLLECTIONS.flashcards))
        batch.set(docRef, {
          userId: uid,
          userRef: userReference,
          text: card.text,
          language: card.language,
          level: card.level,
          translation: card.translation,
          hint: card.hint,
          isKnown: card.isKnown,
          knownAt: card.knownAt ? Timestamp.fromDate(card.knownAt) : null,
          createdAt: serverTimestamp(),
          normalizedKey,
        })

        existingKeys.add(normalizedKey)
        savedCount += 1
      })

      if (savedCount > 0) {
        await batch.commit()
      }

      await fetchSavedCards(uid)
      generatedCards.value = []

      return savedCount
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to save flashcards')
      throw caughtError
    }
    finally {
      saving.value = false
    }
  }

  const updateSavedCard = async (card: FlashcardListItem) => {
    const docRef = doc(db, FIREBASE_COLLECTIONS.flashcards, card.id)
    const normalizedKey = normalizeFlashcardKey(card)

    await updateDoc(docRef, {
      text: card.text,
      language: card.language,
      level: card.level,
      translation: card.translation,
      hint: card.hint,
      isKnown: card.isKnown,
      knownAt: card.knownAt ? Timestamp.fromDate(card.knownAt) : null,
      normalizedKey,
    })

    savedCards.value = savedCards.value.map(existingCard => (existingCard.id === card.id
      ? { ...card, normalizedKey }
      : existingCard))
  }

  const deleteSavedCard = async (cardId: string) => {
    sharedStore.startLoading()

    try {
      const docRef = doc(db, FIREBASE_COLLECTIONS.flashcards, cardId)

      await deleteDoc(docRef)

      savedCards.value = savedCards.value.filter(card => card.id !== cardId)
      refreshGeneratedDuplicateFlags()
    }
    catch (caughtError) {
      console.error('[use-flashcards-store] Delete failed:', caughtError)
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to delete flashcard')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  return {
    savedCards,
    generatedCards,
    sortedGeneratedCards,
    hasPendingGenerated,
    selectedGeneratedCount,
    loading,
    generating,
    saving,
    error,
    fetchSavedCards,
    generateFromTaskResults,
    toggleGeneratedCardSelection,
    updateGeneratedCard,
    updateSavedCard,
    deleteSavedCard,
    saveSelectedGeneratedCards,
    refreshGeneratedDuplicateFlags,
  }
})
