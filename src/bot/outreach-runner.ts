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

import fs from 'fs'
import path from 'path'

export interface OutreachRunOptions {
  dryRun?: boolean
  maxLeadsPerBatch?: number
  forceRun?: boolean
  startHour?: number
  endHour?: number
  leads?: Array<{
    id?: string
    full_name: string
    profile_url: string
    generated_note?: string
    headline?: string
    company?: string
  }>
}

export class OutreachRunner {
  private static localQueueFile = path.join(process.cwd(), '.session', 'queued_leads.json')

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
    const forceRun = options.forceRun ?? false

    console.log(`\n================================================================`)
    console.log(`🤖 [Outreach Runner] Starting batch (${isDryRun ? 'DRY-RUN SIMULATION' : 'LIVE SAFE MODE'})`)
    if (forceRun) console.log(`⚡ [Outreach Runner] Force run enabled (Working hours check bypassed).`)
    console.log(`================================================================\n`)

    // 1. Working hours check
    const hoursCheck = SafetyGuard.isWithinWorkingHours(options.startHour, options.endHour, forceRun)
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

    // 3. Obtain leads: priority to explicit options -> Supabase -> local JSON queue
    let targetLeads: any[] = []

    if (options.leads && options.leads.length > 0) {
      targetLeads = options.leads.slice(0, batchLimit)
    } else {
      try {
        const { data: dbLeads, error } = await supabase
          .from('leads')
          .select('*')
          .in('status', ['approved', 'queued'])
          .order('created_at', { ascending: true })
          .limit(batchLimit)

        if (!error && dbLeads && dbLeads.length > 0) {
          targetLeads = dbLeads
        }
      } catch (err: any) {
        console.warn('⚠️ [Outreach Runner] Remote database lead query fallback:', err.message)
      }

      // Local fallback file check
      if (targetLeads.length === 0 && fs.existsSync(this.localQueueFile)) {
        try {
          const raw = fs.readFileSync(this.localQueueFile, 'utf-8')
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            targetLeads = parsed.filter((l: any) => l.status === 'approved' || l.status === 'queued').slice(0, batchLimit)
          }
        } catch {}
      }
    }

    if (targetLeads.length === 0) {
      console.log('ℹ️ [Outreach Runner] No leads currently approved or queued for outreach.')
      return {
        processed: 0,
        successful: 0,
        stoppedEarlyReason: 'No leads currently approved or queued for outreach. Approve leads in Lead Studio first.',
      }
    }

    const leads = targetLeads
    console.log(`📋 [Outreach Runner] Found ${leads.length} leads ready for connection batch.`)
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
        let connectButton = await page.$(
          'button:has-text("Connect"), button[aria-label*="Connect"], button[aria-label*="to connect"], div[role="button"]:has-text("Connect")'
        )

        if (!connectButton) {
          // Check "More" action dropdown if direct Connect is hidden
          const moreButton = await page.$(
            'button[aria-label="More actions"], button:has-text("More"), button[aria-label*="more"]'
          )
          if (moreButton) {
            console.log(`🔘 Clicking "More" options dropdown...`)
            await moreButton.click()
            await sleep(randomBetween(800, 1500))
            connectButton = await page.$(
              'div[role="button"]:has-text("Connect"), span:has-text("Connect"), button:has-text("Connect"), a:has-text("Connect")'
            )
          }
        }

        if (!connectButton) {
          // Check if this is a Search results page with multiple Connect buttons
          const searchConnectBtn = await page.$('.search-results-container button:has-text("Connect"), ul li button:has-text("Connect")')
          if (searchConnectBtn) {
            console.log(`🔍 Found Connect button on search result list!`)
            connectButton = searchConnectBtn
          }
        }

        if (!connectButton) {
          console.warn(`⚠️ [Skip] Could not locate Connect button for ${lead.full_name} (Already connected, Pending, or Follow-only profile).`)
          try {
            await supabase.from('leads').update({ status: 'rejected', notes: 'No connect button found or already connected' }).eq('id', lead.id)
          } catch {}
          continue
        }

        const noteToSend =
          lead.generated_note ||
          (lead as any).note ||
          `Hi ${lead.full_name.split(' ')[0]}, would love to connect and follow your work!`

        if (!isDryRun) {
          await connectButton.click()
          await sleep(randomBetween(1200, 2500))

          // Step E: Click "Add a note"
          const addNoteBtn = await page.$(
            'button:has-text("Add a note"), button[aria-label="Add a note"], button[aria-label*="Add a note"]'
          )
          if (addNoteBtn && noteToSend) {
            console.log(`✍️ Adding personalized AI connection note...`)
            await addNoteBtn.click()
            await sleep(randomBetween(800, 1500))

            // Step F: Human keystroke simulation
            const textareaSelector = 'textarea[name="message"], #custom-message, textarea'
            await simulateHumanTyping(
              page,
              textareaSelector,
              noteToSend,
              DEFAULT_SAFETY_CONFIG.typingSpeedMinMs,
              DEFAULT_SAFETY_CONFIG.typingSpeedMaxMs
            )

            // Review pause
            console.log(`🧐 Human-like pause to review typed note...`)
            await sleep(randomBetween(2000, 4000))

            // Step G: Send invite
            const sendBtn = await page.$(
              'button:has-text("Send"), button[aria-label="Send invitation"], button[aria-label="Send now"]'
            )
            if (sendBtn) {
              await sendBtn.click()
              console.log(`🚀 Connection invite sent to ${lead.full_name}!`)
            }
          } else {
            // Direct send without note if none exists
            const sendDirectBtn = await page.$(
              'button:has-text("Send without a note"), button:has-text("Send"), button[aria-label*="Send"]'
            )
            if (sendDirectBtn) {
              await sendDirectBtn.click()
              console.log(`🚀 Sent direct connection request to ${lead.full_name}.`)
            }
          }
        } else {
          console.log(`🧪 [DRY RUN] Simulated click on Connect & human typing note: "${noteToSend}"`)
        }

        // Step H: Update Database & Local Queue
        try {
          if (lead.id) {
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
              details: { profileUrl: lead.profile_url, noteUsed: noteToSend },
            })
          }
        } catch (dbErr: any) {
          console.warn('⚠️ [Outreach Runner] Could not update remote database:', dbErr.message)
        }

        // Update local session queue if file exists
        try {
          if (fs.existsSync(this.localQueueFile)) {
            const raw = fs.readFileSync(this.localQueueFile, 'utf-8')
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
              const updated = parsed.map((l: any) =>
                (l.id && l.id === lead.id) || l.profile_url === lead.profile_url
                  ? { ...l, status: 'invite_sent', connection_sent_at: new Date().toISOString() }
                  : l
              )
              fs.writeFileSync(this.localQueueFile, JSON.stringify(updated, null, 2))
            }
          }
        } catch {}

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
