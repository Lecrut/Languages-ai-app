import { useRuntimeConfig } from '#imports'
import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { GoogleAIBackend, getAI, getGenerativeModel } from 'firebase/ai'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import {
  AI_TASK_GENERATION_TEMPERATURE,
  AI_TASK_SYSTEM_INSTRUCTION,
  buildAiTaskUserPrompt,
  type AiTaskPromptParams,
} from '../constants/ai-task-prompts'

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
  const ai = getAI(app, { backend: new GoogleAIBackend() })

  const getTaskGenerationModel = () => getGenerativeModel(ai, {
    model: 'gemini-2.5-flash',
    systemInstruction: AI_TASK_SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: AI_TASK_GENERATION_TEMPERATURE,
    },
  })

  const generateTasksJsonWithAi = async (params: AiTaskPromptParams) => {
    const model = getTaskGenerationModel()
    const prompt = buildAiTaskUserPrompt(params)
    const result = await model.generateContent(prompt)

    return result.response.text()
  }

  return { app, auth, db, getTaskGenerationModel, generateTasksJsonWithAi }
}
