export const formatDateTime = (date: Date | null, locale: string) => {
  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
