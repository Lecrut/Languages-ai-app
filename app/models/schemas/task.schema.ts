import { z } from 'zod'
import type { DocumentData, DocumentReference } from 'firebase/firestore'
import { LEARNING_LEVELS } from '../../constants/learning-levels'
import { TASK_TYPES } from '../types/task'

const referenceSchema = z.custom<DocumentReference<DocumentData>>(
  value => typeof value === 'object' && value !== null,
  'Task reference must be a Firebase document reference',
)

const baseTaskSchema = z.object({
  reference: referenceSchema,
  subject: z.string().trim().min(2),
  targetLanguage: z.string().trim().min(2),
  topic: z.string().trim().min(1),
  level: z.enum(LEARNING_LEVELS),
  question: z.string().trim().min(1),
  correctAnswer: z.string().trim().min(1),
  hint: z.string().trim().nullable(),
})

const multipleChoiceTaskSchema = baseTaskSchema.extend({
  type: z.literal(TASK_TYPES[0]),
  options: z.array(z.string().trim().min(1)).min(3).max(4),
})

const arrangeWordsTaskSchema = baseTaskSchema.extend({
  type: z.literal(TASK_TYPES[1]),
  options: z.array(z.string().trim().min(1)).min(2),
})

const fillBlankSelectTaskSchema = baseTaskSchema.extend({
  type: z.literal(TASK_TYPES[2]),
  options: z.array(z.string().trim().min(1)).min(3).max(4),
})

const oddOneOutTaskSchema = baseTaskSchema.extend({
  type: z.literal(TASK_TYPES[3]),
  options: z.array(z.string().trim().min(1)).length(4),
})

export const taskSchema = z.discriminatedUnion('type', [
  multipleChoiceTaskSchema,
  arrangeWordsTaskSchema,
  fillBlankSelectTaskSchema,
  oddOneOutTaskSchema,
])

export const taskListSchema = z.array(taskSchema)

export type TaskSchema = z.infer<typeof taskSchema>