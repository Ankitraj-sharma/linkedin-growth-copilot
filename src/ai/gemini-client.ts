import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'

dotenv.config()

const envApiKey = process.env.GEMINI_API_KEY || ''
const defaultModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export interface GenerateTextOptions {
  model?: string
  temperature?: number
  systemInstruction?: string
  maxOutputTokens?: number
  apiKey?: string
}

/**
 * Generate structured or formatted text using Google Gemini
 */
export async function generateWithGemini(
  prompt: string,
  options?: GenerateTextOptions
): Promise<string> {
  const activeKey = options?.apiKey || envApiKey || process.env.GEMINI_API_KEY || ''
  const modelName = options?.model || defaultModel

  if (!activeKey) {
    throw new Error('GEMINI_API_KEY is missing.')
  }

  try {
    const client = new GoogleGenAI({ apiKey: activeKey })
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
