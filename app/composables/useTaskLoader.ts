import { ref, computed } from 'vue'
import {
  collection,
  getDocs,
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
  aiPromptParams: Omit<AiTaskPromptParams, 'tasksCount'>
}

/**
 * Loads tasks based on mode, with automatic fallback to AI-generated tasks
 * Fallback rule: If mode 'new'|'improve'|'repeat' returns < tasksCount tasks,
 * fill the gap with AI-generated tasks
 */
export function useTaskLoader() {
  const { db, generateTasksJsonWithAi } = useFirebase()

  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Query Firestore for tasks with result status
   * Returns only task IDs (for efficiency)
   */
  const fetchTaskIdsByResultStatus = async (
    userId: string,
    isPassed: boolean | null,
  ): Promise<string[]> => {
    try {
      // Query: users/{userId}/results where isPassed = filter
      const resultsCollection = collection(db, FIREBASE_COLLECTIONS.users, userId, 'results')

      const constraints: QueryConstraint[] = []
      if (isPassed !== null) {
        constraints.push(where('isPassed', '==', isPassed))
      }
      constraints.push(limit(1000)) // Safety limit

      const q = query(resultsCollection, ...constraints)
      const snapshot = await getDocs(q)

      // Document IDs ARE the task IDs
      return snapshot.docs.map(doc => doc.id)
    }
    catch (err) {
      console.error('Error fetching task IDs by result status:', err)
      throw err
    }
  }

  /**
   * Fetch full task documents from Firestore
   */
  const fetchTaskDocuments = async (taskIds: string[]): Promise<TaskSessionTask[]> => {
    if (taskIds.length === 0) {
      return []
    }

    try {
      const tasksCollection = collection(db, FIREBASE_COLLECTIONS.tasks)
      // Firestore IN queries limited to 30 items, batch if needed
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

  /**
   * Generate new tasks via AI
   */
  const generateAiTasks = async (params: Omit<AiTaskPromptParams, 'tasksCount'>, count: number): Promise<TaskSessionTask[]> => {
    // This mirrors logic from useTaskSessionStore.generateTasksWithAi
    // but returns raw task array without saving to store
    try {
      const { parseAiGeneratedTaskList } = await import('../models/ai-generated-task.schema')
      const { addDoc } = await import('firebase/firestore')

      const rawJson = await generateTasksJsonWithAi({
        ...params,
        tasksCount: count,
      })

      const parsed = parseAiGeneratedTaskList(rawJson, count)

      const savedTasks = await Promise.all(
        parsed.tasks.map(async (task) => {
          const tasksCollectionRef = collection(db, FIREBASE_COLLECTIONS.tasks)
          const docRef = await addDoc(tasksCollectionRef, {
            ...task,
            createdAt: new Date().toISOString(),
          })

          return {
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

  /**
   * Main loader function with fallback logic
   */
  const loadTasks = async (params: UseTaskLoaderParams): Promise<TaskSessionTask[]> => {
    loading.value = true
    error.value = null

    try {
      // Mode 'ai' = force AI generation
      if (params.mode === 'ai') {
        return await generateAiTasks(params.aiPromptParams, params.tasksCount)
      }

      // Modes 'new', 'improve', 'repeat' = query Firestore with fallback
      let taskIds: string[] = []

      if (params.mode === 'new') {
        // New: tasks that don't have any result in users/{userId}/results
        // This requires fetching all task results, then filtering
        try {
          const allResultIds = await fetchTaskIdsByResultStatus(params.userId, null)
          // We need to get ALL tasks and exclude those in results
          // This is expensive, but necessary for true "new" tasks
          // Alternative: flag in tasks collection (hasAttempted: boolean)
          // For now, we'll query tasks and subtract
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
      else if (params.mode === 'improve') {
        // Improve: tasks with isPassed = false
        taskIds = await fetchTaskIdsByResultStatus(params.userId, false)
      }
      else if (params.mode === 'repeat') {
        // Repeat: tasks with isPassed = true
        taskIds = await fetchTaskIdsByResultStatus(params.userId, true)
      }

      // Fetch full documents
      let tasks: TaskSessionTask[] = []
      if (taskIds.length > 0) {
        tasks = await fetchTaskDocuments(taskIds.slice(0, params.tasksCount))
      }

      // FALLBACK: If we got fewer tasks than requested, fill with AI-generated
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
