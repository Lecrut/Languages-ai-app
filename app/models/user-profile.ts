export interface UserProfile {
  uid: string
  nick: string
  appLanguage: string
  learningLanguage: string
  tasksPerSession: number
  email: string
  createdAt: string
}

export interface UserProfileUpdatePayload {
  nick: string
  appLanguage: string
  learningLanguage: string
  tasksPerSession: number
}
