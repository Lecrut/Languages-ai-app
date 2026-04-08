<script setup lang="ts">
import type { FlashcardDocument } from '../../models/schemas/flashcard.schema'
import AppConfirmDialog from '../AppConfirmDialog.vue'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  card: FlashcardDocument | null
}>()

const emit = defineEmits<{
  confirm: []
}>()

const { t } = useI18n()
</script>

<template>
  <AppConfirmDialog
    v-model="open"
    :title="t('flashcards.deleteDialogTitle')"
    :description="t('flashcards.deleteDialogDescription')"
    :confirm-label="t('flashcards.deleteConfirm')"
    :cancel-label="t('flashcards.deleteCancel')"
    confirm-color="error"
    confirm-icon="mdi-delete"
    :item-title="props.card?.text ?? null"
    :item-subtitle="props.card ? `${props.card.language} · ${t(`flashcards.levels.${props.card.level}`)}` : null"
    @confirm="emit('confirm')"
  />
</template>