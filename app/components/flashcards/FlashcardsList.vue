<script setup lang="ts">
import type { FlashcardDocument } from '../../models/schemas/flashcard.schema'
import FlashcardsListBase from './FlashcardsListBase.vue'

interface FlashcardListViewItem extends FlashcardDocument {
  selectedForAdd?: boolean
  disabledDuplicate?: boolean
}

defineProps<{
  cards: FlashcardListViewItem[]
  selectedIndex: number
  selectionMode?: boolean
}>()

defineEmits<{
  select: [index: number]
  toggleSelection: [index: number]
}>()

const { t } = useI18n()
</script>

<template>
  <VCard
    class="h-100"
    variant="outlined"
  >
    <VCardTitle class="text-h5 font-weight-bold pb-2">
      {{ t('flashcards.listTitle') }}
    </VCardTitle>
    <VCardText class="pt-0">
      <FlashcardsListBase
        :cards="cards"
        :selected-index="selectedIndex"
        :selection-mode="selectionMode"
        @select="$emit('select', $event)"
        @toggle-selection="$emit('toggleSelection', $event)"
      />
    </VCardText>
  </VCard>
</template>
