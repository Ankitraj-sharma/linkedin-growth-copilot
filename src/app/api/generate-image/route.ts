import { NextResponse } from 'next/server'
import { generateTopicImage } from '@/ai/image-generator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { topic, content, style, apiKey } = body

    if (!topic || !topic.trim()) {
      return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 })
    }

    const imageResult = await generateTopicImage(
      topic,
      content,
      style || 'cinematic_photo',
      apiKey
    )

    return NextResponse.json({
      success: true,
      ...imageResult,
    })
  } catch (err: any) {
    console.error('❌ [Generate Image API Error]:', err.message || err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}
