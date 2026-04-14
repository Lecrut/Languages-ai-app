import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  where,
  limit,
  type QueryConstraint,
} from 'firebase/firestore'
import { useFirebase } from './useFirebase'
import { FIREBASE_COLLECTIONS } from '../constants/firebase-collections'
import type { TaskSessionTask } from '../stores/use-task-session-store'
import type { AiTaskPromptParams } from '../constants/ai-task-prompts'

export type TaskLoadMode = 'new' | 'improve' | 'repeat' | 'ai'

interface UseTaskLoaderParams {
  mode: TaskLoadMode
  tasksCount: number
  userId: string
  preferredSubject: string
  preferredLevel: string
  aiPromptParams: Omit<AiTaskPromptParams, 'tasksCount'>
}

const normalizeLanguageLabel = (value: string) => value.trim().toLowerCase()

const normalizeLevel = (value: string) => value.trim().toLowerCase()

const shuffleItems = <T>(items: T[]) => [...items].sort(() => Math.random() - 0.5)

const unique = <T>(items: T[]) => [...new Set(items)]

const matchesPreferredProfile = (task: TaskSessionTask, preferredSubject: string, preferredLevel: string) => {
  const normalizedPreferredSubject = normalizeLanguageLabel(preferredSubject)
  const normalizedPreferredLevel = normalizeLevel(preferredLevel)

  return (
    normalizeLanguageLabel(task.subject) === normalizedPreferredSubject
    || normalizeLanguageLabel(task.targetLanguage) === normalizedPreferredSubject
  ) && normalizeLevel(task.level) === normalizedPreferredLevel
}

export function useTaskLoader() {
  const { db, generateTasksJsonWithAi } = useFirebase()

  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTaskIdsByResultStatus = async (
    userId: string,
    isPassed: boolean | null,
  ): Promise<string[]> => {
    try {
      const resultsCollection = collection(db, FIREBASE_COLLECTIONS.users, userId, 'results')

      const constraints: QueryConstraint[] = []
      if (isPassed !== null) {
        constraints.push(where('isPassed', '==', isPassed))
      }
      constraints.push(limit(1000))

      const q = query(resultsCollection, ...constraints)
      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => doc.id)
    }
    catch (err) {
      console.error('Error fetching task IDs by result status:', err)
      throw err
    }
  }

  const fetchTaskDocuments = async (taskIds: string[]): Promise<TaskSessionTask[]> => {
    if (taskIds.length === 0) {
      return []
    }

    try {
      const tasksCollection = collection(db, FIREBASE_COLLECTIONS.tasks)
      const batchSize = 30
      const results: TaskSessionTask[] = []

      for (let i = 0; i < taskIds.length; i += batchSize) {
        const batch = taskIds.slice(i, i + batchSize)
        const q = query(
          tasksCollection,
          where('__name__', 'in', batch), // Query by document IDs
        )
        const snapshot = await getDocs(q)
        results.push(...snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        } as TaskSessionTask)))
      }

      return results
    }
    catch (err) {
      console.error('Error fetching task documents:', err)
      throw err
    }
  }

  const fetchTaskIdsFromLatestSessions = async (
    userId: string,
    isPassed: boolean,
  ): Promise<string[]> => {
    try {
      const userReference = doc(db, FIREBASE_COLLECTIONS.users, userId)
      const resultsCollection = collection(db, FIREBASE_COLLECTIONS.results)
      const latestSessionsQuery = query(
        resultsCollection,
        where('userReference', '==', userReference),
        orderBy('date', 'desc'),
        limit(10),
      )
      const snapshot = await getDocs(latestSessionsQuery)

      const orderedTaskIds: string[] = []
      snapshot.docs.forEach((sessionDocument) => {
        const data = sessionDocument.data() as {
          task?: Array<{
            taskReference?: { id?: string }
            isPassed?: boolean
          }>
        }

        ;(data.task ?? []).forEach((taskEntry) => {
          if (Boolean(taskEntry.isPassed) !== isPassed) {
            return
          }

          const taskId = taskEntry.taskReference?.id
          if (taskId) {
            orderedTaskIds.push(taskId)
          }
        })
      })

      return unique(orderedTaskIds)
    }
    catch (err) {
      console.error('Error fetching task IDs from latest sessions:', err)
      throw err
    }
  }

  const generateAiTasks = async (promptParams: Omit<AiTaskPromptParams, 'tasksCount'>, count: number): Promise<TaskSessionTask[]> => {
    try {
      const { parseAiGeneratedTaskList } = await import('../models/schemas/ai-generated-task.schema')
      const { addDoc } = await import('firebase/firestore')

      const rawJson = await generateTasksJsonWithAi({
        ...promptParams,
        tasksCount: count,
      })

      const parsed = parseAiGeneratedTaskList(rawJson, count)

      const savedTasks = await Promise.all(
        parsed.tasks.map(async (task) => {
          const tasksCollectionRef = collection(db, FIREBASE_COLLECTIONS.tasks)
          const docRef = await addDoc(tasksCollectionRef, {
            subject: promptParams.subject,
            ...task,
            createdAt: new Date().toISOString(),
          })

          return {
            subject: promptParams.subject,
            ...task,
            id: docRef.id,
          } as TaskSessionTask
        }),
      )

      return savedTasks
    }
    catch (err) {
      console.error('Error generating AI tasks:', err)
      throw err
    }
  }

  const loadTasks = async (params: UseTaskLoaderParams): Promise<TaskSessionTask[]> => {
    loading.value = true
    error.value = null

    try {
      if (params.mode === 'ai') {
        return await generateAiTasks(params.aiPromptParams, params.tasksCount)
      }

      if (params.mode === 'improve' || params.mode === 'repeat') {
        const isPassed = params.mode === 'repeat'
        const latestSessionTaskIds = await fetchTaskIdsFromLatestSessions(params.userId, isPassed)
        const fallbackTaskIds = latestSessionTaskIds.length === 0
          ? await fetchTaskIdsByResultStatus(params.userId, isPassed)
          : []
        const sourceTaskIds = unique([
          ...latestSessionTaskIds,
          ...fallbackTaskIds,
        ])

        const fetchedTasks = await fetchTaskDocuments(sourceTaskIds)
        const matchingTasks = fetchedTasks.filter(task => matchesPreferredProfile(
          task,
          params.preferredSubject,
          params.preferredLevel,
        ))
        const randomizedTasks = shuffleItems(matchingTasks)
        const selectedTasks = randomizedTasks.slice(0, params.tasksCount)

        if (selectedTasks.length === 0) {
          const modeLabel = params.mode === 'repeat' ? 'passed' : 'failed'
          throw new Error(`No ${modeLabel} tasks found for your current language and level.`)
        }

        return selectedTasks
      }

      let taskIds: string[] = []

      if (params.mode === 'new') {
        try {
          const allResultIds = await fetchTaskIdsByResultStatus(params.userId, null)
          const tasksCollection = collection(db, FIREBASE_COLLECTIONS.tasks)
          const allTasks = await getDocs(query(tasksCollection, limit(1000)))
          const allTaskIds = allTasks.docs.map(doc => doc.id)

          taskIds = allTaskIds.filter(id => !allResultIds.includes(id))
        }
        catch (err) {
          console.error('Error fetching new tasks:', err)
          taskIds = []
        }
      }

      let tasks: TaskSessionTask[] = []
      if (taskIds.length > 0) {
        const fetchedTasks = await fetchTaskDocuments(taskIds)
        const matchingTasks = fetchedTasks.filter(task => matchesPreferredProfile(
          task,
          params.preferredSubject,
          params.preferredLevel,
        ))
        tasks = shuffleItems(matchingTasks).slice(0, params.tasksCount)
      }

      const remainingCount = params.tasksCount - tasks.length
      if (remainingCount > 0) {
        const aiTasks = await generateAiTasks(params.aiPromptParams, remainingCount)
        tasks.push(...aiTasks)
      }

      return tasks
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks'
      error.value = message
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    loadTasks,
  }
}
