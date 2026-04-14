import type { ResultTaskPayload } from '../models/types/result'

export const AI_FLASHCARD_GENERATION_COUNT = 50
export const AI_FLASHCARD_MAX_REASONABLE_WORDS = 6

const APP_LANGUAGE_NAME_BY_CODE: Record<string, string> = {
  pl: 'Polish',
  en: 'English',
}

export const AI_FLASHCARD_SYSTEM_INSTRUCTION = [
  'You generate language-learning flashcards based on solved quiz results.',
  'Return strictly valid JSON with shape: {"cards": [{"text": string, "language": string, "level": "a2-b1" | "b2-c1" | "c1-c2" | "c2", "translation": string, "hint": string | null}]}.',
  `Return exactly ${AI_FLASHCARD_GENERATION_COUNT} cards.`,
  'card.text should be a concise vocabulary item: either one difficult single word or a short lexical chunk.',
  'Prioritize idioms, phrasal verbs, collocations, and preposition chunks when useful.',
  'Do not return full example sentences or long clauses.',
  `Keep card.text compact (typically 1-${AI_FLASHCARD_MAX_REASONABLE_WORDS} words).`,
  'Aim for a balanced mix across the set: around 40% difficult single words and 60% multi-word chunks.',
  'Good examples: "meticulous", "ubiquitous", "focus on", "keen on", "look forward to", "by and large".',
  'Keep particles and prepositions that belong to the expression; do not strip them.',
  'Avoid punctuation in card.text except apostrophe or hyphen when needed.',
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
    'Extract one useful vocabulary item per card: either a difficult single word or a short lexical chunk.',
    'Prefer practical learning units over full examples. Good: "meticulous", "focus on", "look forward to", "by and large". Bad: "I am looking forward to the weekend".',
    JSON.stringify(source),
  ].join('\n')
}
