import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { TASK_TYPES, type TaskDocument } from '../models/task.types'
import type { ResultTaskPayload } from '../models/result'

export interface TaskSessionTask extends Omit<TaskDocument, 'reference'> {
  id: string
}

interface TaskEvaluation {
  userAnswer: string
  isCorrect: boolean
}

const normalizeAnswer = (value: string) => value.trim().toLowerCase()

const mockTasks: TaskSessionTask[] = [
  {
    id: 'task-1',
    subject: 'Grammar',
    topic: 'Present Simple',
    type: TASK_TYPES[0],
    question: 'Choose the correct sentence:',
    options: ['She go to school every day.', 'She goes to school every day.', 'She going to school every day.', 'She gone to school every day.'],
    correctAnswer: 'She goes to school every day.',
    hint: 'Remember third person singular with he/she/it.',
  },
  {
    id: 'task-2',
    subject: 'Vocabulary',
    topic: 'Travel',
    type: TASK_TYPES[2],
    question: 'I need to _____ a ticket online before the trip.',
    options: ['book', 'cook', 'look', 'took'],
    correctAnswer: 'book',
    hint: 'It means reserving something in advance.',
  },
  {
    id: 'task-3',
    subject: 'Sentence building',
    topic: 'Daily routine',
    type: TASK_TYPES[1],
    question: 'Arrange the words into a correct sentence.',
    options: ['always', 'I', 'coffee', 'drink', 'in the morning'],
    correctAnswer: 'I always drink coffee in the morning',
    hint: 'Start with the subject and place the adverb before the verb.',
  },
  {
    id: 'task-4',
    subject: 'Flashcard',
    topic: 'Synonyms',
    type: TASK_TYPES[3],
    question: 'Select a synonym of "happy".',
    options: ['joyful', 'angry', 'silent', 'rough'],
    correctAnswer: 'joyful',
    hint: null,
  },
]

export const useTaskSessionStore = defineStore('task-session', () => {
  const tasks = ref<TaskSessionTask[]>(mockTasks)
  const started = ref(false)
  const currentTaskIndex = ref(0)
  const evaluations = ref<Record<string, TaskEvaluation>>({})

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
    started.value = true
    currentTaskIndex.value = 0
    evaluations.value = {}
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
  }

  return {
    tasks,
    started,
    currentTask,
    totalTasks,
    currentTaskNumber,
    completed,
    correctCount,
    incorrectCount,
    currentEvaluation,
    taskResults,
    startSession,
    submitCurrentAnswer,
    goToNextTask,
    reset,
  }
})
