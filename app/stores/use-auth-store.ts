import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  browserLocalPersistence,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
  verifyPasswordResetCode,
} from 'firebase/auth'
import type { AuthUser } from '../models/auth-user'
import { useFirebase } from '../composables/useFirebase'
import { useResultsStore } from './use-results-store'
import { useSharedStore } from './use-shared-store'
import { useSnackbarStore } from './use-snackbar-store'
import { useTaskSessionStore } from './use-task-session-store'
import { useUserProfileStore } from './use-user-profile-store'

const mapUser = (user: User | null): AuthUser | null => {
  if (!user) {
    return null
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const initialized = ref(false)
  const sharedStore = useSharedStore()
  const loading = computed(() => sharedStore.loading)
  const error = computed(() => sharedStore.error)
  const isAuthenticated = computed(() => Boolean(user.value))

  const initAuth = async () => {
    if (initialized.value || typeof window === 'undefined') {
      return
    }

    const { auth } = useFirebase()

    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      await setPersistence(auth, browserLocalPersistence)

      await new Promise<void>((resolve) => {
        onAuthStateChanged(auth, (firebaseUser) => {
          user.value = mapUser(firebaseUser)
          initialized.value = true
          resolve()
        })
      })
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Authentication initialization failed')
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const login = async (email: string, password: string) => {
    const { auth } = useFirebase()

    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      await signInWithEmailAndPassword(auth, email, password)
      user.value = mapUser(auth.currentUser)
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Login failed')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const register = async (email: string, password: string) => {
    const { auth } = useFirebase()

    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      user.value = mapUser(auth.currentUser)
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Registration failed')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const logout = async () => {
    const { auth } = useFirebase()

    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      await signOut(auth)
      reset()

      useTaskSessionStore().reset()
      useResultsStore().reset()
      useUserProfileStore().reset()
      useSnackbarStore().reset()
      sharedStore.reset()
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Logout failed')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const resetPassword = async (email: string, redirectUrl?: string) => {
    const { auth } = useFirebase()

    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      if (redirectUrl) {
        await sendPasswordResetEmail(auth, email, {
          url: redirectUrl,
          handleCodeInApp: true,
        })

        return
      }

      await sendPasswordResetEmail(auth, email)
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Password reset failed')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const validatePasswordResetCode = async (code: string) => {
    const { auth } = useFirebase()

    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      const email = await verifyPasswordResetCode(auth, code)
      return email
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Invalid or expired password reset code')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const confirmResetPassword = async (code: string, newPassword: string) => {
    const { auth } = useFirebase()

    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      await confirmPasswordReset(auth, code, newPassword)
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Password reset confirmation failed')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const clearError = () => {
    sharedStore.clearError()
  }

  const reset = () => {
    user.value = null
    initialized.value = false
  }

  return {
    user,
    initialized,
    loading,
    error,
    isAuthenticated,
    initAuth,
    login,
    register,
    logout,
    resetPassword,
    validatePasswordResetCode,
    confirmResetPassword,
    clearError,
    reset,
  }
})