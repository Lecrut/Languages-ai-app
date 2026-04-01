import type { DocumentData, DocumentReference } from 'firebase/firestore'

export const TASK_TYPES = [
  'multiple_choice',
  'arrange_words',
  'fill_blank_select',
  'flashcard',
] as const

export type TaskType = (typeof TASK_TYPES)[number]

export interface TaskDocument {
  reference: DocumentReference<DocumentData>
  subject: string
  topic: string
  type: TaskType
  question: string
  options: string[]
  correctAnswer: string
  hint: string | null
}
