import { LEARNING_LEVELS, type LearningLevel } from '../constants/learning-levels'

const LEVEL_SET = new Set<string>(LEARNING_LEVELS)

const normalizeRawLevel = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[–—−]/g, '-')
  .replace(/\s+/g, '')

export const normalizeLearningLevel = (value: unknown): LearningLevel | null => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = normalizeRawLevel(value)
  if (LEVEL_SET.has(normalized)) {
    return normalized as LearningLevel
  }

  if (normalized.includes('c2')) {
    return 'c2'
  }

  if (normalized.includes('c1')) {
    return 'c1-c2'
  }

  if (normalized.includes('b2')) {
    return 'b2-c1'
  }

  if (normalized.includes('b1') || normalized.includes('a2') || normalized.includes('a1')) {
    return 'a2-b1'
  }

  return null
}
