<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useAuthStore } from '../../stores/use-auth-store'
import { useFlashcardEditor } from '../../composables/useFlashcardEditor'
import { fromDateTimeLocalValue } from '../../helpers/flashcard-converters'
import type { FlashcardDocument } from '../../models/schemas/flashcard.schema'
import type { FlashcardListItem } from '../../stores/use-flashcards-store'
import FlashcardDetailsViewMode from './FlashcardDetailsViewMode.vue'
import FlashcardDetailsEditorMode from './FlashcardDetailsEditorMode.vue'
import FlashcardDeleteDialog from './FlashcardDeleteDialog.vue'

const props = defineProps<{
  card: FlashcardListItem | null
  allowDelete?: boolean
  autoEditOnCardChange?: boolean
  forceEditMode?: boolean
}>()

const emit = defineEmits<{
  save: [card: FlashcardListItem]
  delete: [card: FlashcardListItem]
}>()

const { t } = useI18n()
const authStore = useAuthStore()
const cardRef = toRef(props, 'card')

const { isEditing, draftCard, knownAtInput, startEditing, saveEditing } = useFlashcardEditor(cardRef)
const isDeleteDialogOpen = ref(false)

const isVerified = computed(() => authStore.user?.emailVerified ?? false)
const isForceEditMode = computed(() => Boolean(props.forceEditMode))
const canEdit = computed(() => (isForceEditMode.value ? props.card !== null : isVerified.value && props.card !== null))
const canDelete = computed(() => Boolean(props.allowDelete && props.card))
const cardStatusLabel = computed(() => {
  if (!props.card) {
    return ''
  }

  return props.card.isKnown ? t('flashcards.known') : t('flashcards.unknown')
})
const cardStatusColor = computed(() => (props.card?.isKnown ? 'success' : 'error'))

const handleSave = () => {
  const updatedCard = saveEditing()
  if (updatedCard) {
    emit('save', updatedCard)
  }
}

const handleDraftCardUpdate = (card: FlashcardDocument) => {
  if (!props.card) {
    return
  }

  const nextDraftCard: FlashcardListItem = {
    ...props.card,
    ...card,
  }

  draftCard.value = nextDraftCard

  if (!isForceEditMode.value) {
    return
  }

  const liveUpdatedCard: FlashcardListItem = {
    ...nextDraftCard,
    knownAt: fromDateTimeLocalValue(knownAtInput.value),
  }

  emit('save', liveUpdatedCard)
}

const handleKnownAtInputUpdate = (value: string) => {
  knownAtInput.value = value

  if (!isForceEditMode.value || !draftCard.value) {
    return
  }

  const liveUpdatedCard: FlashcardListItem = {
    ...draftCard.value,
    knownAt: fromDateTimeLocalValue(value),
  }

  emit('save', liveUpdatedCard)
}

const openDeleteDialog = () => {
  if (!canDelete.value) {
    return
  }

  isDeleteDialogOpen.value = true
}

const handleDeleteConfirm = () => {
  if (!props.card) {
    console.log('[FlashcardDetailsPanel] Delete: card is null')
    return
  }

  console.log('[FlashcardDetailsPanel] Delete emit:', props.card)
  emit('delete', props.card)
}

const editButtonTooltip = computed(() => {
  if (!isVerified.value && !isForceEditMode.value) {
    return t('flashcards.needVerification')
  }
  if (!props.card) {
    return t('flashcards.editButtonBelow')
  }
  return ''
})

watch(
  () => props.card,
  () => {
    if ((!props.autoEditOnCardChange && !isForceEditMode.value) || !canEdit.value || !props.card) {
      return
    }

    startEditing()
  },
  { immediate: true },
)
</script>

<template>
  <div class="d-flex flex-column ga-3 mb-4">
    <div class="d-flex align-center justify-space-between ga-3 flex-wrap">
      <div class="text-title-large font-weight-bold">
        {{ t('flashcards.cardTitle') }}
      </div>

      <div class="d-flex justify-end ga-2 flex-wrap">
        <VTooltip
          v-if="!isForceEditMode"
          :text="editButtonTooltip"
          :disabled="canEdit"
        >
          <template #activator="{ props: tooltipProps }">
            <VBtn
              v-bind="tooltipProps"
              :icon="isEditing ? 'mdi-content-save' : 'mdi-pencil'"
              :color="isEditing ? 'success' : 'primary'"
              :variant="isEditing ? 'flat' : 'outlined'"
              :disabled="!canEdit"
              @click="isEditing ? handleSave() : startEditing()"
            />
          </template>
        </VTooltip>

        <VBtn
          v-if="canDelete && !isForceEditMode"
          icon="mdi-delete"
          color="error"
          variant="outlined"
          @click="openDeleteDialog"
        />
      </div>
    </div>

    <VChip
      v-if="cardStatusLabel"
      :color="cardStatusColor"
      variant="tonal"
      class="align-self-start"
    >
      {{ cardStatusLabel }}
    </VChip>
  </div>

  <FlashcardDeleteDialog
    v-model="isDeleteDialogOpen"
    :card="card"
    @confirm="handleDeleteConfirm"
  />

  <template v-if="card">
    <FlashcardDetailsViewMode
      v-if="!isEditing"
      :card="card"
    />
    <FlashcardDetailsEditorMode
      v-else
      :draft-card="draftCard!"
      :known-at-input="knownAtInput"
      @update:draft-card="handleDraftCardUpdate"
      @update:known-at-input="handleKnownAtInputUpdate"
    />
  </template>

  <VAlert
    v-else
    type="info"
    variant="tonal"
  >
    {{ t('flashcards.noSelection') }}
  </VAlert>
</template>
