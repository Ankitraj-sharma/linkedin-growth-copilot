import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

async function captureLoginFromChrome() {
  console.log('================================================================')
  console.log('🌐 [LinkPilot AI] Interactive Chrome Login & Cookie Sync')
  console.log('================================================================\n')
  console.log('Opening Chrome window...')
  console.log('👉 If you are already logged in, we will automatically capture your session.')
  console.log('👉 If not, simply log in once, and the bot will store your credentials securely.\n')

  const sessionDir = path.join(process.cwd(), '.session')
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true })
  }
  const storageStatePath = path.join(sessionDir, 'storage_state.json')

  // Launch real Google Chrome in headful mode
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // Uses real Google Chrome installed on user's PC
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
  })

  const context = await browser.newContext({
    viewport: null, // Full screen
  })

  const page = await context.newPage()
  await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded' })

  console.log('⏳ Waiting for active LinkedIn session...')

  let captured = false
  const maxWaitMs = 120000 // 2 minutes
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const cookies = await context.cookies(['https://www.linkedin.com'])
    const liAtCookie = cookies.find((c) => c.name === 'li_at')
    const jsessionidCookie = cookies.find((c) => c.name === 'JSESSIONID')

    if (liAtCookie && liAtCookie.value) {
      console.log('✅ [Success] Detected valid LinkedIn session cookie (li_at)!')

      // Save storage state for Playwright
      await context.storageState({ path: storageStatePath })
      console.log(`💾 Saved session storage state to: ${storageStatePath}`)

      // Update or create .env file
      const envPath = path.join(process.cwd(), '.env')
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''

      if (envContent.includes('LINKEDIN_LI_AT_COOKIE=')) {
        envContent = envContent.replace(
          /LINKEDIN_LI_AT_COOKIE=.*/,
          `LINKEDIN_LI_AT_COOKIE=${liAtCookie.value}`
        )
      } else {
        envContent += `\nLINKEDIN_LI_AT_COOKIE=${liAtCookie.value}\n`
      }

      if (jsessionidCookie) {
        if (envContent.includes('LINKEDIN_JSESSIONID=')) {
          envContent = envContent.replace(
            /LINKEDIN_JSESSIONID=.*/,
            `LINKEDIN_JSESSIONID=${jsessionidCookie.value}`
          )
        } else {
          envContent += `\nLINKEDIN_JSESSIONID=${jsessionidCookie.value}\n`
        }
      }

      fs.writeFileSync(envPath, envContent, 'utf8')
      console.log('🔐 Updated .env file with active session credentials!')
      console.log('\n🎉 Setup complete! You can now run the bot safely anytime with: npm run bot:safe')

      captured = true
      break
    }

    await new Promise((r) => setTimeout(r, 2000))
  }

  if (!captured) {
    console.warn('⚠️ Timed out waiting for LinkedIn login. Please run the script again and sign in.')
  }

  await browser.close()
  process.exit(0)
}

captureLoginFromChrome().catch(console.error)
