export const getDefaultNicknameFromEmail = (email: string | null): string => {
  if (!email) {
    return 'user'
  }

  return email.split('@')[0] || 'user'
}
