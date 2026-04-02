import type { Timestamp } from 'firebase/firestore'

/**
 * Stored in: users/{userId}/results/{taskId}
 * Represents a single task attempt result for a user
 */
export interface TaskResultDocument {
  isPassed: boolean
  lastAttempt: Timestamp
}

/**
 * Frontend representation of task result
 */
export interface TaskResult {
  taskId: string
  isPassed: boolean
  lastAttempt: Date | null
}

/**
 * Payload for saving a task result
 */
export interface SaveTaskResultPayload {
  isPassed: boolean
  lastAttempt: unknown // serverTimestamp()
}
