import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { FIREBASE_COLLECTIONS } from '../constants/firebase-collections'
import { TASKS_PER_SESSION_DEFAULT, clampTasksPerSession } from '../constants/task-session-settings'
import { getDefaultNicknameFromEmail } from '../helpers/auth-helpers'
import type { AuthUser } from '../models/auth-user'
import type { UserProfile, UserProfileUpdatePayload } from '../models/user-profile'
import { useFirebase } from '../composables/useFirebase'
import { useSharedStore } from './use-shared-store'

const FIRESTORE_OPERATION_TIMEOUT_MS = 10000

const withTimeout = async <T>(operation: Promise<T>, timeoutMessage: string): Promise<T> => {
  return await Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage))
      }, FIRESTORE_OPERATION_TIMEOUT_MS)
    }),
  ])
}

interface FirestoreUserProfile {
  uid: string
  nick: string
  appLanguage: string
  learningLanguage: string
  tasksPerSession?: number
  email: string
  createdAt?: Timestamp
}

const mapFirestoreProfile = (profile: FirestoreUserProfile): UserProfile => {
  const createdAtIso = profile.createdAt instanceof Timestamp
    ? profile.createdAt.toDate().toISOString()
    : new Date().toISOString()

  return {
    uid: profile.uid,
    nick: profile.nick,
    appLanguage: profile.appLanguage,
    learningLanguage: profile.learningLanguage,
    tasksPerSession: clampTasksPerSession(profile.tasksPerSession ?? TASKS_PER_SESSION_DEFAULT),
    email: profile.email,
    createdAt: createdAtIso,
  }
}

export const useUserProfileStore = defineStore('user-profile', () => {
  const profile = ref<UserProfile | null>(null)
  const sharedStore = useSharedStore()
  const loading = computed(() => sharedStore.loading)
  const saving = computed(() => sharedStore.loading)
  const error = computed(() => sharedStore.error)
  const hasProfile = computed(() => Boolean(profile.value))

  const setProfileFromFirestore = (userProfile: FirestoreUserProfile) => {
    profile.value = mapFirestoreProfile(userProfile)
  }

  const getUserDocRef = (uid: string) => {
    const { db } = useFirebase()

    return doc(db, FIREBASE_COLLECTIONS.users, uid)
  }

  const loadOrCreateProfile = async (authUser: AuthUser) => {
    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      const userDocRef = getUserDocRef(authUser.uid)
      const snapshot = await withTimeout(
        getDoc(userDocRef),
        'User profile fetch timed out',
      )

      if (!snapshot.exists()) {
        await withTimeout(
          setDoc(userDocRef, {
            uid: authUser.uid,
            nick: getDefaultNicknameFromEmail(authUser.email),
            appLanguage: 'pl',
            learningLanguage: 'en',
            tasksPerSession: TASKS_PER_SESSION_DEFAULT,
            email: authUser.email ?? '',
            createdAt: serverTimestamp(),
          }),
          'User profile creation timed out',
        )
      }

      const refreshedSnapshot = await withTimeout(
        getDoc(userDocRef),
        'User profile refresh timed out',
      )

      if (refreshedSnapshot.exists()) {
        setProfileFromFirestore(refreshedSnapshot.data() as FirestoreUserProfile)
      }
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to load user profile')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const updateProfile = async (uid: string, payload: UserProfileUpdatePayload) => {
    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      const userDocRef = getUserDocRef(uid)

      await withTimeout(
        updateDoc(userDocRef, {
          nick: payload.nick,
          appLanguage: payload.appLanguage,
          learningLanguage: payload.learningLanguage,
          tasksPerSession: clampTasksPerSession(payload.tasksPerSession),
        }),
        'User profile update timed out',
      )

      if (profile.value) {
        profile.value = {
          ...profile.value,
          nick: payload.nick,
          appLanguage: payload.appLanguage,
          learningLanguage: payload.learningLanguage,
          tasksPerSession: clampTasksPerSession(payload.tasksPerSession),
        }
      }
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to update profile')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const clearProfileError = () => {
    sharedStore.clearError()
  }

  const reset = () => {
    profile.value = null
  }

  return {
    profile,
    loading,
    saving,
    error,
    hasProfile,
    loadOrCreateProfile,
    updateProfile,
    clearProfileError,
    reset,
  }
})
