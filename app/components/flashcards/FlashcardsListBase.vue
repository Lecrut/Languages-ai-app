<script setup lang="ts">
import type { FlashcardDocument } from '../../models/schemas/flashcard.schema'

interface FlashcardListViewItem extends FlashcardDocument {
  selectedForAdd?: boolean
  disabledDuplicate?: boolean
}

withDefaults(defineProps<{
  cards: FlashcardListViewItem[]
  selectedIndex: number
  selectionMode?: boolean
}>(), {
  selectionMode: false,
})

defineEmits<{
  select: [index: number]
  toggleSelection: [index: number]
}>()

const { t } = useI18n()
</script>

<template>
  <VList
    lines="two"
    density="comfortable"
    class="bg-transparent"
  >
    <VListItem
      v-for="(card, index) in cards"
      :key="card.text + '-' + card.language + '-' + index"
      :active="index === selectedIndex"
      rounded="lg"
      class="mb-2"
      :class="{ 'opacity-60': card.disabledDuplicate }"
      @click="$emit('select', index)"
    >
      <VListItemTitle class="font-weight-medium">
        {{ card.text }}
      </VListItemTitle>
      <VListItemSubtitle>
        {{ card.language }} · {{ t(`flashcards.levels.${card.level}`) }}
      </VListItemSubtitle>
      <template #append>
        <VChip
          size="small"
          :color="card.disabledDuplicate ? 'grey' : (card.isKnown ? 'success' : 'warning')"
          variant="tonal"
        >
          {{ card.disabledDuplicate ? t('flashcards.alreadyAdded') : (card.isKnown ? t('flashcards.known') : t('flashcards.unknown')) }}
        </VChip>
        <VCheckboxBtn
          v-if="selectionMode"
          :model-value="Boolean(card.selectedForAdd)"
          :disabled="Boolean(card.disabledDuplicate)"
          color="primary"
          @click.stop="$emit('toggleSelection', index)"
        />
      </template>
    </VListItem>
  </VList>
</template>
