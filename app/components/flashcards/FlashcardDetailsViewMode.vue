<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '../../helpers/format-date'
import type { FlashcardDocument } from '../../models/schemas/flashcard.schema'

const props = defineProps<{
  card: FlashcardDocument | null
}>()

const { t, locale } = useI18n()

const createdAtLabel = computed(() => formatDateTime(props.card?.createdAt ?? null, locale.value))
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="6"
    >
      <VTextField
        :model-value="card?.text ?? '-'"
        :label="t('flashcards.text')"
        variant="outlined"
        readonly
      />
    </VCol>

    <VCol
      cols="12"
      md="6"
    >
      <VTextField
        :model-value="card?.language ?? '-'"
        :label="t('flashcards.language')"
        variant="outlined"
        readonly
      />
    </VCol>

    <VCol
      cols="12"
      md="6"
    >
      <VTextField
        :model-value="card?.level ? t(`flashcards.levels.${card.level}`) : '-'"
        :label="t('flashcards.level')"
        variant="outlined"
        readonly
      />
    </VCol>

    <VCol cols="12">
      <VTextField
        :model-value="card?.translation ?? '-'"
        :label="t('flashcards.translation')"
        variant="outlined"
        readonly
      />
    </VCol>

    <VCol cols="12">
      <VTextField
        :model-value="card?.hint || '-'"
        :label="t('flashcards.hint')"
        variant="outlined"
        readonly
      />
    </VCol>

    <VCol cols="12">
      <div class="text-body-small text-medium-emphasis pt-2">
        {{ t('flashcards.createdAt') }}: {{ createdAtLabel }}
      </div>
    </VCol>
  </VRow>
</template>
