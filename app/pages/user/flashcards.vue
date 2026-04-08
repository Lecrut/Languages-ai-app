<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FlashcardDeck from '../../components/FlashcardDeck.vue'
import FlashcardsListBase from '../../components/flashcards/FlashcardsListBase.vue'
import FlashcardDetailsPanel from '../../components/flashcards/FlashcardDetailsPanel.vue'
import { useAuthStore } from '../../stores/use-auth-store'
import { useFlashcardUpdate } from '../../composables/useFlashcardUpdate'
import { useSnackbarStore } from '../../stores/use-snackbar-store'
import type { FlashcardDocument } from '../../models/schemas/flashcard.schema'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const { setPageTitle } = usePageHead()
const authStore = useAuthStore()
const snackbarStore = useSnackbarStore()
const currentIndex = ref(0)
const listIndex = ref(0)
const isListViewVisible = ref(false)
const showKnownCards = ref(false)

const { flashcardsStore, currentCards, isSelectionMode, toggleSelectionAtIndex } = useFlashcardUpdate()

const deckCards = computed(() => {
  if (isSelectionMode.value) {
    return currentCards.value
  }

  return currentCards.value.filter(card => showKnownCards.value ? card.isKnown : !card.isKnown)
})

const selectedDeckCard = computed(() => deckCards.value[currentIndex.value] ?? null)
const selectedListCard = computed(() => currentCards.value[listIndex.value] ?? null)

onMounted(() => {
  setPageTitle(t('play.flashcardsTitle'))
})

const syncCards = async (uid: string | undefined) => {
  if (!uid) {
    return
  }

  await flashcardsStore.fetchSavedCards(uid)
}

const updateCard = async (card: FlashcardDocument) => {
  const sourceCard = currentCards.value.find(existingCard => existingCard.id === card.id)
  if (!sourceCard) {
    return
  }

  const mergedCard = {
    ...sourceCard,
    ...card,
  }

  if (flashcardsStore.hasPendingGenerated) {
    flashcardsStore.updateGeneratedCard(mergedCard)
    return
  }

  await flashcardsStore.updateSavedCard(mergedCard)
}

const deleteCardById = async (cardId: string | undefined) => {
  if (!cardId) {
    return
  }

  try {
    await flashcardsStore.deleteSavedCard(cardId)
    snackbarStore.showSuccess(t('flashcards.deleteSuccess'))
  }
  catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : t('flashcards.deleteError')
    snackbarStore.showError(message)
  }
}

const syncDeckSelectionFromCardId = (cardId: string | undefined) => {
  if (!cardId || isSelectionMode.value) {
    return
  }

  const selectedCard = currentCards.value.find(card => card.id === cardId)
  if (!selectedCard) {
    currentIndex.value = 0
    return
  }

  showKnownCards.value = selectedCard.isKnown

  const nextDeckCards = currentCards.value.filter(card => showKnownCards.value ? card.isKnown : !card.isKnown)
  const nextDeckIndex = nextDeckCards.findIndex(card => card.id === cardId)
  currentIndex.value = nextDeckIndex >= 0 ? nextDeckIndex : 0
}

const openListView = () => {
  if (isSelectionMode.value) {
    return
  }

  const selectedCardId = selectedDeckCard.value?.id
  const nextListIndex = currentCards.value.findIndex(card => card.id === selectedCardId)
  listIndex.value = nextListIndex >= 0 ? nextListIndex : 0
  isListViewVisible.value = true
}

const closeListView = () => {
  syncDeckSelectionFromCardId(selectedListCard.value?.id)
  isListViewVisible.value = false
}

const selectCardFromList = (index: number) => {
  listIndex.value = index
}

const openCardFromList = (index: number) => {
  const selectedCard = currentCards.value[index]
  if (!selectedCard) {
    return
  }

  syncDeckSelectionFromCardId(selectedCard.id)
  isListViewVisible.value = false
}

const saveSelectedCards = async () => {
  const uid = authStore.user?.uid
  if (!uid) {
    return
  }

  try {
    const savedCount = await flashcardsStore.saveSelectedGeneratedCards(uid)

    if (savedCount === 0) {
      snackbarStore.showError(t('flashcards.selectAtLeastOne'))
      return
    }

    snackbarStore.showSuccess(t('flashcards.savedCount', { count: savedCount }))

    if (flashcardsStore.savedCards.length > 0) {
      currentIndex.value = 0
      listIndex.value = 0
    }
  }
  catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : t('flashcards.saveError')
    snackbarStore.showError(message)
  }
}

watch(
  () => authStore.user?.uid,
  async (uid) => {
    await syncCards(uid)
  },
  { immediate: true },
)

watch(
  () => deckCards.value.length,
  (length) => {
    if (length === 0) {
      currentIndex.value = 0
      if (!isSelectionMode.value) {
        isListViewVisible.value = false
      }
      return
    }

    currentIndex.value = Math.max(0, Math.min(currentIndex.value, length - 1))
  },
  { immediate: true },
)

watch(
  () => currentCards.value.length,
  (length) => {
    if (length === 0) {
      listIndex.value = 0
      return
    }

    listIndex.value = Math.max(0, Math.min(listIndex.value, length - 1))
  },
  { immediate: true },
)

watch(
  () => showKnownCards.value,
  () => {
    if (!isSelectionMode.value) {
      currentIndex.value = 0
    }
  },
)
</script>

<template>
  <VContainer
    fluid
    class="pa-4 pa-md-6"
  >
    <div
      v-if="isSelectionMode"
      class="mb-4"
    >
      <VCard
        variant="tonal"
        color="primary"
      >
        <VCardText class="d-flex flex-column align-center justify-center ga-2 py-3 text-center">
          <p class="text-title-medium font-weight-bold my-1 text-center w-100">
            {{ t('flashcards.generatedTitle') }}
          </p>
          <VBtn
            color="primary"
            variant="flat"
            prepend-icon="mdi-content-save"
            :loading="flashcardsStore.saving"
            @click="saveSelectedCards"
          >
            {{ t('flashcards.saveSelectedCta', { count: flashcardsStore.selectedGeneratedCount }) }}
          </VBtn>
        </VCardText>
      </VCard>
    </div>

    <template v-if="isSelectionMode">
      <VRow>
        <VCol
          cols="12"
          lg="5"
        >
          <VCard
            class="d-flex flex-column h-100"
            style="max-height: calc(100dvh - 140px);"
          >
            <VCardTitle class="text-headline-small px-6 pt-4 pb-2">
              {{ t('flashcards.listTitle') }}
            </VCardTitle>
            <VCardText
              class="px-6 pt-0 pb-4 flex-grow-1"
              :class="currentCards.length ? 'overflow-y-auto' : 'overflow-hidden'"
            >
              <VAlert
                v-if="!currentCards.length"
                type="info"
                variant="tonal"
              >
                {{ t('flashcards.noCards') }}
              </VAlert>

              <div
                v-else
                class="d-flex flex-column ga-3"
              >
                <FlashcardsListBase
                  :cards="currentCards"
                  :selected-index="currentIndex"
                  :selection-mode="isSelectionMode"
                  @select="openCardFromList"
                  @toggle-selection="toggleSelectionAtIndex"
                />
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          lg="7"
        >
          <VCard
            class="d-flex flex-column h-100"
            style="max-height: calc(100dvh - 140px);"
          >
            <VCardText class="px-6 pt-6 pb-6 flex-grow-1 overflow-y-auto">
              <FlashcardDetailsPanel
                :card="selectedDeckCard"
                :allow-delete="false"
                :auto-edit-on-card-change="isSelectionMode"
                :force-edit-mode="isSelectionMode"
                @save="updateCard"
              />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <template v-else-if="!isListViewVisible">
      <FlashcardDeck
        v-model="currentIndex"
        v-model:show-known-cards="showKnownCards"
        :cards="deckCards"
        @save="updateCard"
        @delete="deleteCardById(selectedDeckCard?.id)"
        @open-list="openListView"
      />
    </template>

    <template v-else>
      <VRow>
        <VCol
          cols="12"
          lg="5"
        >
          <VCard
            class="d-flex flex-column h-100"
            style="max-height: calc(100dvh - 140px);"
          >
            <VCardTitle class="text-headline-small px-6 pt-4 pb-2 d-flex align-center justify-space-between ga-2 flex-wrap">
              <span>{{ t('flashcards.listTitle') }}</span>
              <VBtn
                color="primary"
                variant="flat"
                prepend-icon="mdi-arrow-left"
                @click="closeListView"
              >
                {{ t('flashcards.cardTitle') }}
              </VBtn>
            </VCardTitle>
            <VCardText
              class="px-6 pt-0 pb-4 flex-grow-1"
              :class="currentCards.length ? 'overflow-y-auto' : 'overflow-hidden'"
            >
              <VAlert
                v-if="!currentCards.length"
                type="info"
                variant="tonal"
              >
                {{ t('flashcards.noCards') }}
              </VAlert>

              <div
                v-else
                class="d-flex flex-column ga-3"
              >
                <FlashcardsListBase
                  :cards="currentCards"
                  :selected-index="listIndex"
                  :selection-mode="false"
                  @select="selectCardFromList"
                  @toggle-selection="toggleSelectionAtIndex"
                />
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          lg="7"
        >
          <VCard
            class="d-flex flex-column h-100"
            style="max-height: calc(100dvh - 140px);"
          >
            <VCardText class="px-6 pt-6 pb-6 flex-grow-1 overflow-y-auto">
              <FlashcardDetailsPanel
                :card="selectedListCard"
                :allow-delete="true"
                @save="updateCard"
                @delete="deleteCardById(selectedListCard?.id)"
              />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>
  </VContainer>
</template>
