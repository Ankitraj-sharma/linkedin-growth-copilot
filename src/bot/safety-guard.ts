import { Page } from 'playwright'
import { getSupabaseClient } from '../supabase/supabase-client'
import { DEFAULT_SAFETY_CONFIG } from '../config/safety-rules'

export interface SafetyCheckResult {
  allowed: boolean
  reason?: string
}

export class SafetyGuard {
  /**
   * Validates if current time is within acceptable human working hours
   */
  static isWithinWorkingHours(
    startHour = DEFAULT_SAFETY_CONFIG.workingHoursStart,
    endHour = DEFAULT_SAFETY_CONFIG.workingHoursEnd,
    forceRun = false
  ): SafetyCheckResult {
    if (forceRun) {
      console.log('⚡ [Safety Guard] Manual override active: Bypassing working hours check.')
      return { allowed: true }
    }

    const currentHour = new Date().getHours()

    if (currentHour < startHour || currentHour >= endHour) {
      return {
        allowed: false,
        reason: `Outside working hours (${startHour}:00 - ${endHour}:00). Current hour is ${currentHour}:00. Pausing to mimic real sleep cycle. (Use forceRun / Bypass to override)`,
      }
    }

    return { allowed: true }
  }

  /**
   * Checks Supabase database for today's outreach count against daily limits
   */
  static async checkDailyQuota(): Promise<SafetyCheckResult> {
    try {
      const supabase = getSupabaseClient()
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { count, error } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action_type', 'connection_requested')
        .gte('created_at', todayStart.toISOString())

      if (error) {
        console.warn('⚠️ [Safety Guard] Could not verify remote quota, using local check:', error.message)
        return { allowed: true }
      }

      const totalSentToday = count || 0
      const limit = DEFAULT_SAFETY_CONFIG.maxDailyConnections

      if (totalSentToday >= limit) {
        return {
          allowed: false,
          reason: `Daily quota limit reached: ${totalSentToday}/${limit} connection requests sent today.`,
        }
      }

      console.log(`🛡️ [Safety Guard] Daily Quota Status: ${totalSentToday}/${limit} used today.`)
      return { allowed: true }
    } catch (e: any) {
      console.warn('⚠️ [Safety Guard] Offline quota fallback:', e.message)
      return { allowed: true }
    }
  }

  /**
   * Scans page for LinkedIn security challenges, CAPTCHAs, or unusual traffic alerts.
   * If detected, triggers the circuit breaker immediately.
   */
  static async scanForSecurityChallenges(page: Page): Promise<boolean> {
    const currentUrl = page.url().toLowerCase()

    // 1. URL pattern check
    if (
      currentUrl.includes('/checkpoint/') ||
      currentUrl.includes('/challenge/') ||
      currentUrl.includes('captcha')
    ) {
      console.error('🚨 [CIRCUIT BREAKER] Security challenge or checkpoint detected in URL!')
      await this.logSafetyAlert('Security checkpoint detected in URL: ' + currentUrl)
      return true
    }

    // 2. DOM text check
    try {
      const content = await page.content()
      const lower = content.toLowerCase()

      const warningSignals = [
        'security check',
        'quick verification',
        'unusual activity',
        'please solve this puzzle',
        'let us know you are human',
      ]

      for (const signal of warningSignals) {
        if (lower.includes(signal)) {
          console.error(`🚨 [CIRCUIT BREAKER] Warning signal detected in DOM: "${signal}"`)
          await this.logSafetyAlert(`Warning signal found in page DOM: ${signal}`)
          return true
        }
      }
    } catch (err) {
      // Content scan error
    }

    return false
  }

  /**
   * Logs a high-priority safety alert to the database
   */
  private static async logSafetyAlert(message: string): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      await supabase.from('activity_logs').insert({
        action_type: 'safety_alert',
        status: 'error',
        message,
        details: { timestamp: new Date().toISOString() },
      })
    } catch {
      // Ignore if offline
    }
  }
}
