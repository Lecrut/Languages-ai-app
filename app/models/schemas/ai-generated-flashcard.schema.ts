import { z } from 'zod'
import { LEARNING_LEVELS } from '../../constants/learning-levels'

const generatedFlashcardSchema = z.object({
  text: z.string().trim().min(1),
  language: z.string().trim().min(1),
  level: z.enum(LEARNING_LEVELS),
  translation: z.string().trim().min(1),
  hint: z.string().trim().min(1).nullable(),
})

const generatedFlashcardListSchema = z.object({
  cards: z.array(generatedFlashcardSchema).min(1),
})

export const parseAiGeneratedFlashcardList = (rawJson: string, expectedCount: number) => {
  const parsedJson = JSON.parse(rawJson)
  const parsed = generatedFlashcardListSchema.parse(parsedJson)

  if (parsed.cards.length !== expectedCount) {
    throw new Error(`AI returned ${parsed.cards.length} flashcards, expected ${expectedCount}.`)
  }

  return parsed
}

export type AiGeneratedFlashcard = z.infer<typeof generatedFlashcardSchema>
