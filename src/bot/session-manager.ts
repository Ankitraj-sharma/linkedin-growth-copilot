import { chromium, Browser, BrowserContext, Page } from 'playwright'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { DEFAULT_SAFETY_CONFIG } from '../config/safety-rules'

dotenv.config()

export class SessionManager {
  private static sessionFilePath = path.join(process.cwd(), '.session', 'storage_state.json')

  /**
   * Initializes a stealth Playwright browser instance designed to bypass basic fingerprinting
   */
  static async launchStealthBrowser(headless = true): Promise<{
    browser: Browser
    context: BrowserContext
    page: Page
  }> {
    const sessionDir = path.dirname(this.sessionFilePath)
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true })
    }

    const browser = await chromium.launch({
      headless,
      channel: 'chrome', // Use real installed Google Chrome
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
      ],
    })

    const hasSavedSession = fs.existsSync(this.sessionFilePath)

    const contextOptions: any = {
      userAgent: DEFAULT_SAFETY_CONFIG.stealthUserAgent,
      viewport: DEFAULT_SAFETY_CONFIG.viewport,
      locale: 'en-US',
      timezoneId: 'Asia/Kolkata',
      deviceScaleFactor: 1,
    }

    if (hasSavedSession) {
      contextOptions.storageState = this.sessionFilePath
    }

    const context = await browser.newContext(contextOptions)

    // Mask navigator.webdriver property
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      })
    })

    const page = await context.newPage()

    // Inject cookies if session file didn't exist but env cookie is provided
    if (!hasSavedSession && process.env.LINKEDIN_LI_AT_COOKIE) {
      console.log('🍪 [Session Manager] Injecting li_at cookie from environment...')
      await context.addCookies([
        {
          name: 'li_at',
          value: process.env.LINKEDIN_LI_AT_COOKIE,
          domain: '.www.linkedin.com',
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'None',
        },
      ])
    }

    return { browser, context, page }
  }

  /**
   * Saves storage state for subsequent sessions
   */
  static async persistSession(context: BrowserContext): Promise<void> {
    try {
      await context.storageState({ path: this.sessionFilePath })
      console.log('💾 [Session Manager] Browser session state persisted successfully.')
    } catch (e: any) {
      console.warn('⚠️ [Session Manager] Could not persist session:', e.message)
    }
  }
}
