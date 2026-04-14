import { z } from 'zod'
import { AI_FLASHCARD_MAX_REASONABLE_WORDS } from '../../constants/ai-flashcard-prompts'
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

const countWords = (value: string) => value
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .length

const looksLikeSentence = (value: string) => /[.!?;:]/.test(value)

const isReasonableFlashcardText = (value: string) => {
  if (looksLikeSentence(value)) {
    return false
  }

  return countWords(value) <= AI_FLASHCARD_MAX_REASONABLE_WORDS
}

export const parseAiGeneratedFlashcardList = (rawJson: string, expectedCount: number) => {
  const parsedJson = JSON.parse(rawJson)
  const parsed = generatedFlashcardListSchema.parse(parsedJson)
  const filteredCards = parsed.cards.filter(card => isReasonableFlashcardText(card.text))

  if (filteredCards.length < expectedCount) {
    throw new Error(`AI returned ${filteredCards.length} concise flashcards, expected at least ${expectedCount}.`)
  }

  return {
    ...parsed,
    cards: filteredCards.slice(0, expectedCount),
  }
}

export type AiGeneratedFlashcard = z.infer<typeof generatedFlashcardSchema>
