<script setup lang="ts">
import type { FlashcardDocument } from '../../models/schemas/flashcard.schema'

interface FlashcardListViewItem extends FlashcardDocument {
  id: string
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
  <div class="d-flex flex-column ga-3">
    <VCard
      v-for="(card, index) in cards"
      :key="card.id"
      :variant="index === selectedIndex ? 'tonal' : 'elevated'"
      rounded="lg"
      class="cursor-pointer"
      :class="{ 'opacity-60': card.disabledDuplicate, 'border border-primary': index === selectedIndex }"
      @click="$emit('select', index)"
    >
      <VCardText class="d-flex ga-3 align-start py-3">
        <VCheckboxBtn
          v-if="selectionMode"
          :model-value="Boolean(card.selectedForAdd)"
          :disabled="Boolean(card.disabledDuplicate)"
          color="primary"
          class="mt-1"
          @click.stop="$emit('toggleSelection', index)"
        />

        <div class="d-flex flex-column ga-3 flex-grow-1 min-w-0">
          <span class="text-body-large font-weight-medium">{{ card.text }}</span>

          <div class="d-flex ga-2 flex-wrap align-center">
            <VChip
              size="small"
              color="primary"
              variant="tonal"
            >
              {{ card.language }}
            </VChip>
            <VChip
              size="small"
              color="secondary"
              variant="tonal"
            >
              {{ t(`flashcards.levels.${card.level}`) }}
            </VChip>
            <VChip
              size="small"
              :color="card.disabledDuplicate ? 'grey' : (card.isKnown ? 'success' : 'warning')"
              variant="tonal"
            >
              {{ card.disabledDuplicate ? t('flashcards.alreadyAdded') : (card.isKnown ? t('flashcards.known') : t('flashcards.unknown')) }}
            </VChip>
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>
