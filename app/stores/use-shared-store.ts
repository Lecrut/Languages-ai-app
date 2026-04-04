import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useSnackbarStore } from './use-snackbar-store'

export const useSharedStore = defineStore('shared', () => {
  const pendingRequests = ref(0)
  const error = ref<string | null>(null)
  const snackbarStore = useSnackbarStore()

  const loading = computed(() => pendingRequests.value > 0)

  const startLoading = () => {
    pendingRequests.value += 1
  }

  const stopLoading = () => {
    pendingRequests.value = Math.max(0, pendingRequests.value - 1)
  }

  const setError = (message: string) => {
    error.value = message
    snackbarStore.showError(message)
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    pendingRequests.value = 0
    error.value = null
  }

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setError,
    clearError,
    reset,
  }
})
