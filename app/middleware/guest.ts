import { defineNuxtRouteMiddleware, navigateTo } from '#imports'
import { useAuthStore } from '../stores/use-auth-store'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    return
  }

  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.initAuth()
  }

  if (authStore.isAuthenticated) {
    return navigateTo('/user/profile')
  }
})