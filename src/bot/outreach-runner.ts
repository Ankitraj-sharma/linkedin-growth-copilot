import { Page } from 'playwright'
import { getSupabaseClient } from '../supabase/supabase-client'
import { Lead } from '../supabase/types'
import { DEFAULT_SAFETY_CONFIG } from '../config/safety-rules'
import {
  simulateHumanTyping,
  simulateHumanScroll,
  simulateRandomCursorMovement,
  randomJitterDelay,
  sleep,
  randomBetween,
} from './human-simulator'
import { SafetyGuard } from './safety-guard'

export interface OutreachRunOptions {
  dryRun?: boolean
  maxLeadsPerBatch?: number
}

export class OutreachRunner {
  /**
   * Executes a safe, human-mimicked outreach run on approved/queued leads
   */
  static async runOutreachBatch(page: Page, options: OutreachRunOptions = {}): Promise<{
    processed: number
    successful: number
    stoppedEarlyReason?: string
  }> {
    const supabase = getSupabaseClient()
    const isDryRun = options.dryRun ?? false
    const batchLimit = options.maxLeadsPerBatch || 5

    console.log(`\n================================================================`)
    console.log(`🤖 [Outreach Runner] Starting batch (${isDryRun ? 'DRY-RUN SIMULATION' : 'LIVE SAFE MODE'})`)
    console.log(`================================================================\n`)

    // 1. Working hours check
    const hoursCheck = SafetyGuard.isWithinWorkingHours()
    if (!hoursCheck.allowed) {
      console.warn(`🛑 [Safety Halt] ${hoursCheck.reason}`)
      return { processed: 0, successful: 0, stoppedEarlyReason: hoursCheck.reason }
    }

    // 2. Daily quota check
    const quotaCheck = await SafetyGuard.checkDailyQuota()
    if (!quotaCheck.allowed) {
      console.warn(`🛑 [Safety Halt] ${quotaCheck.reason}`)
      return { processed: 0, successful: 0, stoppedEarlyReason: quotaCheck.reason }
    }

    // 3. Fetch queued leads with pre-generated AI notes
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .in('status', ['approved', 'queued'])
      .order('created_at', { ascending: true })
      .limit(batchLimit)

    if (error || !leads || leads.length === 0) {
      console.log('ℹ️ [Outreach Runner] No leads currently approved or queued for outreach.')
      return { processed: 0, successful: 0 }
    }

    console.log(`📋 [Outreach Runner] Found ${leads.length} leads queued for connection.`)
    let processed = 0
    let successful = 0

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i] as Lead
      console.log(`\n----------------------------------------------------------------`)
      console.log(`🎯 Processing Lead [${i + 1}/${leads.length}]: ${lead.full_name}`)
      console.log(`🔗 URL: ${lead.profile_url}`)
      console.log(`----------------------------------------------------------------`)

      // Check quota again before each action
      const midQuota = await SafetyGuard.checkDailyQuota()
      if (!midQuota.allowed) {
        console.warn(`🛑 [Safety Halt] Daily quota exhausted mid-batch: ${midQuota.reason}`)
        return { processed, successful, stoppedEarlyReason: midQuota.reason }
      }

      try {
        // Step A: Navigate to Profile
        console.log(`🌐 Navigating to profile...`)
        await page.goto(lead.profile_url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await sleep(randomBetween(2500, 5000))

        // Step B: Check for security challenges
        if (await SafetyGuard.scanForSecurityChallenges(page)) {
          throw new Error('Security challenge or CAPTCHA detected. Aborting session.')
        }

        // Step C: Natural human viewing & scrolling (10 - 20 seconds)
        console.log(`👀 Simulating natural profile reading & scrolling...`)
        await simulateHumanScroll(page)
        await simulateRandomCursorMovement(page)
        await sleep(randomBetween(3000, 7000))

        // Step D: Find "Connect" or "More -> Connect" button
        console.log(`🔍 Looking for Connect button...`)
        let connectButton = await page.$('button:has-text("Connect")')

        if (!connectButton) {
          // Check "More" action dropdown if direct Connect is hidden
          const moreButton = await page.$('button[aria-label="More actions"], button:has-text("More")')
          if (moreButton) {
            console.log(`🔘 Clicking "More" options dropdown...`)
            await moreButton.click()
            await sleep(randomBetween(800, 1500))
            connectButton = await page.$('div[role="button"]:has-text("Connect"), span:has-text("Connect")')
          }
        }

        if (!connectButton) {
          console.warn(`⚠️ [Skip] Could not locate Connect button for ${lead.full_name} (Already connected or Pending).`)
          await supabase.from('leads').update({ status: 'rejected', notes: 'No connect button found or already connected' }).eq('id', lead.id)
          continue
        }

        if (!isDryRun) {
          await connectButton.click()
          await sleep(randomBetween(1200, 2500))

          // Step E: Click "Add a note"
          const addNoteBtn = await page.$('button:has-text("Add a note")')
          if (addNoteBtn && lead.generated_note) {
            console.log(`✍️ Adding personalized AI connection note...`)
            await addNoteBtn.click()
            await sleep(randomBetween(800, 1500))

            // Step F: Human keystroke simulation
            const textareaSelector = 'textarea[name="message"], #custom-message'
            await simulateHumanTyping(
              page,
              textareaSelector,
              lead.generated_note,
              DEFAULT_SAFETY_CONFIG.typingSpeedMinMs,
              DEFAULT_SAFETY_CONFIG.typingSpeedMaxMs
            )

            // Review pause
            console.log(`🧐 Human-like pause to review typed note...`)
            await sleep(randomBetween(2000, 4000))

            // Step G: Send invite
            const sendBtn = await page.$('button:has-text("Send")')
            if (sendBtn) {
              await sendBtn.click()
              console.log(`🚀 Connection invite sent to ${lead.full_name}!`)
            }
          } else {
            // Direct send without note if none exists
            const sendDirectBtn = await page.$('button:has-text("Send without a note"), button:has-text("Send")')
            if (sendDirectBtn) {
              await sendDirectBtn.click()
              console.log(`🚀 Sent direct connection request to ${lead.full_name}.`)
            }
          }
        } else {
          console.log(`🧪 [DRY RUN] Simulated click on Connect & human typing note: "${lead.generated_note}"`)
        }

        // Step H: Update Database
        await supabase
          .from('leads')
          .update({
            status: 'invite_sent',
            connection_sent_at: new Date().toISOString(),
          })
          .eq('id', lead.id)

        await supabase.from('activity_logs').insert({
          action_type: 'connection_requested',
          lead_id: lead.id,
          status: 'success',
          message: `Connection request sent to ${lead.full_name} (${isDryRun ? 'Dry-Run' : 'Live'})`,
          details: { profileUrl: lead.profile_url, noteUsed: lead.generated_note },
        })

        processed++
        successful++

        // Step I: Randomized Jitter Cooldown Delay (45s to 130s)
        if (i < leads.length - 1) {
          await randomJitterDelay(
            DEFAULT_SAFETY_CONFIG.minDelaySeconds,
            DEFAULT_SAFETY_CONFIG.maxDelaySeconds,
            'between connection requests'
          )
        }
      } catch (err: any) {
        console.error(`❌ [Error processing lead ${lead.full_name}]:`, err.message || err)
        await supabase.from('activity_logs').insert({
          action_type: 'outreach_error',
          lead_id: lead.id,
          status: 'error',
          message: `Failed sending connection to ${lead.full_name}: ${err.message}`,
        })
      }
    }

    return { processed, successful }
  }
}
