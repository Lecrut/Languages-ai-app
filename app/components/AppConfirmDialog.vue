<script setup lang="ts">
const open = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  title: string
  description?: string
  confirmLabel: string
  cancelLabel?: string
  confirmColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  confirmIcon?: string
  itemTitle?: string | null
  itemSubtitle?: string | null
  maxWidth?: number | string
}>(), {
  description: undefined,
  cancelLabel: undefined,
  confirmColor: 'error',
  confirmIcon: 'mdi-check',
  itemTitle: null,
  itemSubtitle: null,
  maxWidth: 520,
})

const emit = defineEmits<{
  confirm: []
}>()

const close = () => {
  open.value = false
}

const confirm = () => {
  emit('confirm')
  close()
}
</script>

<template>
  <VDialog
    v-model="open"
    :max-width="props.maxWidth"
  >
    <VCard>
      <VCardTitle class="text-h6 font-weight-bold">
        {{ props.title }}
      </VCardTitle>

      <VCardText>
        <p
          v-if="props.description"
          class="mb-3"
        >
          {{ props.description }}
        </p>

        <VAlert
          v-if="props.itemTitle"
          type="warning"
          variant="tonal"
        >
          <div class="font-weight-medium">
            {{ props.itemTitle }}
          </div>
          <div
            v-if="props.itemSubtitle"
            class="text-body-small text-medium-emphasis"
          >
            {{ props.itemSubtitle }}
          </div>
        </VAlert>
      </VCardText>

      <VCardActions class="justify-end pa-4 pt-0">
        <VBtn
          variant="text"
          @click="close"
        >
          {{ props.cancelLabel ?? 'Cancel' }}
        </VBtn>

        <VBtn
          :color="props.confirmColor"
          variant="flat"
          :prepend-icon="props.confirmIcon"
          @click="confirm"
        >
          {{ props.confirmLabel }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>