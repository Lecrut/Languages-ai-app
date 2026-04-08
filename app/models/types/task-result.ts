import type { Timestamp } from 'firebase/firestore'

export interface TaskResultDocument {
  isPassed: boolean
  lastAttempt: Timestamp
}

export interface TaskResult {
  taskId: string
  isPassed: boolean
  lastAttempt: Date | null
}

export interface SaveTaskResultPayload {
  isPassed: boolean
  lastAttempt: unknown
}