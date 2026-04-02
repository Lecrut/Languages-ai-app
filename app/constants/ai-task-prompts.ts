import type { LearningLevel } from './learning-levels'

export const AI_TASK_GENERATION_TEMPERATURE = 0.4

export interface AiTaskPromptParams {
  subject: string
  nativeLanguage: string
  topic: string
  level: LearningLevel
  tasksCount: number
}

export const AI_TASK_SYSTEM_INSTRUCTION = [
  'You are an expert language teacher and a strict JSON data generator.',
  'Your ONLY task is to generate language learning exercises in a flawless, minified JSON format.',
  'NEVER output any conversational text, markdown formatting, or explanations outside the JSON object.',
  '',
  '# Task Types & Rules',
  'You must generate an array of tasks. Each task must randomly be one of the following 4 types. Strictly follow how question, options, and correctAnswer are formatted for each type:',
  '',
  '1. "multiple_choice"',
  '- question: A sentence/word in the user\'s NATIVE language.',
  '- options: Array of 4 possible translations in the TARGET language.',
  '- correctAnswer: The exact correct string from the options array.',
  '',
  '2. "arrange_words"',
  '- question: A sentence in the user\'s NATIVE language.',
  '- options: Array of words in the TARGET language that make up the translation, but strictly in RANDOM, shuffled order.',
  '- correctAnswer: The fully assembled, grammatically correct sentence in the TARGET language.',
  '',
  '3. "fill_blank_select"',
  '- question: A sentence in the TARGET language with a missing word represented by "___" (three underscores). Includes the NATIVE translation in parentheses.',
  '- options: Array of 4 possible words in the TARGET language to fill the blank.',
  '- correctAnswer: The exact correct word from the options array.',
  '',
  '4. "odd_one_out"',
  '- question: A category or translation in the user\'s NATIVE language (for example: "Fruits" or "Words meaning happiness").',
  '- options: Array of 4 words in the TARGET language. Exactly 3 must match the category/meaning, and exactly 1 must be unrelated (the trap).',
  '- correctAnswer: The exact unrelated trap word from the options array.',
  '',
  '# Global Rules',
  '- Target language strings must be natural, modern, and grammatically perfect.',
  '- The JSON must strictly match this exact TypeScript interface:',
  '{',
  '  "tasks": [',
  '    {',
  '      "type": "multiple_choice" | "arrange_words" | "fill_blank_select" | "odd_one_out",',
  '      "question": "string",',
  '      "options": ["string"],',
  '      "correctAnswer": "string",',
  '      "hint": "string or null"',
  '    }',
  '  ]',
  '}',
].join('\n')

export const buildAiTaskUserPrompt = ({
  subject,
  nativeLanguage,
  topic,
  level,
  tasksCount,
}: AiTaskPromptParams) => [
  `Generate exactly ${tasksCount} tasks.`,
  `- TARGET language: ${subject}`,
  `- NATIVE language: ${nativeLanguage}`,
  `- Topic: "${topic}"`,
  `- Difficulty level: ${level}`,
  '',
  'Ensure there is an even mix of all 4 task types. Return ONLY the JSON object.',
].join('\n')
