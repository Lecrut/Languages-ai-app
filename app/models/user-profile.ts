import type { LearningLevel } from '../constants/learning-levels'

export interface UserProfile {
  uid: string
  nick: string
  appLanguage: string
  learningLanguage: string
  level: LearningLevel
  tasksPerSession: number
  email: string
  createdAt: string
}

export interface UserProfileUpdatePayload {
  nick: string
  appLanguage: string
  learningLanguage: string
  level: LearningLevel
  tasksPerSession: number
}
