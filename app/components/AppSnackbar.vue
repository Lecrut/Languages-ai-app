<script setup lang="ts">
import { watch } from 'vue'
import { useSnackbarStore } from '../stores/use-snackbar-store'
import { useSharedStore } from '../stores/use-shared-store'

const snackbarStore = useSnackbarStore()
const sharedStore = useSharedStore()

const model = computed({
  get: () => snackbarStore.visible,
  set: (value: boolean) => {
    if (!value) {
      snackbarStore.hide()
    }
  },
})

watch(
  () => sharedStore.error,
  (errorMessage) => {
    if (!errorMessage) {
      return
    }

    snackbarStore.showError(errorMessage)
    sharedStore.clearError()
  },
)
</script>

<template>
  <ClientOnly>
    <VSnackbar
      v-model="model"
      :color="snackbarStore.color"
      :timeout="snackbarStore.timeout"
      location="bottom"
    >
      {{ snackbarStore.text }}
    </VSnackbar>
  </ClientOnly>
</template>
