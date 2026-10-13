import { NextResponse } from 'next/server'
import { SessionManager } from '@/bot/session-manager'
import { OutreachRunner } from '@/bot/outreach-runner'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const isDryRun = body.dryRun ?? true
    const batchLimit = body.batchLimit ?? 2
    const forceRun = body.forceRun ?? false
    const customLeads = body.leads || []
    const startHour = body.startHour
    const endHour = body.endHour

    // Check if running on Vercel or cloud serverless container
    const isServerlessCloud = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

    if (isServerlessCloud) {
      return NextResponse.json({
        success: true,
        mode: 'cloud',
        processed: 0,
        successful: 0,
        message:
          'Cloud Mode: Vercel serverless functions do not bundle desktop Chromium to avoid IP blocking and size limits. Use the 1-Click Send Assistant on each lead, or launch the local Windows worker (run-bot.bat) for automated hands-free outreach!',
        leads: customLeads,
      })
    }

    // Launch headless stealth browser in local/worker environment
    const session = await SessionManager.launchStealthBrowser(true)

    try {
      const result = await OutreachRunner.runOutreachBatch(session.page, {
        dryRun: isDryRun,
        maxLeadsPerBatch: batchLimit,
        forceRun,
        leads: customLeads,
        startHour,
        endHour,
      })

      await SessionManager.persistSession(session.context)

      return NextResponse.json({
        success: true,
        mode: 'local',
        dryRun: isDryRun,
        processed: result.processed,
        successful: result.successful,
        stoppedEarlyReason: result.stoppedEarlyReason,
        message: result.stoppedEarlyReason
          ? `Bot notice: ${result.stoppedEarlyReason}`
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
