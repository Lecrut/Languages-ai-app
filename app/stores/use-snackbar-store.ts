import { defineStore } from 'pinia'

export type SnackbarPayload = {
  text: string
  color?: 'success' | 'error' | 'info' | 'warning'
  timeout?: number
}

export const useSnackbarStore = defineStore('snackbar', () => {
  const visible = ref(false)
  const text = ref('')
  const color = ref<'success' | 'error' | 'info' | 'warning'>('info')
  const timeout = ref(4000)

  const show = ({ text: nextText, color: nextColor = 'info', timeout: nextTimeout = 4000 }: SnackbarPayload) => {
    text.value = nextText
    color.value = nextColor
    timeout.value = nextTimeout
    visible.value = true
  }

  const showError = (message: string, messageTimeout = 4500) => {
    show({ text: message, color: 'error', timeout: messageTimeout })
  }

  const showSuccess = (message: string, messageTimeout = 3500) => {
    show({ text: message, color: 'success', timeout: messageTimeout })
  }

  const hide = () => {
    visible.value = false
  }

  return {
    visible,
    text,
    color,
    timeout,
    show,
    showError,
    showSuccess,
    hide,
  }
})
