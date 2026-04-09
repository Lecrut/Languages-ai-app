import { z } from 'zod'
import { TASK_TYPES } from '../types/task'
import { LEARNING_LEVELS } from '../../constants/learning-levels'
import { normalizeLearningLevel } from '../../helpers/normalize-learning-level'

const baseGeneratedTaskSchema = z.object({
  targetLanguage: z.string().trim().min(2),
  topic: z.string().trim().min(1),
  level: z.preprocess(
    normalizeLearningLevel,
    z.enum(LEARNING_LEVELS),
  ),
  question: z.string().trim().min(1),
  correctAnswer: z.string().trim().min(1),
  hint: z.string().trim().min(1),
})

const multipleChoiceGeneratedTaskSchema = baseGeneratedTaskSchema.extend({
  type: z.literal(TASK_TYPES[0]),
  options: z.array(z.string().trim().min(1)).length(4),
})

const arrangeWordsGeneratedTaskSchema = baseGeneratedTaskSchema.extend({
  type: z.literal(TASK_TYPES[1]),
  options: z.array(z.string().trim().min(1)).min(2),
})

const fillBlankSelectGeneratedTaskSchema = baseGeneratedTaskSchema.extend({
  type: z.literal(TASK_TYPES[2]),
  options: z.array(z.string().trim().min(1)).length(4),
})

const oddOneOutGeneratedTaskSchema = baseGeneratedTaskSchema.extend({
  type: z.literal(TASK_TYPES[3]),
  options: z.array(z.string().trim().min(1)).length(4),
})

const generatedTaskSchema = z.discriminatedUnion('type', [
  multipleChoiceGeneratedTaskSchema,
  arrangeWordsGeneratedTaskSchema,
  fillBlankSelectGeneratedTaskSchema,
  oddOneOutGeneratedTaskSchema,
])

export const aiGeneratedTaskListSchema = z.object({
  tasks: z.array(generatedTaskSchema).min(1),
})

export const parseAiGeneratedTaskList = (rawJson: string, expectedCount: number) => {
  const parsedJson = JSON.parse(rawJson)
  const parsed = aiGeneratedTaskListSchema.parse(parsedJson)

  if (parsed.tasks.length !== expectedCount) {
    throw new Error(`AI returned ${parsed.tasks.length} tasks, expected ${expectedCount}.`)
  }

  return parsed
}

export type AiGeneratedTask = z.infer<typeof generatedTaskSchema>