import { Page } from 'playwright'
import { getSupabaseClient } from '../supabase/supabase-client'
import { simulateHumanScroll, simulateRandomCursorMovement, randomJitterDelay, sleep, randomBetween } from './human-simulator'
import { SafetyGuard } from './safety-guard'

export interface DiscoveryOptions {
  campaignId: string
  keywordQuery: string
  location?: string
  maxProfilesToExtract?: number
}

export class LeadScraper {
  /**
   * Discovers and extracts relevant profiles based on search criteria with human delays
   */
  static async discoverProfiles(page: Page, options: DiscoveryOptions): Promise<number> {
    const supabase = getSupabaseClient()
    const query = encodeURIComponent(options.keywordQuery)
    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${query}&origin=GLOBAL_SEARCH_HEADER`

    console.log(`🔎 [Lead Scraper] Navigating to LinkedIn search: ${options.keywordQuery}`)
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' })
    await sleep(randomBetween(3000, 6000))

    // Check for challenges
    if (await SafetyGuard.scanForSecurityChallenges(page)) {
      throw new Error('Security challenge triggered during profile search.')
    }

    // Scroll down naturally to let lazy-loaded results render
    await simulateHumanScroll(page)
    await simulateRandomCursorMovement(page)

    // Extract profile cards
    const profileLinks = await page.$$eval(
      'a[href*="/in/"]',
      (links) => {
        const unique = new Map<string, { url: string; text: string }>()
        links.forEach((l) => {
          const href = (l as HTMLAnchorElement).href.split('?')[0]
          const text = (l as HTMLAnchorElement).innerText.trim()
          if (href && href.includes('/in/') && text && !unique.has(href)) {
            unique.set(href, { url: href, text })
          }
        })
        return Array.from(unique.values())
      }
    )

    console.log(`🎯 [Lead Scraper] Found ${profileLinks.length} profile references on page.`)
    let insertedCount = 0
    const maxToCollect = options.maxProfilesToExtract || 10

    for (const profile of profileLinks.slice(0, maxToCollect)) {
      const cleanUrl = profile.url
      const nameGuess = profile.text.split('\n')[0] || 'LinkedIn Member'

      if (nameGuess.toLowerCase().includes('linkedin member') || nameGuess.length < 2) {
        continue
      }

      // Insert or skip if already exists in Supabase
      const { error } = await supabase.from('leads').upsert(
        {
          campaign_id: options.campaignId,
          full_name: nameGuess,
          profile_url: cleanUrl,
          status: 'discovered',
          metadata: { discoveredAt: new Date().toISOString() },
        },
        { onConflict: 'profile_url', ignoreDuplicates: true }
      )

      if (!error) {
        insertedCount++
        console.log(`➕ [Lead Added]: ${nameGuess} -> ${cleanUrl}`)
      }
    }

    // Natural reading pause after scraping
    await randomJitterDelay(5, 12, 'browsing search results')
    return insertedCount
  }
}
