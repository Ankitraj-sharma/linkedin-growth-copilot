import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'

dotenv.config()

const apiKey = process.env.GEMINI_API_KEY || ''
const defaultModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

let aiClient: GoogleGenAI | null = null

export function getGeminiClient(): GoogleGenAI {
  if (aiClient) return aiClient

  if (!apiKey) {
    console.warn('⚠️ [Gemini AI] GEMINI_API_KEY is not defined in .env. Falling back to mock templates if needed.')
  }

  aiClient = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-initialization' })
  return aiClient
}

export interface GenerateTextOptions {
  model?: string
  temperature?: number
  systemInstruction?: string
  maxOutputTokens?: number
}

/**
 * Generate structured or formatted text using Google Gemini
 */
export async function generateWithGemini(
  prompt: string,
  options?: GenerateTextOptions
): Promise<string> {
  const client = getGeminiClient()
  const modelName = options?.model || defaultModel

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please set it in your .env file.')
  }

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: options?.temperature ?? 0.7,
        systemInstruction: options?.systemInstruction,
        maxOutputTokens: options?.maxOutputTokens ?? 1024,
      },
    })

    const text = response.text || ''
    return text.trim()
  } catch (error: any) {
    console.error('❌ [Gemini Error]:', error.message || error)
    throw error
  }
}
