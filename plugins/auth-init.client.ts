import { useAuthStore } from '../app/stores/use-auth-store'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  authStore.initAuth()
})
