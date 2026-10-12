import { NextResponse } from 'next/server'
import { SessionManager } from '@/bot/session-manager'
import { OutreachRunner } from '@/bot/outreach-runner'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const isDryRun = body.dryRun ?? true
    const batchLimit = body.batchLimit ?? 2

    // Launch headless stealth browser
    const session = await SessionManager.launchStealthBrowser(true)

    try {
      const result = await OutreachRunner.runOutreachBatch(session.page, {
        dryRun: isDryRun,
        maxLeadsPerBatch: batchLimit,
      })

      await SessionManager.persistSession(session.context)

      return NextResponse.json({
        success: true,
        dryRun: isDryRun,
        processed: result.processed,
        successful: result.successful,
        message: result.stoppedEarlyReason
          ? `Bot stopped safely: ${result.stoppedEarlyReason}`
          : `Batch executed safely! (${result.successful} invitations processed with jitter delays)`,
      })
    } finally {
      await session.browser.close()
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error occurred while running outreach bot',
      },
      { status: 500 }
    )
  }
}
