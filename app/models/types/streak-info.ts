import type { Timestamp } from 'firebase/firestore'

export interface StreakInfo {
  currentCount: number
  longestCount: number
  actual: {
    from: Date
    to: Date
  }
  longest: {
    from: Date
    to: Date
  }
}

export interface FirestoreStreakInfo {
  currentCount: number
  longestCount: number
  actual: {
    from: Timestamp | Date
    to: Timestamp | Date
  }
  longest: {
    from: Timestamp | Date
    to: Timestamp | Date
  }
}

export interface StreakCompletionResult {
  streakInfo: StreakInfo
  shouldPersist: boolean
}