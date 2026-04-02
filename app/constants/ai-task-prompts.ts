import type { LearningLevel } from './learning-levels'

export const AI_TASK_GENERATION_TEMPERATURE = 0.4

export interface AiTaskPromptParams {
  subject: string
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
  '- question: A short, simple prompt in the TARGET language.',
  '- options: Array of 4 possible answers in the TARGET language.',
  '- correctAnswer: The exact correct string from the options array.',
  '',
  '2. "arrange_words"',
  '- question: A short instruction or sentence in the TARGET language.',
  '- options: Array of words in the TARGET language that form the correct sentence, but strictly in RANDOM, shuffled order.',
  '- correctAnswer: The fully assembled, grammatically correct sentence in the TARGET language.',
  '',
  '3. "fill_blank_select"',
  '- question: A sentence in the TARGET language with a missing word represented by "___" (three underscores).',
  '- options: Array of 4 possible words in the TARGET language to fill the blank.',
  '- correctAnswer: The exact correct word from the options array.',
  '',
  '4. "odd_one_out"',
  '- question: A category or semantic clue in the TARGET language (for example: "Fruits" or "Words related to happiness").',
  '- options: Array of 4 words in the TARGET language. Exactly 3 must match the category/meaning, and exactly 1 must be unrelated (the trap).',
  '- correctAnswer: The exact unrelated trap word from the options array.',
  '',
  '# Global Rules',
  '- All question, option, and hint text must be in the TARGET language only.',
  '- Use simple, clear wording suitable for learners at the requested level.',
  '- Target language strings must be natural, modern, and grammatically correct.',
  '- The JSON must strictly match this exact TypeScript interface:',
  '{',
  '  "tasks": [',
  '    {',
  '      "targetLanguage": "string",',
  '      "topic": "string",',
  '      "level": "string",',
  '      "type": "multiple_choice" | "arrange_words" | "fill_blank_select" | "odd_one_out",',
  '      "question": "string",',
  '      "options": ["string"],',
  '      "correctAnswer": "string",',
  '      "hint": "string"',
  '    }',
  '  ]',
  '}',
  '',
  '- Every task must copy the same targetLanguage, topic, and level values from the prompt.',
  '- Every task must include a non-empty hint string in the TARGET language.',
  '- Every hint must help solve the task but must not reveal the full correctAnswer.',
].join('\n')

export const buildAiTaskUserPrompt = ({
  subject,
  topic,
  level,
  tasksCount,
}: AiTaskPromptParams) => [
  `Generate exactly ${tasksCount} tasks.`,
  `- TARGET language: ${subject}`,
  `- Topic: "${topic}"`,
  `- Difficulty level: ${level}`,
  '- Include targetLanguage, topic, and level in every task object using exactly these values.',
  '- Include a non-empty hint in every task, written in the target language.',
  '',
  'Ensure there is an even mix of all 4 task types. Return ONLY the JSON object.',
].join('\n')
