import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { TASKS_PER_SESSION_DEFAULT, clampTasksPerSession } from '../constants/task-session-settings'
import { TASK_SESSION_STORAGE } from '../constants/task-session-storage'
import type { AiTaskPromptParams } from '../constants/ai-task-prompts'
import { FIREBASE_COLLECTIONS } from '../constants/firebase-collections'
import { parseAiGeneratedTaskList } from '../models/schemas/ai-generated-task.schema'
import type { TaskDocument } from '../models/types/task'
import type { ResultTaskPayload } from '../models/types/result'
import { normalizeAnswer } from '../helpers/normalize-answer'
import { useFirebase } from '../composables/useFirebase'
import { useSnackbarStore } from './use-snackbar-store'
import { useUserProfileStore } from './use-user-profile-store'

export interface TaskSessionTask extends Omit<TaskDocument, 'reference'> {
  id: string
}

interface TaskEvaluation {
  userAnswer: string
  isCorrect: boolean
}

interface PersistedTaskSession {
  version: number
  tasks: TaskSessionTask[]
  currentTaskIndex: number
  evaluations: Record<string, TaskEvaluation>
}

interface GenerateTasksWithAiParams extends Omit<AiTaskPromptParams, 'tasksCount'> {
  tasksCount?: number
}

interface ResetTaskSessionOptions {
  preserveRecoverableSession?: boolean
}

export const useTaskSessionStore = defineStore('task-session', () => {
  const userProfileStore = useUserProfileStore()
  const snackbarStore = useSnackbarStore()
  const tasks = ref<TaskSessionTask[]>([])
  const started = ref(false)
  const currentTaskIndex = ref(0)
  const evaluations = ref<Record<string, TaskEvaluation>>({})
  const generating = ref(false)
  const generationError = ref<string | null>(null)
  const recoverableSession = ref<PersistedTaskSession | null>(null)
  const persistenceSuspended = ref(false)

  const totalTasks = computed(() => tasks.value.length)
  const currentTask = computed(() => tasks.value[currentTaskIndex.value] ?? null)
  const currentTaskNumber = computed(() => {
    if (!started.value || !totalTasks.value) {
      return 0
    }

    return Math.min(currentTaskIndex.value + 1, totalTasks.value)
  })
  const completed = computed(() => started.value && currentTaskIndex.value >= totalTasks.value)
  const correctCount = computed(() => Object.values(evaluations.value).filter(evaluation => evaluation.isCorrect).length)
  const incorrectCount = computed(() => Object.values(evaluations.value).filter(evaluation => !evaluation.isCorrect).length)
  const currentEvaluation = computed(() => {
    const task = currentTask.value
    if (!task) {
      return null
    }

    return evaluations.value[task.id] ?? null
  })
  const taskResults = computed<ResultTaskPayload[]>(() => tasks.value.flatMap((task) => {
    const evaluation = evaluations.value[task.id]
    if (!evaluation) {
      return []
    }

    return [{
      taskId: task.id,
      isPassed: evaluation.isCorrect,
      question: task.question,
      correctAnswer: task.correctAnswer,
      userAnswer: evaluation.userAnswer,
      language: task.targetLanguage ?? task.subject ?? null,
      level: task.level ?? null,
    }]
  }))

  const hasRecoverableSession = computed(() => Boolean(recoverableSession.value))

  const setGenerationError = (message: string) => {
    generationError.value = message
    snackbarStore.showError(message)
  }

  const saveSessionSnapshot = () => {
    if (!import.meta.client) {
      return
    }

    if (persistenceSuspended.value) {
      return
    }

    const isRecoverableInProgress = started.value
      && tasks.value.length > 0
      && currentTaskIndex.value < tasks.value.length

    if (!isRecoverableInProgress) {
      localStorage.removeItem(TASK_SESSION_STORAGE.key)
      return
    }

    const payload: PersistedTaskSession = {
      version: TASK_SESSION_STORAGE.version,
      tasks: tasks.value,
      currentTaskIndex: currentTaskIndex.value,
      evaluations: evaluations.value,
    }

    localStorage.setItem(TASK_SESSION_STORAGE.key, JSON.stringify(payload))
  }

  const initializeRecovery = () => {
    if (!import.meta.client) {
      return
    }

    const rawValue = localStorage.getItem(TASK_SESSION_STORAGE.key)
    if (!rawValue) {
      return
    }

    try {
      const parsed = JSON.parse(rawValue) as PersistedTaskSession
      const hasValidPayload = parsed.version === TASK_SESSION_STORAGE.version
        && Array.isArray(parsed.tasks)
        && parsed.tasks.length > 0
        && typeof parsed.currentTaskIndex === 'number'
        && parsed.currentTaskIndex >= 0
        && parsed.currentTaskIndex < parsed.tasks.length
        && typeof parsed.evaluations === 'object'
        && parsed.evaluations !== null

      if (!hasValidPayload) {
        localStorage.removeItem(TASK_SESSION_STORAGE.key)
        return
      }

      recoverableSession.value = parsed
    }
    catch {
      localStorage.removeItem(TASK_SESSION_STORAGE.key)
    }
  }

  const resumeRecoverableSession = () => {
    const pendingSession = recoverableSession.value
    if (!pendingSession) {
      return false
    }

    tasks.value = pendingSession.tasks
    currentTaskIndex.value = pendingSession.currentTaskIndex
    evaluations.value = pendingSession.evaluations
    started.value = true
    generationError.value = null
    recoverableSession.value = null
    saveSessionSnapshot()
    return true
  }

  const startSession = () => {
    if (!tasks.value.length) {
      return
    }

    started.value = true
    currentTaskIndex.value = 0
    evaluations.value = {}
    generationError.value = null
  }

  const setSessionTasks = (sessionTasks: TaskSessionTask[]) => {
    if (sessionTasks.length === 0) {
      setGenerationError('No tasks loaded')
      return
    }

    tasks.value = sessionTasks
    currentTaskIndex.value = 0
    evaluations.value = {}
    generationError.value = null
  }

  const sessionTasksCount = computed(() => clampTasksPerSession(
    userProfileStore.profile?.tasksPerSession ?? TASKS_PER_SESSION_DEFAULT,
  ))

  const generateTasksWithAi = async (params: GenerateTasksWithAiParams) => {
    const { db, generateTasksJsonWithAi } = useFirebase()
    const requestedTasksCount = clampTasksPerSession(params.tasksCount ?? sessionTasksCount.value)

    if (hasRecoverableSession.value) {
      setGenerationError('Resume your previous game before generating a new one.')
      throw new Error(generationError.value)
    }

    generating.value = true
    generationError.value = null

    try {
      const rawJson = await generateTasksJsonWithAi({
        ...params,
        tasksCount: requestedTasksCount,
      })

      const parsed = parseAiGeneratedTaskList(rawJson, requestedTasksCount)

      const savedTasks = await Promise.all(parsed.tasks.map(async (task) => {
        const docRef = await addDoc(collection(db, FIREBASE_COLLECTIONS.tasks), {
          subject: params.subject,
          targetLanguage: task.targetLanguage,
          topic: params.topic,
          level: task.level,
          type: task.type,
          question: task.question,
          options: task.options,
          correctAnswer: task.correctAnswer,
          hint: task.hint,
          createdAt: serverTimestamp(),
        })

        return {
          id: docRef.id,
          subject: params.subject,
          targetLanguage: task.targetLanguage,
          topic: params.topic,
          level: task.level,
          type: task.type,
          question: task.question,
          options: task.options,
          correctAnswer: task.correctAnswer,
          hint: task.hint,
        } satisfies TaskSessionTask
      }))

      tasks.value = savedTasks
      currentTaskIndex.value = 0
      evaluations.value = {}
      recoverableSession.value = null

      return savedTasks
    }
    catch (caughtError) {
      setGenerationError(caughtError instanceof Error ? caughtError.message : 'Failed to generate tasks')
      throw caughtError
    }
    finally {
      generating.value = false
    }
  }

  const submitCurrentAnswer = (answer: string) => {
    const task = currentTask.value
    if (!task || completed.value) {
      return null
    }

    const existingEvaluation = evaluations.value[task.id]
    if (existingEvaluation) {
      return existingEvaluation
    }

    const isCorrect = normalizeAnswer(answer) === normalizeAnswer(task.correctAnswer)
    const evaluation: TaskEvaluation = {
      userAnswer: answer,
      isCorrect,
    }

    evaluations.value[task.id] = evaluation
    return evaluation
  }

  const goToNextTask = () => {
    if (!started.value || completed.value) {
      return
    }

    currentTaskIndex.value += 1
  }

  const reset = (options?: ResetTaskSessionOptions) => {
    const shouldPreserveRecoverableSession = Boolean(options?.preserveRecoverableSession)

    if (import.meta.client && shouldPreserveRecoverableSession) {
      const isRecoverableInProgress = started.value
        && tasks.value.length > 0
        && currentTaskIndex.value < tasks.value.length

      if (isRecoverableInProgress) {
        const payload: PersistedTaskSession = {
          version: TASK_SESSION_STORAGE.version,
          tasks: tasks.value,
          currentTaskIndex: currentTaskIndex.value,
          evaluations: evaluations.value,
        }

        localStorage.setItem(TASK_SESSION_STORAGE.key, JSON.stringify(payload))
      }
    }

    persistenceSuspended.value = true
    started.value = false
    tasks.value = []
    currentTaskIndex.value = 0
    evaluations.value = {}
    generationError.value = null
    recoverableSession.value = null
    persistenceSuspended.value = false

    if (!shouldPreserveRecoverableSession) {
      saveSessionSnapshot()
    }
  }

  watch(
    [tasks, started, currentTaskIndex, evaluations],
    () => {
      saveSessionSnapshot()
    },
    { deep: true },
  )

  return {
    tasks,
    started,
    generating,
    generationError,
    currentTask,
    totalTasks,
    currentTaskNumber,
    sessionTasksCount,
    completed,
    correctCount,
    incorrectCount,
    currentEvaluation,
    taskResults,
    hasRecoverableSession,
    startSession,
    setSessionTasks,
    generateTasksWithAi,
    initializeRecovery,
    resumeRecoverableSession,
    submitCurrentAnswer,
    goToNextTask,
    reset,
  }
})
