import { useRuntimeConfig } from '#imports'
import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { GoogleAIBackend, getAI, getGenerativeModel } from 'firebase/ai'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import {
  AI_MODEL,
  AI_MODEL_FALLBACK_CHAIN,
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

  const isServerError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') {
      return false
    }

    const candidate = error as {
      status?: number
      statusCode?: number
      message?: string
      cause?: {
        status?: number
        statusCode?: number
      }
    }

    const statusValues = [
      candidate.status,
      candidate.statusCode,
      candidate.cause?.status,
      candidate.cause?.statusCode,
    ].filter((value): value is number => typeof value === 'number')

    if (statusValues.some(value => value >= 500 && value <= 599)) {
      return true
    }

    return /\b5\d{2}\b/.test(candidate.message ?? '')
  }

  const generateJsonWithModelFallback = async (params: {
    prompt: string
    systemInstruction: string
    temperature?: number
  }) => {
    let lastError: unknown = null

    for (let index = 0; index < AI_MODEL_FALLBACK_CHAIN.length; index += 1) {
      const modelName = AI_MODEL_FALLBACK_CHAIN[index]
      const model = getGenerativeModel(ai, {
        model: modelName as typeof AI_MODEL_FALLBACK_CHAIN[number],
        systemInstruction: params.systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: params.temperature ?? AI_TASK_GENERATION_TEMPERATURE,
        },
      })

      try {
        const result = await model.generateContent(params.prompt)
        return result.response.text()
      }
      catch (error) {
        lastError = error
        const isLastModel = index === AI_MODEL_FALLBACK_CHAIN.length - 1

        if (!isServerError(error) || isLastModel) {
          throw error
        }

        console.warn(`[AI] Server error for model ${modelName}. Falling back to ${AI_MODEL_FALLBACK_CHAIN[index + 1]}.`)
      }
    }

    throw (lastError ?? new Error('Failed to generate AI content'))
  }

  const getTaskGenerationModel = () => getGenerativeModel(ai, {
    model: AI_MODEL,
    systemInstruction: AI_TASK_SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: AI_TASK_GENERATION_TEMPERATURE,
    },
  })

  const generateTasksJsonWithAi = async (params: AiTaskPromptParams) => {
    const prompt = buildAiTaskUserPrompt(params)

    return await generateJsonWithModelFallback({
      prompt,
      systemInstruction: AI_TASK_SYSTEM_INSTRUCTION,
      temperature: AI_TASK_GENERATION_TEMPERATURE,
    })
  }

  const generateJsonWithAi = async (params: {
    prompt: string
    systemInstruction: string
    temperature?: number
  }) => {
    return await generateJsonWithModelFallback({
      prompt: params.prompt,
      systemInstruction: params.systemInstruction,
      temperature: params.temperature,
    })
  }

  return { app, auth, db, getTaskGenerationModel, generateTasksJsonWithAi, generateJsonWithAi }
}
