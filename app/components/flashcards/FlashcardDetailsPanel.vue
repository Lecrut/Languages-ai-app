<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '../../stores/use-auth-store'
import { useFlashcardEditor } from '../../composables/useFlashcardEditor'
import type { FlashcardDocument } from '../../models/schemas/flashcard.schema'
import FlashcardDetailsViewMode from './FlashcardDetailsViewMode.vue'
import FlashcardDetailsEditorMode from './FlashcardDetailsEditorMode.vue'
import FlashcardDeleteDialog from './FlashcardDeleteDialog.vue'

const props = defineProps<{
  card: FlashcardDocument | null
  allowDelete?: boolean
}>()

const emit = defineEmits<{
  save: [card: FlashcardDocument]
  delete: []
}>()

const { t } = useI18n()
const authStore = useAuthStore()

const { isEditing, draftCard, knownAtInput, startEditing, cancelEditing, saveEditing } = useFlashcardEditor(props.card)
const isDeleteDialogOpen = ref(false)

const isVerified = computed(() => authStore.user?.emailVerified ?? false)
const canEdit = computed(() => isVerified.value && props.card !== null)
const showEditButton = computed(() => isVerified.value)
const canDelete = computed(() => Boolean(props.allowDelete && props.card))

const handleSave = () => {
  const updatedCard = saveEditing()
  if (updatedCard) {
    emit('save', updatedCard)
  }
}

const openDeleteDialog = () => {
  if (!canDelete.value) {
    return
  }

  isDeleteDialogOpen.value = true
}

const handleDeleteConfirm = () => {
  emit('delete')
}

const editButtonTooltip = computed(() => {
  if (!isVerified.value) {
    return t('flashcards.needVerification')
  }
  if (!props.card && isEditing.value) {
    return t('flashcards.editButtonBelow')
  }
  return ''
})
</script>

<template>
  <VCard
    class="mb-6"
    variant="tonal"
  >
    <VCardText class="d-flex flex-wrap align-center justify-space-between ga-3">
      <div>
        <p class="text-body-large font-weight-bold mb-1">
          {{ t('flashcards.detailTitle') }}
        </p>
        <p class="text-body-small mb-0 text-medium-emphasis">
          {{ t('flashcards.detailDescription') }}
        </p>
      </div>

      <div class="d-flex ga-2 flex-wrap">
        <VTooltip
          v-if="!isEditing && showEditButton"
          :text="editButtonTooltip"
          :disabled="canEdit"
        >
          <template #activator="{ props: tooltipProps }">
            <VBtn
              v-bind="tooltipProps"
              color="primary"
              variant="outlined"
              prepend-icon="mdi-pencil"
              :disabled="!canEdit"
              @click="startEditing"
            >
              {{ t('flashcards.edit') }}
            </VBtn>
          </template>
        </VTooltip>

        <VBtn
          v-if="canDelete"
          color="error"
          variant="outlined"
          prepend-icon="mdi-delete"
          @click="openDeleteDialog"
        >
          {{ t('flashcards.delete') }}
        </VBtn>

        <VBtn
          v-if="isEditing"
          color="success"
          variant="flat"
          prepend-icon="mdi-content-save"
          @click="handleSave"
        >
          {{ t('flashcards.save') }}
        </VBtn>
        <VBtn
          v-if="isEditing"
          color="secondary"
          variant="outlined"
          prepend-icon="mdi-close"
          @click="cancelEditing"
        >
          {{ t('flashcards.cancel') }}
        </VBtn>
      </div>
    </VCardText>
  </VCard>

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
      @update:draft-card="draftCard = $event"
      @update:known-at-input="knownAtInput = $event"
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
