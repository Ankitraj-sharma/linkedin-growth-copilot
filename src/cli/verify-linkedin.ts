import { SessionManager } from '../bot/session-manager'

async function checkLinkedInSession() {
  console.log('🔍 [LinkedIn Auth Check] Launching stealth browser to verify session...')
  const session = await SessionManager.launchStealthBrowser(true)

  try {
    await session.page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 })
    const title = await session.page.title()
    const url = session.page.url()

    console.log(`📄 Page Title: ${title}`)
    console.log(`🌐 Final URL: ${url}`)

    if (url.includes('/feed') || url.includes('/mynetwork') || !url.includes('/login')) {
      console.log('🎉 [SUCCESS] LinkedIn session authenticated successfully! Active feed loaded.')
    } else {
      console.warn('⚠️ [Session Warning] URL indicates login page. Please verify cookie.')
    }
  } catch (err: any) {
    console.error('❌ [Error]:', err.message || err)
  } finally {
    await session.browser.close()
  }
}

checkLinkedInSession()
