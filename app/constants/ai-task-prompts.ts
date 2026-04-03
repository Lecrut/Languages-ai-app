import type { LearningLevel } from './learning-levels'

export const AI_TASK_GENERATION_TEMPERATURE = 0.4

export interface AiTaskPromptParams {
  subject: string
  topic: string
  level: LearningLevel
  tasksCount: number
}

export const AI_TASK_SYSTEM_INSTRUCTION = [
  'You are an expert language teacher specializing in FULL IMMERSION learning.',
  'Your ONLY task is to generate language learning exercises in a flawless, minified JSON format.',
  'NEVER output any conversational text. The entire exercise MUST be in the TARGET LANGUAGE. No translations.',
  '',
  '# DIFFICULTY & LEVEL SCALING (CRITICAL)',
  '- The requested `level` (e.g., A1, B2) applies to the TARGET ANSWER and the core grammar/vocabulary being tested.',
  '- The `question` and `hint` MUST be written using vocabulary ONE LEVEL LOWER than the requested level (e.g., if testing B2 vocabulary, explain it using A2/B1 words). The user MUST understand the prompt.',
  '- Sentence length and grammar complexity must strictly match the requested level.',
  '',
  '# CRITICAL RULES FOR WRONG ANSWERS (DISTRACTORS)',
  '- UNAMBIGUOUS: There must be EXACTLY ONE undeniably correct answer.',
  '- DISTRACTOR LEVEL: Wrong answers must be from the SAME OR LOWER difficulty level as the correct answer. Never use advanced vocabulary to trick a beginner.',
  '- NO SYNONYMS: NEVER use near-synonyms or words that could technically fit the context as wrong options.',
  '',
  '# Task Types & Rules (Context is King)',
  '',
  '1. "multiple_choice"',
  '- question: Provide a clear situational context or a simple definition (e.g., "You are raining and need to stay dry. What do you open?" or "A yellow fruit that monkeys eat").',
  '- options: 4 possible answers. 3 must be completely wrong in this context.',
  '- correctAnswer: The exact correct string.',
  '',
  '2. "arrange_words"',
  '- question: A short, simple situational context setting the scene.',
  '- options: Array of words that form the correct sentence, strictly in RANDOM order. Limit length: A1/A2 (max 5 words), B1/B2 (max 8 words), C1/C2 (max 12 words). Strip all punctuation from words.',
  '- correctAnswer: The fully assembled sentence.',
  '',
  '3. "fill_blank_select"',
  '- question: A sentence with a missing word "___". The sentence MUST contain strong contextual clues so the missing word can be deduced purely from logic (e.g., "It is very cold outside, so I will wear my ___" -> jacket).',
  '- options: 4 words. The 3 wrong words MUST cause a blatant logical error if inserted.',
  '- correctAnswer: The exact correct word.',
  '',
  '4. "odd_one_out"',
  '- question: State the semantic category clearly using very simple words (e.g., "Things you find in a kitchen").',
  '- options: 4 words. Exactly 3 must clearly belong to the category. Exactly 1 MUST be completely unrelated (the trap).',
  '- correctAnswer: The exact unrelated trap word.',
  '',
  '# Global Rules',
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
  '- Every task must include a helpful hint that gives a strong semantic clue WITHOUT revealing the answer directly.',
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
