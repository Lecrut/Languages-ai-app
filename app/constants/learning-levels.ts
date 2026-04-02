export const LEARNING_LEVELS = [
  'a2-b1',
  'b2-c1',
  'c1-c2',
  'c2',
] as const

export type LearningLevel = (typeof LEARNING_LEVELS)[number]

export const DEFAULT_LEARNING_LEVEL: LearningLevel = 'a2-b1'
