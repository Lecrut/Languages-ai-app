<script setup lang="ts">
import type { FlashcardDocument } from '../../models/schemas/flashcard.schema'
import FlashcardsListBase from './FlashcardsListBase.vue'

interface FlashcardListViewItem extends FlashcardDocument {
  selectedForAdd?: boolean
  disabledDuplicate?: boolean
}

const model = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  cards: FlashcardListViewItem[]
  selectedIndex: number
  isDesktop: boolean
  selectionMode?: boolean
}>(), {
  selectionMode: false,
})

const emit = defineEmits<{
  select: [index: number]
  toggleSelection: [index: number]
}>()

const { t } = useI18n()

const close = () => {
  model.value = false
}

const selectCard = (index: number) => {
  emit('select', index)
  close()
}
</script>

<template>
  <VDialog
    v-model="model"
    :fullscreen="!isDesktop"
    scrollable
    transition="dialog-bottom-transition"
  >
    <VCard>
      <VToolbar
        color="primary"
        density="comfortable"
      >
        <VToolbarTitle>{{ t('flashcards.listTitle') }}</VToolbarTitle>
        <VSpacer />
        <VBtn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </VToolbar>

      <VCardText class="pa-0">
        <FlashcardsListBase
          :cards="props.cards"
          :selected-index="props.selectedIndex"
          :selection-mode="props.selectionMode"
          @select="selectCard"
          @toggle-selection="$emit('toggleSelection', $event)"
        />
      </VCardText>
    </VCard>
  </VDialog>
</template>
