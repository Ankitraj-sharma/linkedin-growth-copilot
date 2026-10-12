import { NextResponse } from 'next/server'
import { generateConnectionNote, generateFollowUpMessage } from '@/ai/outreach-prompts'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lead, user, goal } = body

    const defaultUser = user || {
      fullName: 'Ankit Raj Sharma',
      currentRole: 'Full Stack Engineer',
      skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'System Design'],
      targetRole: 'Senior Full Stack Engineer / SDE-2',
    }

    const note = await generateConnectionNote(lead, defaultUser, goal || 'referral')
    const followup = await generateFollowUpMessage(lead, defaultUser, goal || 'referral')

    return NextResponse.json({ success: true, note, followup })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate note' },
      { status: 500 }
    )
  }
}
