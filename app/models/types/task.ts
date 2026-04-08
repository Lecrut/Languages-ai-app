import type { DocumentData, DocumentReference } from 'firebase/firestore'
import type { LearningLevel } from '../../constants/learning-levels'

export const TASK_TYPES = [
  'multiple_choice',
  'arrange_words',
  'fill_blank_select',
  'odd_one_out',
] as const

export type TaskType = (typeof TASK_TYPES)[number]

export interface TaskDocument {
  reference: DocumentReference<DocumentData>
  subject: string
  targetLanguage: string
  topic: string
  level: LearningLevel
  type: TaskType
  question: string
  options: string[]
  correctAnswer: string
  hint: string | null
}