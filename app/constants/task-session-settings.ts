export const TASKS_PER_SESSION_MIN = 10
export const TASKS_PER_SESSION_MAX = 30
export const TASKS_PER_SESSION_DEFAULT = 20

export const clampTasksPerSession = (value: number) => {
  if (value < TASKS_PER_SESSION_MIN) {
    return TASKS_PER_SESSION_MIN
  }

  if (value > TASKS_PER_SESSION_MAX) {
    return TASKS_PER_SESSION_MAX
  }

  return value
}
