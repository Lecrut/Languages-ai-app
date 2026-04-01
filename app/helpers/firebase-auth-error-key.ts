import type { FirebaseError } from 'firebase/app'

const authErrorToTranslationKey: Record<string, string> = {
  'auth/invalid-credential': 'errors.auth.invalidCredential',
  'auth/invalid-login-credentials': 'errors.auth.invalidCredential',
  'auth/wrong-password': 'errors.auth.wrongPassword',
  'auth/user-not-found': 'errors.auth.userNotFound',
  'auth/email-already-in-use': 'errors.auth.emailAlreadyInUse',
  'auth/invalid-email': 'errors.auth.invalidEmail',
  'auth/weak-password': 'errors.auth.weakPassword',
  'auth/too-many-requests': 'errors.auth.tooManyRequests',
  'auth/network-request-failed': 'errors.auth.networkRequestFailed',
  'auth/expired-action-code': 'errors.auth.expiredActionCode',
  'auth/invalid-action-code': 'errors.auth.invalidActionCode',
  'auth/user-disabled': 'errors.auth.userDisabled',
}

export const getFirebaseAuthErrorKey = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseCode = (error as FirebaseError).code

    if (firebaseCode in authErrorToTranslationKey) {
      return authErrorToTranslationKey[firebaseCode] ?? 'errors.auth.generic'
    }
  }

  return 'errors.auth.generic'
}
