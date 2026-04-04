import { Timestamp } from 'firebase/firestore'

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

const toDate = (value: Timestamp | Date | undefined) => {
  if (value instanceof Timestamp) {
    return value.toDate()
  }

  if (value instanceof Date) {
    return new Date(value)
  }

  return new Date()
}

const isSameDay = (left: Date, right: Date) => {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

const isNextDay = (left: Date, right: Date) => {
  const nextDay = new Date(left)
  nextDay.setDate(nextDay.getDate() + 1)
  return isSameDay(nextDay, right)
}

const toUtcDayTimestamp = (date: Date) => {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

const getDayDistance = (from: Date, to: Date) => {
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.floor((toUtcDayTimestamp(to) - toUtcDayTimestamp(from)) / millisecondsPerDay)
}

export const getDisplayCurrentStreakCount = (
  streakInfo: StreakInfo | null,
  referenceDate = new Date(),
) => {
  if (!streakInfo || streakInfo.currentCount <= 0) {
    return 0
  }

  const daysSinceLastCompletion = getDayDistance(streakInfo.actual.to, referenceDate)

  if (daysSinceLastCompletion <= 1) {
    return streakInfo.currentCount
  }

  return 0
}

export const createDefaultStreakInfo = (): StreakInfo => {
  const today = new Date()

  return {
    currentCount: 0,
    longestCount: 0,
    actual: {
      from: new Date(today),
      to: new Date(today),
    },
    longest: {
      from: new Date(today),
      to: new Date(today),
    },
  }
}

export const createDefaultFirestoreStreakInfo = (): FirestoreStreakInfo => {
  const today = new Date()

  return {
    currentCount: 0,
    longestCount: 0,
    actual: {
      from: new Date(today),
      to: new Date(today),
    },
    longest: {
      from: new Date(today),
      to: new Date(today),
    },
  }
}

export const mapFirestoreStreakInfo = (streakInfo: FirestoreStreakInfo): StreakInfo => {
  return {
    currentCount: streakInfo.currentCount,
    longestCount: streakInfo.longestCount,
    actual: {
      from: toDate(streakInfo.actual.from),
      to: toDate(streakInfo.actual.to),
    },
    longest: {
      from: toDate(streakInfo.longest.from),
      to: toDate(streakInfo.longest.to),
    },
  }
}

export const applyStreakCompletion = (
  currentStreakInfo: StreakInfo,
  completedAt = new Date(),
): StreakCompletionResult => {
  const completedDay = new Date(completedAt)

  if (currentStreakInfo.currentCount <= 0) {
    const shouldUpdateLongest = currentStreakInfo.longestCount < 1

    return {
      streakInfo: {
        currentCount: 1,
        longestCount: shouldUpdateLongest ? 1 : currentStreakInfo.longestCount,
        actual: {
          from: completedDay,
          to: completedDay,
        },
        longest: shouldUpdateLongest
          ? {
              from: completedDay,
              to: completedDay,
            }
          : {
              from: new Date(currentStreakInfo.longest.from),
              to: new Date(currentStreakInfo.longest.to),
            },
      },
      shouldPersist: true,
    }
  }

  const actualTo = new Date(currentStreakInfo.actual.to)

  if (isSameDay(actualTo, completedDay)) {
    return {
      streakInfo: currentStreakInfo,
      shouldPersist: false,
    }
  }

  const isStreakContinued = isNextDay(actualTo, completedDay)
  const nextCurrentCount = isStreakContinued
    ? currentStreakInfo.currentCount + 1
    : 1
  const nextActualFrom = isStreakContinued
    ? new Date(currentStreakInfo.actual.from)
    : completedDay
  const nextActual = {
    from: nextActualFrom,
    to: completedDay,
  }

  const shouldUpdateLongest = nextCurrentCount > currentStreakInfo.longestCount
  const nextLongest = shouldUpdateLongest
    ? {
        from: nextActual.from,
        to: nextActual.to,
      }
    : {
        from: new Date(currentStreakInfo.longest.from),
        to: new Date(currentStreakInfo.longest.to),
      }

  return {
    streakInfo: {
      currentCount: nextCurrentCount,
      longestCount: shouldUpdateLongest ? nextCurrentCount : currentStreakInfo.longestCount,
      actual: nextActual,
      longest: nextLongest,
    },
    shouldPersist: true,
  }
}