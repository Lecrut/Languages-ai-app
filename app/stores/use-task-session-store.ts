import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { TASKS_PER_SESSION_DEFAULT, clampTasksPerSession } from '../constants/task-session-settings'
import type { AiTaskPromptParams } from '../constants/ai-task-prompts'
import { FIREBASE_COLLECTIONS } from '../constants/firebase-collections'
import { parseAiGeneratedTaskList } from '../models/ai-generated-task.schema'
import type { TaskDocument } from '../models/task.types'
import type { ResultTaskPayload } from '../models/result'
import { useFirebase } from '../composables/useFirebase'
import { useUserProfileStore } from './use-user-profile-store'

export interface TaskSessionTask extends Omit<TaskDocument, 'reference'> {
  id: string
}

interface TaskEvaluation {
  userAnswer: string
  isCorrect: boolean
}

interface GenerateTasksWithAiParams extends Omit<AiTaskPromptParams, 'tasksCount'> {
  tasksCount?: number
}

const normalizeAnswer = (value: string) => value.trim().toLowerCase()

export const useTaskSessionStore = defineStore('task-session', () => {
  const userProfileStore = useUserProfileStore()
  const tasks = ref<TaskSessionTask[]>([])
  const started = ref(false)
  const currentTaskIndex = ref(0)
  const evaluations = ref<Record<string, TaskEvaluation>>({})
  const generating = ref(false)
  const generationError = ref<string | null>(null)

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
    }]
  }))

  const startSession = () => {
    if (!tasks.value.length) {
      return
    }

    started.value = true
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
          topic: params.topic,
          type: task.type,
          question: task.question,
          options: task.options,
          correctAnswer: task.correctAnswer,
          hint: task.hint,
          targetLanguage: params.subject,
          nativeLanguage: params.nativeLanguage,
          level: params.level,
          createdAt: serverTimestamp(),
        })

        return {
          id: docRef.id,
          subject: params.subject,
          topic: params.topic,
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

      return savedTasks
    }
    catch (caughtError) {
      generationError.value = caughtError instanceof Error ? caughtError.message : 'Failed to generate tasks'
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

  const reset = () => {
    started.value = false
    currentTaskIndex.value = 0
    evaluations.value = {}
    generationError.value = null
  }

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
    startSession,
    generateTasksWithAi,
    submitCurrentAnswer,
    goToNextTask,
    reset,
  }
})
