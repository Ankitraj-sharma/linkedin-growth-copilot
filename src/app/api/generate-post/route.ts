import { NextResponse } from 'next/server'
import { generateViralPost } from '@/ai/content-creator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { topic, framework, tone } = body

    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 })
    }

    const post = await generateViralPost({
      topic,
      framework,
      tone,
    })

    return NextResponse.json({ success: true, ...post })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate post' },
      { status: 500 }
    )
  }
}
