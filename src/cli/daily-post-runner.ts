import { SessionManager } from '../bot/session-manager'
import { sleep, randomBetween } from '../bot/human-simulator'
import {
  getTodaysScheduledPost,
  preparePostForQueueItem,
  getScheduledQueue,
  scheduleTopics,
  generateBatchTopics,
} from '../ai/content-scheduler'
import { getSupabaseAdminClient } from '../supabase/supabase-client'
import fs from 'fs'
import path from 'path'
import os from 'os'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Autonomous Daily Post Runner
 * Runs via GitHub Actions cron or local command: `npm run post:daily`
 */
async function runDailyPostJob() {
  console.log('================================================================')
  console.log('🚀 LinkPilot AI - Autonomous Daily Post Runner')
  console.log('================================================================\n')

  const isDryRun = process.argv.includes('--dry-run')

  // 1. Fetch today's scheduled post
  let postItem = await getTodaysScheduledPost()

  // If no post exists in queue, auto-generate a fresh batch for the user
  if (!postItem) {
    console.log('ℹ️ No post scheduled for today. Auto-generating 7-day content queue...')
    const batch = await generateBatchTopics('Full Stack Engineer & Tech Builder', 7)
    await scheduleTopics(batch)
    postItem = await getTodaysScheduledPost()
  }

  if (!postItem) {
    console.error('❌ Failed to retrieve or generate a post for today.')
    process.exit(1)
  }

  console.log(`📌 Today's Topic: "${postItem.topic}"`)
  console.log(`🎯 Framework: ${postItem.framework} | Tone: ${postItem.tone}`)

  // 2. Prepare post content & image if not already generated
  if (!postItem.content || !postItem.imageUrl) {
    console.log('⚡ Generating post copy and topic-matched visual with Gemini...')
    postItem = await preparePostForQueueItem(postItem)
  }

  console.log('\n📝 Post Preview:\n----------------------------------------')
  console.log(postItem.content)
  console.log('----------------------------------------')
  console.log(`🖼️ Attached Image URL: ${postItem.imageUrl?.slice(0, 80)}...\n`)

  if (isDryRun) {
    console.log('🔍 [Dry-Run Mode Active] Skipping actual browser posting.')
    process.exit(0)
  }

  // 3. Prepare Image File for upload if URL exists
  let tempImagePath: string | null = null
  if (postItem.imageUrl) {
    try {
      tempImagePath = path.join(os.tmpdir(), `li_post_${Date.now()}.png`)
      if (postItem.imageUrl.startsWith('data:image/svg+xml')) {
        // Decode SVG data URI to file
        const svgData = decodeURIComponent(postItem.imageUrl.split(',')[1])
        const svgPath = path.join(os.tmpdir(), `li_post_${Date.now()}.svg`)
        fs.writeFileSync(svgPath, svgData, 'utf-8')
        tempImagePath = svgPath
      } else {
        // Download image from Pollinations / external URL
        console.log('⬇️ Downloading visual asset for LinkedIn upload...')
        const response = await fetch(postItem.imageUrl)
        const arrayBuffer = await response.arrayBuffer()
        fs.writeFileSync(tempImagePath, Buffer.from(arrayBuffer))
      }
      console.log(`✅ Visual ready at: ${tempImagePath}`)
    } catch (imgErr: any) {
      console.warn('⚠️ [Image Download Warning]:', imgErr.message || imgErr)
      tempImagePath = null
    }
  }

  // 4. Launch Stealth Playwright Session
  console.log('🌐 Launching stealth browser to publish post to LinkedIn...')
  const session = await SessionManager.launchStealthBrowser(true)

  try {
    await session.page.goto('https://www.linkedin.com/feed/', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    })
    await sleep(randomBetween(3000, 5000))

    // Verify session
    if (session.page.url().includes('/login')) {
      throw new Error('LinkedIn session cookie (LINKEDIN_LI_AT_COOKIE) has expired. Please update it.')
    }

    // Click "Start a post"
    const startPostSelector = 'button:has-text("Start a post"), button[aria-label="Start a post"], .share-box-feed-entry__trigger'
    await session.page.waitForSelector(startPostSelector, { timeout: 15000 })
    const startPostBtn = await session.page.$(startPostSelector)
    if (!startPostBtn) {
      throw new Error('Could not find "Start a post" button on feed.')
    }

    await startPostBtn.click()
    await sleep(randomBetween(2000, 3000))

    // Upload Image if available
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      try {
        console.log('📷 Attaching image to post...')
        // Look for file input
        const fileInput = await session.page.$('input[type="file"]')
        if (fileInput) {
          await fileInput.setInputFiles(tempImagePath)
          await sleep(3000)

          // Click "Next" or "Done" on image preview modal if present
          const doneBtn = await session.page.$(
            'button:has-text("Next"), button:has-text("Done"), button[aria-label="Next"], button[aria-label="Done"]'
          )
          if (doneBtn) {
            await doneBtn.click()
            await sleep(2000)
          }
        }
      } catch (attachErr: any) {
        console.warn('⚠️ Image upload modal skipped:', attachErr.message || attachErr)
      }
    }

    // Fill Post Content
    const editor = await session.page.$(
      'div[role="textbox"][aria-label*="post"], div[role="textbox"][aria-label*="share"], div.ql-editor'
    )
    if (!editor) {
      throw new Error('Could not locate LinkedIn post text editor.')
    }

    await editor.click()
    await sleep(500)
    await editor.fill(postItem.content || '')
    await sleep(randomBetween(2000, 3500))

    // Click "Post"
    const publishBtn = await session.page.$(
      'button.share-actions__primary-action, button:has-text("Post"), button[aria-label="Post"]'
    )
    if (!publishBtn) {
      throw new Error('Could not find Post submit button.')
    }

    await publishBtn.click()
    await sleep(randomBetween(4000, 6000))
    console.log('🎉 [Success] Post successfully published to LinkedIn feed!')

    // 5. Update Status in Supabase and Local Queue
    try {
      const supabase = getSupabaseAdminClient()
      await supabase
        .from('posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', postItem.id)
    } catch {}

    // Cleanup temp image file
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      try {
        fs.unlinkSync(tempImagePath)
      } catch {}
    }

    console.log('✅ Daily post workflow finished successfully.')
  } catch (runErr: any) {
    console.error('❌ [Auto-Post Runner Error]:', runErr.message || runErr)
    process.exit(1)
  } finally {
    await session.browser.close()
  }
}

runDailyPostJob().catch((e) => {
  console.error(e)
  process.exit(1)
})
