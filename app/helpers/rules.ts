export type ValidationRule = (value: string) => true | string

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const requiredRule = (message: string): ValidationRule => {
  return value => (value && value.trim().length > 0 ? true : message)
}

export const emailRule = (message: string): ValidationRule => {
  return value => (!value || emailPattern.test(value) ? true : message)
}

export const minLengthRule = (length: number, message: string): ValidationRule => {
  return value => (value.length >= length ? true : message)
}

export const sameAsRule = (targetValue: () => string, message: string): ValidationRule => {
  return value => (value === targetValue() ? true : message)
}
