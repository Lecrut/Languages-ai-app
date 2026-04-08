<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '../../helpers/format-date'
import type { FlashcardDocument } from '../../models/schemas/flashcard.schema'

const props = defineProps<{
  card: FlashcardDocument | null
}>()

const { t, locale } = useI18n()

const isKnownLabel = computed(() => (props.card?.isKnown ? t('flashcards.known') : t('flashcards.unknown')))
const userRefLabel = computed(() => props.card?.userRef.id ?? '-')
const createdAtLabel = computed(() => formatDateTime(props.card?.createdAt ?? null, locale.value))
const knownAtLabel = computed(() => formatDateTime(props.card?.knownAt ?? null, locale.value))
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

    <VCol
      cols="12"
      md="6"
    >
      <VTextField
        :model-value="isKnownLabel"
        :label="t('flashcards.isKnown')"
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

    <VCol
      cols="12"
      md="6"
    >
      <VTextField
        :model-value="card?.knownAt ? knownAtLabel : '-'"
        :label="t('flashcards.knownAt')"
        variant="outlined"
        readonly
      />
    </VCol>

    <VCol
      cols="12"
      md="6"
    >
      <VTextField
        :model-value="userRefLabel"
        :label="t('flashcards.userRef')"
        variant="outlined"
        readonly
      />
    </VCol>

    <VCol
      cols="12"
      md="6"
    >
      <VTextField
        :model-value="createdAtLabel"
        :label="t('flashcards.createdAt')"
        variant="outlined"
        readonly
      />
    </VCol>
  </VRow>
</template>
