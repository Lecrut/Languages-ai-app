export const TASK_TOPICS = [
  { id: 'varied', promptTopic: 'Mixed practical real-life situations' },
  { id: 'grammar', promptTopic: 'Practical grammar in context' },
  { id: 'daily-conversations', promptTopic: 'Daily conversations and small talk' },
  { id: 'work', promptTopic: 'Work and professional communication' },
  { id: 'travel', promptTopic: 'Travel and transportation' },
  { id: 'health', promptTopic: 'Health, symptoms, and doctor visits' },
  { id: 'housing', promptTopic: 'Housing, renting, and home issues' },
  { id: 'office-and-paperwork', promptTopic: 'Office, administration, and paperwork' },
  { id: 'banking-and-finance', promptTopic: 'Banking, payments, and personal finance' },
  { id: 'technology', promptTopic: 'Technology, apps, and online communication' },
  { id: 'education', promptTopic: 'Education, courses, and learning goals' },
  { id: 'social-life', promptTopic: 'Social life, plans, and relationships' },
  { id: 'problem-solving', promptTopic: 'Everyday problems, complaints, and solutions' },
  { id: 'appointments', promptTopic: 'Appointments, schedules, and time management' },
] as const

export type TaskTopicId = (typeof TASK_TOPICS)[number]['id']

export const DEFAULT_TASK_TOPIC: TaskTopicId = 'varied'
