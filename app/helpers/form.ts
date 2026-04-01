import type { ValidationRule } from './rules'

export type FormFieldValidation = {
  value: string
  rules: ValidationRule[]
}

export const getFirstRuleError = (value: string, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    const result = rule(value)

    if (result !== true) {
      return result
    }
  }

  return null
}

export const getFirstFormError = (fields: FormFieldValidation[]): string | null => {
  for (const field of fields) {
    const error = getFirstRuleError(field.value, field.rules)

    if (error) {
      return error
    }
  }

  return null
}

export const hasFormValidationErrors = (fields: FormFieldValidation[]): boolean => {
  return Boolean(getFirstFormError(fields))
}
