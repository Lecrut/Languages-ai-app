<script setup lang="ts">
import { computed } from 'vue'
import { LEARNING_LEVELS } from '../../constants/learning-levels'
import type { FlashcardDocument } from '../../models/schemas/flashcard.schema'

const props = defineProps<{
  draftCard: FlashcardDocument
  knownAtInput: string
}>()

const emit = defineEmits<{
  'update:draftCard': [card: FlashcardDocument]
  'update:knownAtInput': [value: string]
}>()

const { t } = useI18n()

const levelOptions = computed(() => LEARNING_LEVELS.map(level => ({
  title: t(`flashcards.levels.${level}`),
  value: level,
})))

const updateDraftField = <K extends keyof FlashcardDocument>(key: K, value: FlashcardDocument[K]) => {
  emit('update:draftCard', {
    ...props.draftCard,
    [key]: value,
  })
}

const handleIsKnownChange = (value: boolean | null) => {
  if (typeof value === 'boolean') {
    updateDraftField('isKnown', value)
  }
}
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="6"
    >
      <VTextField
        :model-value="draftCard.text"
        :label="t('flashcards.text')"
        variant="outlined"
        @update:model-value="updateDraftField('text', $event)"
      />
    </VCol>

    <VCol
      cols="12"
      md="6"
    >
      <VTextField
        :model-value="draftCard.language"
        :label="t('flashcards.language')"
        variant="outlined"
        @update:model-value="updateDraftField('language', $event)"
      />
    </VCol>

    <VCol
      cols="12"
      md="6"
    >
      <VSelect
        :model-value="draftCard.level"
        :items="levelOptions"
        item-title="title"
        item-value="value"
        :label="t('flashcards.level')"
        variant="outlined"
        @update:model-value="updateDraftField('level', $event)"
      />
    </VCol>

    <VCol
      cols="12"
      md="6"
    >
      <VSwitch
        :model-value="draftCard.isKnown"
        :label="t('flashcards.isKnown')"
        color="success"
        inset
        @update:model-value="handleIsKnownChange"
      />
    </VCol>

    <VCol cols="12">
      <VTextarea
        :model-value="draftCard.translation"
        :label="t('flashcards.translation')"
        variant="outlined"
        auto-grow
        rows="3"
        @update:model-value="updateDraftField('translation', $event)"
      />
    </VCol>

    <VCol cols="12">
      <VTextarea
        :model-value="draftCard.hint || ''"
        :label="t('flashcards.hint')"
        variant="outlined"
        auto-grow
        rows="2"
        :placeholder="t('flashcards.hintPlaceholder')"
        @update:model-value="updateDraftField('hint', $event || null)"
      />
    </VCol>

    <VCol
      cols="12"
      md="6"
    >
      <VTextField
        :model-value="knownAtInput"
        type="datetime-local"
        step="60"
        :label="t('flashcards.knownAt')"
        variant="outlined"
        @update:model-value="$emit('update:knownAtInput', $event)"
      />
    </VCol>
  </VRow>
</template>
