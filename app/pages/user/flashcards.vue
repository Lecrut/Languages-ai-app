<script setup lang="ts">
import { ref, watch } from 'vue'
import FlashcardDeck from '../../components/FlashcardDeck.vue'
import FlashcardsListBase from '../../components/flashcards/FlashcardsListBase.vue'
import { useAuthStore } from '../../stores/use-auth-store'
import { useFlashcardUpdate } from '../../composables/useFlashcardUpdate'
import { useSnackbarStore } from '../../stores/use-snackbar-store'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const { setPageTitle } = usePageHead()
const authStore = useAuthStore()
const snackbarStore = useSnackbarStore()
const currentIndex = ref(0)
const isListViewVisible = ref(false)

const { flashcardsStore, currentCards, isSelectionMode, updateCardFromDeck, toggleSelectionAtIndex } = useFlashcardUpdate()

onMounted(() => {
  setPageTitle(t('play.flashcardsTitle'))
})

const syncCards = async (uid: string | undefined) => {
  if (!uid) {
    return
  }

  await flashcardsStore.fetchSavedCards(uid)
}

const openListView = () => {
  isListViewVisible.value = true
}

const closeListView = () => {
  isListViewVisible.value = false
}

const selectCardFromList = (index: number) => {
  currentIndex.value = index
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
    await router.push(localePath('/user/flashcards'))
  }
  catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : t('flashcards.saveError')
    snackbarStore.showError(message)
  }
}

const deleteCardFromDeck = async () => {
  const card = currentCards.value[currentIndex.value]
  if (!card) {
    return
  }

  try {
    await flashcardsStore.deleteSavedCard(card.id)
    snackbarStore.showSuccess(t('flashcards.deleteSuccess'))
  }
  catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : t('flashcards.deleteError')
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
  () => currentCards.value.length,
  (length) => {
    if (length === 0) {
      currentIndex.value = 0
      isListViewVisible.value = false
      return
    }

    currentIndex.value = Math.max(0, Math.min(currentIndex.value, length - 1))
  },
  { immediate: true },
)

watch(
  () => currentCards.value,
  () => {
    if (!currentCards.value.length) {
      isListViewVisible.value = false
    }
  },
  { deep: true },
)
</script>

<template>
  <VRow class="justify-center">
    <VCol
      cols="12"
      sm="11"
      md="10"
      lg="10"
      xl="9"
    >
      <VCard
        v-if="isSelectionMode"
        class="mb-4"
        variant="tonal"
        color="primary"
      >
        <VCardText class="d-flex flex-column align-center ga-3 text-center pa-5">
          <p class="text-body-large font-weight-bold mb-0">
            {{ t('flashcards.generatedTitle') }}
          </p>
          <p class="text-body-medium text-medium-emphasis mb-0">
            {{ t('flashcards.generatedDescription') }}
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

      <FlashcardDeck
        v-if="!isListViewVisible"
        v-model="currentIndex"
        :cards="currentCards"
        :title="t('flashcards.title')"
        :subtitle="t('flashcards.subtitle')"
        :selection-mode="isSelectionMode"
        @know="(card) => updateCardFromDeck(card, currentIndex)"
        @dont-know="(card) => updateCardFromDeck(card, currentIndex)"
        @save="(card) => updateCardFromDeck(card, currentIndex)"
        @delete="deleteCardFromDeck"
        @toggle-selection="toggleSelectionAtIndex"
        @open-list="openListView"
      />

      <VCard
        v-else
        class="mx-auto"
        max-width="1600"
        rounded="xl"
        elevation="10"
      >
        <VCardText class="pa-4 pa-md-6">
          <div class="d-flex flex-column flex-md-row align-md-center justify-space-between ga-3 mb-4">
            <div>
              <p class="text-h3 text-md-h2 font-weight-bold mb-1">{{ t('flashcards.listTitle') }}</p>
              <p class="text-body-large mb-0 text-medium-emphasis">{{ t('flashcards.subtitle') }}</p>
            </div>

            <VBtn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-arrow-left"
              @click="closeListView"
            >
              {{ t('flashcards.closeList') }}
            </VBtn>
          </div>

          <FlashcardsListBase
            :cards="currentCards"
            :selected-index="currentIndex"
            :selection-mode="isSelectionMode"
            @select="selectCardFromList"
            @toggle-selection="toggleSelectionAtIndex"
          />
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
