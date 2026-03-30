import { useAuthStore } from '../app/stores/use-auth-store'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  await authStore.initAuth()
})
