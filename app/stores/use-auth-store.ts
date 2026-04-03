import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  browserLocalPersistence,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
  verifyPasswordResetCode,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { AuthUser } from '../models/auth-user'
import { FIREBASE_COLLECTIONS } from '../constants/firebase-collections'
import { DEFAULT_LEARNING_LEVEL } from '../constants/learning-levels'
import { TASKS_PER_SESSION_DEFAULT } from '../constants/task-session-settings'
import { getDefaultNicknameFromEmail } from '../helpers/auth-helpers'
import { useFirebase } from '../composables/useFirebase'
import { useResultsStore } from './use-results-store'
import { useSharedStore } from './use-shared-store'
import { useSnackbarStore } from './use-snackbar-store'
import { useTaskSessionStore } from './use-task-session-store'
import { useUserProfileStore } from './use-user-profile-store'

const AUTH_OPERATION_TIMEOUT_MS = 10000

const withTimeout = async <T>(operation: Promise<T>, timeoutMessage: string): Promise<T> => {
  return await Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage))
      }, AUTH_OPERATION_TIMEOUT_MS)
    }),
  ])
}

const mapUser = (user: User | null): AuthUser | null => {
  if (!user) {
    return null
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const initialized = ref(false)
  const initPromise = ref<Promise<void> | null>(null)
  const sharedStore = useSharedStore()
  const userProfileStore = useUserProfileStore()
  const loading = computed(() => sharedStore.loading)
  const error = computed(() => sharedStore.error)
  const isAuthenticated = computed(() => Boolean(user.value))

  const syncUserProfile = async (authUser: AuthUser | null) => {
    if (!authUser) {
      userProfileStore.reset()
      return
    }

    await userProfileStore.loadOrCreateProfile(authUser)
  }

  const initAuth = async () => {
    if (initialized.value || typeof window === 'undefined') {
      return
    }

    if (initPromise.value) {
      await initPromise.value
      return
    }

    const { auth } = useFirebase()

    initPromise.value = (async () => {
      sharedStore.startLoading()
      sharedStore.clearError()

      try {
        await setPersistence(auth, browserLocalPersistence)

        let unsubscribeAuthStateListener: undefined | (() => void)

        await Promise.race([
          new Promise<void>((resolve) => {
            unsubscribeAuthStateListener = onAuthStateChanged(auth, (firebaseUser) => {
              user.value = mapUser(firebaseUser)
              initialized.value = true
              resolve()
            })
          }),
          new Promise<void>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Authentication initialization timed out'))
            }, 8000)
          }),
        ])

        if (typeof unsubscribeAuthStateListener === 'function') {
          unsubscribeAuthStateListener()
        }

        await syncUserProfile(user.value)
      }
      catch (caughtError) {
        initialized.value = true
        sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Authentication initialization failed')
      }
      finally {
        sharedStore.stopLoading()
        initPromise.value = null
      }
    })()

    await initPromise.value
  }

  const login = async (email: string, password: string) => {
    const { auth } = useFirebase()

    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      await signInWithEmailAndPassword(auth, email, password)
      user.value = mapUser(auth.currentUser)

      await syncUserProfile(user.value)
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Login failed')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const register = async (email: string, password: string, nick: string) => {
    const { auth, db } = useFirebase()

    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      const userDocRef = doc(db, FIREBASE_COLLECTIONS.users, userCredential.user.uid)
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        nick: nick.trim() || getDefaultNicknameFromEmail(userCredential.user.email),
        appLanguage: 'pl',
        learningLanguage: 'en',
        appTheme: 'light',
        level: DEFAULT_LEARNING_LEVEL,
        tasksPerSession: TASKS_PER_SESSION_DEFAULT,
        email: userCredential.user.email ?? '',
        createdAt: serverTimestamp(),
      })
      
      await sendEmailVerification(userCredential.user)
      
      await signOut(auth)
      user.value = null
      userProfileStore.reset()
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
      await withTimeout(
        signOut(auth),
        'Logout timed out',
      )
      reset()

      useTaskSessionStore().reset({ preserveRecoverableSession: true })
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

  const resendVerificationEmail = async () => {
    const { auth } = useFirebase()

    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      if (!auth.currentUser) {
        throw new Error('No user logged in')
      }

      await sendEmailVerification(auth.currentUser)
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to send verification email')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const refreshEmailVerificationStatus = async () => {
    const { auth } = useFirebase()

    try {
      if (!auth.currentUser) {
        return
      }

      await auth.currentUser.reload()
      user.value = mapUser(auth.currentUser)
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to refresh verification status')
    }
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
    resendVerificationEmail,
    refreshEmailVerificationStatus,
    clearError,
    reset,
  }
})