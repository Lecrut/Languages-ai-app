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
import type { AuthUser } from '../models/auth-user'
import type { UserProfile, UserProfileUpdatePayload } from '../models/user-profile'
import { useFirebase } from '../composables/useFirebase'
import { useSharedStore } from './use-shared-store'

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

const getDefaultNick = (authUser: AuthUser) => {
  if (!authUser.email) {
    return 'user'
  }

  return authUser.email.split('@')[0] || 'user'
}

export const useUserProfileStore = defineStore('user-profile', () => {
  const profile = ref<UserProfile | null>(null)
  const sharedStore = useSharedStore()
  const loading = computed(() => sharedStore.loading)
  const saving = computed(() => sharedStore.loading)
  const error = computed(() => sharedStore.error)
  const hasProfile = computed(() => Boolean(profile.value))

  const getUserDocRef = (uid: string) => {
    const { db } = useFirebase()

    return doc(db, FIREBASE_COLLECTIONS.users, uid)
  }

  const loadOrCreateProfile = async (authUser: AuthUser) => {
    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      const userDocRef = getUserDocRef(authUser.uid)
      const snapshot = await getDoc(userDocRef)

      if (!snapshot.exists()) {
        await setDoc(userDocRef, {
          uid: authUser.uid,
          nick: getDefaultNick(authUser),
          appLanguage: 'pl',
          learningLanguage: 'en',
          tasksPerSession: TASKS_PER_SESSION_DEFAULT,
          email: authUser.email ?? '',
          createdAt: serverTimestamp(),
        })
      }

      const refreshedSnapshot = await getDoc(userDocRef)

      if (refreshedSnapshot.exists()) {
        profile.value = mapFirestoreProfile(refreshedSnapshot.data() as FirestoreUserProfile)
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

      await updateDoc(userDocRef, {
        nick: payload.nick,
        appLanguage: payload.appLanguage,
        learningLanguage: payload.learningLanguage,
        tasksPerSession: clampTasksPerSession(payload.tasksPerSession),
        email: payload.email,
      })

      await loadOrCreateProfile({
        uid,
        email: payload.email,
        displayName: null,
      })
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
