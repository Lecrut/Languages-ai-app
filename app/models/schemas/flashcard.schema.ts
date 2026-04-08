import { z } from 'zod'
import type { DocumentData, DocumentReference } from 'firebase/firestore'
import { LEARNING_LEVELS } from '../../constants/learning-levels'

const flashcardReferenceSchema = z.custom<DocumentReference<DocumentData>>(
  value => typeof value === 'object' && value !== null,
  'Flashcard user reference must be a Firebase document reference',
)

export const flashcardSchema = z.object({
  userRef: flashcardReferenceSchema,
  text: z.string().trim().min(1),
  language: z.string().trim().min(1),
  level: z.enum(LEARNING_LEVELS),
  translation: z.string().trim().min(1),
  hint: z.string().trim().nullable(),
  isKnown: z.boolean(),
  knownAt: z.date().nullable(),
  createdAt: z.date().nullable(),
})

export type FlashcardDocument = z.infer<typeof flashcardSchema>
