import { Timestamp } from 'firebase/firestore'
import type { FlashcardDocument } from '../models/schemas/flashcard.schema'

export const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value
  }

  if (value instanceof Timestamp) {
    return value.toDate()
  }

  return null
}

export const toDateTimeLocalValue = (date: Date | null): string => {
  if (!date) {
    return ''
  }

  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const fromDateTimeLocalValue = (value: string): Date | null => {
  if (!value) {
    return null
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

export const cloneFlashcardDocument = (card: FlashcardDocument): FlashcardDocument => ({
  ...card,
  knownAt: card.knownAt ? new Date(card.knownAt) : null,
  createdAt: card.createdAt ? new Date(card.createdAt) : null,
})

export const normalizeFlashcardKey = (card: Pick<FlashcardDocument, 'text' | 'translation' | 'language' | 'level'>): string => {
  const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

  return [
    normalize(card.text),
    normalize(card.translation),
    normalize(card.language),
    card.level,
  ].join('||')
}

export const shuffleItems = <T>(items: T[]): T[] => {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentItem = nextItems[index]!
    const randomItem = nextItems[randomIndex]!
    nextItems[index] = randomItem
    nextItems[randomIndex] = currentItem
  }

  return nextItems
}
