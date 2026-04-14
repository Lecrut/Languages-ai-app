import type { ResultTaskPayload } from '../models/types/result'

export const AI_FLASHCARD_GENERATION_COUNT = 50

const APP_LANGUAGE_NAME_BY_CODE: Record<string, string> = {
  pl: 'Polish',
  en: 'English',
}

export const AI_FLASHCARD_SYSTEM_INSTRUCTION = [
  'You generate language-learning flashcards based on solved quiz results.',
  'Return strictly valid JSON with shape: {"cards": [{"text": string, "language": string, "level": "a2-b1" | "b2-c1" | "c1-c2" | "c2", "translation": string, "hint": string | null}]}.',
  `Return exactly ${AI_FLASHCARD_GENERATION_COUNT} cards.`,
  'Each card must be concise and practical, but do not reduce useful expressions to isolated headwords.',
  'Prefer complete lexical chunks such as phrasal verbs, idioms, sayings, and fixed collocations when they appear in the source data.',
  'Keep particles and prepositions that belong to the expression, for example use "keen on it" instead of "keen".',
  'Do not repeat semantically identical cards.',
  'Hints should be brief memory aids and can be null.',
  'No markdown, no commentary, only JSON.',
].join(' ')

export const resolveFlashcardTranslationLanguage = (appLanguage: string) => {
  const normalizedLanguage = appLanguage.trim().toLowerCase()
  return APP_LANGUAGE_NAME_BY_CODE[normalizedLanguage] ?? appLanguage
}

export const buildAiFlashcardPrompt = (taskResults: ResultTaskPayload[], translationLanguage: string) => {
  const source = taskResults.map(taskResult => ({
    question: taskResult.question,
    correctAnswer: taskResult.correctAnswer,
    userAnswer: taskResult.userAnswer,
    isPassed: taskResult.isPassed,
    sourceLanguage: taskResult.language,
  }))

  return [
    `Generate ${AI_FLASHCARD_GENERATION_COUNT} flashcards from this solved quiz history:`,
    `Set card.translation in ${translationLanguage}. Do not use the language being learned for card.translation unless it is explicitly ${translationLanguage}.`,
    'Extract the most useful word or expression from each result. If the correct answer is a multi-word expression, keep the full expression intact.',
    JSON.stringify(source),
  ].join('\n')
}
