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
    const candidateModels = [modelName, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
    const uniqueModels = Array.from(new Set(candidateModels))

    let lastError: any = null
    for (const m of uniqueModels) {
      try {
        const response = await client.models.generateContent({
          model: m,
          contents: prompt,
          config: {
            temperature: options?.temperature ?? 0.75,
            systemInstruction: options?.systemInstruction,
            maxOutputTokens: options?.maxOutputTokens ?? 1500,
          },
        })

        const text = response.text || ''
        if (text) return text.trim()
      } catch (err: any) {
        lastError = err
        console.warn(`⚠️ [Gemini Model ${m} fallback]:`, err.message || err)
      }
    }

    throw lastError || new Error('Failed to generate content with Gemini models.')
  } catch (error: any) {
    console.error('❌ [Gemini Error]:', error.message || error)
    throw error
  }
}
