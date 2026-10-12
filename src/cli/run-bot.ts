import { SessionManager } from '../bot/session-manager'
import { OutreachRunner } from '../bot/outreach-runner'

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.some((arg) => arg.includes('dry-run'))
  const isHeadless = !args.some((arg) => arg.includes('headful'))

  console.log('================================================================')
  console.log('🚀 [LinkedIn Growth Copilot] Controlled Automation Bot')
  console.log(`🛡️ Mode: ${isDryRun ? 'DRY-RUN (SIMULATION)' : 'LIVE SAFE MODE'}`)
  console.log(`🖥️ Headless: ${isHeadless ? 'YES' : 'NO (Visible Browser)'}`)
  console.log('================================================================\n')

  let session: any = null

  try {
    console.log('🌐 Launching stealth browser...')
    session = await SessionManager.launchStealthBrowser(isHeadless)

    console.log('🚀 Running controlled outreach batch...')
    const result = await OutreachRunner.runOutreachBatch(session.page, {
      dryRun: isDryRun,
      maxLeadsPerBatch: 5,
    })

    console.log('\n================================================================')
    console.log('🏁 Batch Summary:')
    console.log(`- Processed: ${result.processed}`)
    console.log(`- Successful: ${result.successful}`)
    if (result.stoppedEarlyReason) {
      console.log(`- Stopped Early: ${result.stoppedEarlyReason}`)
    }
    console.log('================================================================\n')

    // Persist cookies and state
    await SessionManager.persistSession(session.context)
  } catch (error: any) {
    console.error('❌ [Fatal Bot Error]:', error.message || error)
  } finally {
    if (session?.browser) {
      console.log('🛑 Closing browser gracefully.')
      await session.browser.close()
    }
    process.exit(0)
  }
}

main().catch(console.error)
