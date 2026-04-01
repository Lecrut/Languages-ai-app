import type { DocumentData, DocumentReference } from 'firebase/firestore'

export interface ResultTaskEntry {
  taskReference: DocumentReference<DocumentData>
  isPassed: boolean
  question: string
  correctAnswer: string
  userAnswer: string
}

export interface ResultDocument {
  userReference: DocumentReference<DocumentData>
  date: unknown
  task: ResultTaskEntry[]
}

export interface ResultTaskPayload {
  taskId: string
  isPassed: boolean
  question: string
  correctAnswer: string
  userAnswer: string
}

export interface ResultSessionTaskItem {
  id: string
  isPassed: boolean
  question: string
  correctAnswer: string
  userAnswer: string
}

export interface ResultSessionItem {
  id: string
  date: Date | null
  correctCount: number
  incorrectCount: number
  totalTasks: number
  tasks: ResultSessionTaskItem[]
}
