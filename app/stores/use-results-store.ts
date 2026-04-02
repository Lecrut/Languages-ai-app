import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { FIREBASE_COLLECTIONS } from '../constants/firebase-collections'
import type { ResultSessionItem, ResultTaskPayload } from '../models/result'
import { useFirebase } from '../composables/useFirebase'
import { useSharedStore } from './use-shared-store'

const PAGE_SIZE = 10
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

export const useResultsStore = defineStore('results', () => {
  const sharedStore = useSharedStore()
  const sessions = ref<ResultSessionItem[]>([])
  const hasMore = ref(true)
  const loadingMore = ref(false)
  const lastVisibleDoc = ref<QueryDocumentSnapshot<DocumentData> | null>(null)
  const saving = computed(() => sharedStore.loading)
  const error = computed(() => sharedStore.error)

  const saveResultSummary = async (uid: string, taskResults: ResultTaskPayload[]) => {
    const { db } = useFirebase()

    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      const userReference = doc(db, FIREBASE_COLLECTIONS.users, uid)
      const task = taskResults.map(({ taskId, isPassed, question, correctAnswer, userAnswer }) => ({
        taskReference: doc(db, FIREBASE_COLLECTIONS.tasks, taskId),
        isPassed,
        question,
        correctAnswer,
        userAnswer,
      }))

      await withTimeout(
        addDoc(collection(db, FIREBASE_COLLECTIONS.results), {
          userReference,
          date: serverTimestamp(),
          task,
        }),
        'Saving results timed out',
      )

      const mappedTasks = taskResults.map(taskEntry => ({
        id: taskEntry.taskId,
        isPassed: taskEntry.isPassed,
        question: taskEntry.question,
        correctAnswer: taskEntry.correctAnswer,
        userAnswer: taskEntry.userAnswer,
      }))
      const correctCount = mappedTasks.filter(taskEntry => taskEntry.isPassed).length
      const incorrectCount = mappedTasks.length - correctCount

      sessions.value = [{
        id: crypto.randomUUID(),
        date: new Date(),
        correctCount,
        incorrectCount,
        totalTasks: mappedTasks.length,
        tasks: mappedTasks,
      }, ...sessions.value]
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to save result summary')
      throw caughtError
    }
    finally {
      sharedStore.stopLoading()
    }
  }

  const reset = () => {
    sessions.value = []
    hasMore.value = true
    loadingMore.value = false
    lastVisibleDoc.value = null
  }

  const fetchLatestSessions = async (uid: string, options?: { loadMore?: boolean }) => {
    const { db } = useFirebase()
    const isLoadMore = Boolean(options?.loadMore)

    if (isLoadMore && (!hasMore.value || !uid)) {
      return
    }

    if (!isLoadMore) {
      sessions.value = []
      hasMore.value = true
      lastVisibleDoc.value = null
    }

    loadingMore.value = isLoadMore
    sharedStore.startLoading()
    sharedStore.clearError()

    try {
      const userReference = doc(db, FIREBASE_COLLECTIONS.users, uid)
      const baseQuery = query(
        collection(db, FIREBASE_COLLECTIONS.results),
        where('userReference', '==', userReference),
        orderBy('date', 'desc'),
        limit(PAGE_SIZE),
      )

      const paginatedQuery = isLoadMore && lastVisibleDoc.value
        ? query(
            collection(db, FIREBASE_COLLECTIONS.results),
            where('userReference', '==', userReference),
            orderBy('date', 'desc'),
            startAfter(lastVisibleDoc.value),
            limit(PAGE_SIZE),
          )
        : baseQuery

      const snapshot = await withTimeout(
        getDocs(paginatedQuery),
        'Fetching results timed out',
      )
      const nextSessions = snapshot.docs.map((sessionDocument) => {
        const data = sessionDocument.data() as {
          date?: Timestamp
          task?: Array<{
            taskReference?: { id?: string }
            isPassed?: boolean
            question?: string
            correctAnswer?: string
            userAnswer?: string
          }>
        }

        const taskEntries = data.task ?? []
        const mappedTasks = taskEntries.map((taskEntry, index) => ({
          id: taskEntry.taskReference?.id ?? `task-${index}`,
          isPassed: Boolean(taskEntry.isPassed),
          question: taskEntry.question ?? '-',
          correctAnswer: taskEntry.correctAnswer ?? '-',
          userAnswer: taskEntry.userAnswer ?? '-',
        }))
        const correctCount = mappedTasks.filter(taskEntry => taskEntry.isPassed).length
        const incorrectCount = taskEntries.length - correctCount

        return {
          id: sessionDocument.id,
          date: data.date instanceof Timestamp ? data.date.toDate() : null,
          correctCount,
          incorrectCount,
          totalTasks: taskEntries.length,
          tasks: mappedTasks,
        }
      })

      sessions.value = isLoadMore ? [...sessions.value, ...nextSessions] : nextSessions
      hasMore.value = snapshot.docs.length === PAGE_SIZE
      lastVisibleDoc.value = snapshot.docs.at(-1) ?? null
    }
    catch (caughtError) {
      sharedStore.setError(caughtError instanceof Error ? caughtError.message : 'Failed to fetch result sessions')
      throw caughtError
    }
    finally {
      loadingMore.value = false
      sharedStore.stopLoading()
    }
  }

  return {
    sessions,
    hasMore,
    loadingMore,
    saving,
    error,
    saveResultSummary,
    fetchLatestSessions,
    reset,
  }
})
