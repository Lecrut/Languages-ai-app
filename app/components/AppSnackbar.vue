<script setup lang="ts">
import { useSnackbarStore } from '../stores/use-snackbar-store'

const snackbarStore = useSnackbarStore()

const model = computed({
  get: () => snackbarStore.visible,
  set: (value: boolean) => {
    if (!value) {
      snackbarStore.hide()
    }
  },
})
</script>

<template>
  <VSnackbar
    v-model="model"
    :color="snackbarStore.color"
    :timeout="snackbarStore.timeout"
    location="bottom"
  >
    {{ snackbarStore.text }}
  </VSnackbar>
</template>
