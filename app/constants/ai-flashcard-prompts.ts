import type { ResultTaskPayload } from '../models/types/result'

export const AI_FLASHCARD_GENERATION_COUNT = 50

export const AI_FLASHCARD_SYSTEM_INSTRUCTION = [
  'You generate language-learning flashcards based on solved quiz results.',
  'Return strictly valid JSON with shape: {"cards": [{"text": string, "language": string, "level": "a2-b1" | "b2-c1" | "c1-c2" | "c2", "translation": string, "hint": string | null}]}.',
  `Return exactly ${AI_FLASHCARD_GENERATION_COUNT} cards.`,
  'Each card must be concise and practical (single words or short phrases).',
  'Do not repeat semantically identical cards.',
  'Hints should be brief memory aids and can be null.',
  'No markdown, no commentary, only JSON.',
].join(' ')

export const buildAiFlashcardPrompt = (taskResults: ResultTaskPayload[]) => {
  const source = taskResults.map(taskResult => ({
    question: taskResult.question,
    correctAnswer: taskResult.correctAnswer,
    userAnswer: taskResult.userAnswer,
    isPassed: taskResult.isPassed,
  }))

  return [
    `Generate ${AI_FLASHCARD_GENERATION_COUNT} flashcards from this solved quiz history:`,
    JSON.stringify(source),
  ].join('\n')
}
