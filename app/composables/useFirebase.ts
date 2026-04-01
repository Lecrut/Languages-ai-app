import { useRuntimeConfig } from '#imports'
import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export const useFirebase = () => {
  const config = useRuntimeConfig()

  const firebaseConfig: FirebaseOptions = {
    apiKey: config.public.apiKey,
    authDomain: config.public.authDomain,
    projectId: config.public.projectId,
    storageBucket: config.public.storageBucket,
    messagingSenderId: config.public.messagingSenderId,
    appId: config.public.appId,
    measurementId: config.public.measurementId,
  }

  const app = getApps()[0] ?? initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  return { auth, db }
}
