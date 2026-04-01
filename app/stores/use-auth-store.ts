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
import { useFirebaseAuth } from '../composables/useFirebaseAuth'

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
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = computed(() => Boolean(user.value))

  const initAuth = async () => {
    if (initialized.value || typeof window === 'undefined') {
      return
    }

    const { auth } = useFirebaseAuth()

    loading.value = true
    error.value = null

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
      error.value = caughtError instanceof Error ? caughtError.message : 'Authentication initialization failed'
    }
    finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    const { auth } = useFirebaseAuth()

    loading.value = true
    error.value = null

    try {
      await signInWithEmailAndPassword(auth, email, password)
      user.value = mapUser(auth.currentUser)
    }
    catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Login failed'
      throw caughtError
    }
    finally {
      loading.value = false
    }
  }

  const register = async (email: string, password: string) => {
    const { auth } = useFirebaseAuth()

    loading.value = true
    error.value = null

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      user.value = mapUser(auth.currentUser)
    }
    catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Registration failed'
      throw caughtError
    }
    finally {
      loading.value = false
    }
  }

  const logout = async () => {
    const { auth } = useFirebaseAuth()

    loading.value = true
    error.value = null

    try {
      await signOut(auth)
      user.value = null
    }
    catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Logout failed'
      throw caughtError
    }
    finally {
      loading.value = false
    }
  }

  const resetPassword = async (email: string, redirectUrl?: string) => {
    const { auth } = useFirebaseAuth()

    loading.value = true
    error.value = null

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
      error.value = caughtError instanceof Error ? caughtError.message : 'Password reset failed'
      throw caughtError
    }
    finally {
      loading.value = false
    }
  }

  const validatePasswordResetCode = async (code: string) => {
    const { auth } = useFirebaseAuth()

    loading.value = true
    error.value = null

    try {
      const email = await verifyPasswordResetCode(auth, code)
      return email
    }
    catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Invalid or expired password reset code'
      throw caughtError
    }
    finally {
      loading.value = false
    }
  }

  const confirmResetPassword = async (code: string, newPassword: string) => {
    const { auth } = useFirebaseAuth()

    loading.value = true
    error.value = null

    try {
      await confirmPasswordReset(auth, code, newPassword)
    }
    catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Password reset confirmation failed'
      throw caughtError
    }
    finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
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
  }
})