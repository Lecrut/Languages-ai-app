import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { FIREBASE_COLLECTIONS } from '../constants/firebase-collections'
import type { AuthUser } from '../models/auth-user'
import type { UserProfile, UserProfileUpdatePayload } from '../models/user-profile'
import { useFirebaseAuth } from '../composables/useFirebaseAuth'

interface FirestoreUserProfile {
  uid: string
  nick: string
  appLanguage: string
  learningLanguage: string
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
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const hasProfile = computed(() => Boolean(profile.value))

  const getUserDocRef = (uid: string) => {
    const { auth } = useFirebaseAuth()
    const db = getFirestore(auth.app)

    return doc(db, FIREBASE_COLLECTIONS.users, uid)
  }

  const loadOrCreateProfile = async (authUser: AuthUser) => {
    loading.value = true
    error.value = null

    try {
      const userDocRef = getUserDocRef(authUser.uid)
      const snapshot = await getDoc(userDocRef)

      if (!snapshot.exists()) {
        await setDoc(userDocRef, {
          uid: authUser.uid,
          nick: getDefaultNick(authUser),
          appLanguage: 'pl',
          learningLanguage: 'en',
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
      error.value = caughtError instanceof Error ? caughtError.message : 'Failed to load user profile'
      throw caughtError
    }
    finally {
      loading.value = false
    }
  }

  const updateProfile = async (uid: string, payload: UserProfileUpdatePayload) => {
    saving.value = true
    error.value = null

    try {
      const userDocRef = getUserDocRef(uid)

      await updateDoc(userDocRef, {
        nick: payload.nick,
        appLanguage: payload.appLanguage,
        learningLanguage: payload.learningLanguage,
        email: payload.email,
      })

      await loadOrCreateProfile({
        uid,
        email: payload.email,
        displayName: null,
      })
    }
    catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Failed to update profile'
      throw caughtError
    }
    finally {
      saving.value = false
    }
  }

  const clearProfileError = () => {
    error.value = null
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
  }
})
