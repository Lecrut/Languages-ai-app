import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore'
import { FIREBASE_COLLECTIONS } from '../constants/firebase-collections'
import type { AuthUser } from '../models/types/auth-user'
import {
  applyStreakCompletion,
  createDefaultStreakInfo,
  createDefaultFirestoreStreakInfo,
  mapFirestoreStreakInfo,
} from '../helpers/streak-info'
import type { FirestoreStreakInfo, StreakInfo } from '../models/types/streak-info'
import { useFirebase } from '../composables/useFirebase'
import { useSharedStore } from './use-shared-store'

export const useStreakInfoStore = defineStore('streak-info', () => {
  const streakInfo = ref<StreakInfo | null>(null)
  const sharedStore = useSharedStore()
  const loading = computed(() => sharedStore.loading)
  const saving = computed(() => sharedStore.loading)
  const error = computed(() => sharedStore.error)
  const hasStreakInfo = computed(() => Boolean(streakInfo.value))

  const getStreakInfoDocRef = (uid: string) => {
    const { db } = useFirebase()

    return doc(db, FIREBASE_COLLECTIONS.streakInfo, uid)
  }

  const setStreakInfoFromFirestore = (value: FirestoreStreakInfo) => {
    streakInfo.value = mapFirestoreStreakInfo(value)
  }

  const toFirestoreStreakInfoPayload = (value: StreakInfo) => ({
    currentCount: value.currentCount,
    longestCount: value.longestCount,
    actual: {
      from: value.actual.from,
      to: value.actual.to,
    },
    longest: {
      from: value.longest.from,
      to: value.longest.to,
    },
  })

  const loadOrCreateStreakInfo = async (authUser: AuthUser) => {
    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      const streakInfoDocRef = getStreakInfoDocRef(authUser.uid)
      const snapshot = await getDoc(streakInfoDocRef)

      if (!snapshot.exists()) {
        const defaultStreakInfo = createDefaultStreakInfo()

        await setDoc(streakInfoDocRef, createDefaultFirestoreStreakInfo())
        streakInfo.value = defaultStreakInfo
        return
      }

      setStreakInfoFromFirestore(snapshot.data() as FirestoreStreakInfo)
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to load streak info')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const reset = () => {
    streakInfo.value = null
  }

  const clearStreakInfoError = () => {
    sharedStore.clearError()
  }

  const recordSessionCompletion = async (
    uid: string,
    completedAt = new Date(),
    options?: { silent?: boolean },
  ) => {
    const shouldManageSharedState = !options?.silent

    if (shouldManageSharedState) {
      sharedStore.startLoading()
      sharedStore.clearError()
    }

    try {
      const { db } = useFirebase()
      const streakInfoDocRef = getStreakInfoDocRef(uid)

      const nextStreakInfo = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(streakInfoDocRef)
        const currentStreakInfo = snapshot.exists()
          ? mapFirestoreStreakInfo(snapshot.data() as FirestoreStreakInfo)
          : createDefaultStreakInfo()
        const completionResult = applyStreakCompletion(currentStreakInfo, completedAt)

        if (completionResult.shouldPersist) {
          transaction.set(streakInfoDocRef, toFirestoreStreakInfoPayload(completionResult.streakInfo), { merge: true })
        }

        return completionResult.streakInfo
      })

      streakInfo.value = nextStreakInfo
    }
    catch (caughtError) {
      if (shouldManageSharedState) {
        sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to update streak info')
      }

      throw caughtError
    }
    finally {
      if (shouldManageSharedState) {
        sharedStore.stopLoading()
      }
    }
  }

  return {
    streakInfo,
    loading,
    saving,
    error,
    hasStreakInfo,
    loadOrCreateStreakInfo,
    recordSessionCompletion,
    clearStreakInfoError,
    reset,
  }
})