import { z } from 'zod'
import { TASK_TYPES } from './task.types'

const baseGeneratedTaskSchema = z.object({
  question: z.string().trim().min(1),
  correctAnswer: z.string().trim().min(1),
  hint: z.string().trim().nullable(),
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

const flashcardGeneratedTaskSchema = baseGeneratedTaskSchema.extend({
  type: z.literal(TASK_TYPES[3]),
  options: z.array(z.string().trim().min(1)).length(0),
})

const generatedTaskSchema = z.discriminatedUnion('type', [
  multipleChoiceGeneratedTaskSchema,
  arrangeWordsGeneratedTaskSchema,
  fillBlankSelectGeneratedTaskSchema,
  flashcardGeneratedTaskSchema,
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
