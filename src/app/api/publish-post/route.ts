import { NextResponse } from 'next/server'
import { SessionManager } from '@/bot/session-manager'
import { sleep, randomBetween } from '@/bot/human-simulator'
import { getSupabaseClient } from '@/supabase/supabase-client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { content, imageUrl } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Post content cannot be empty' }, { status: 400 })
    }

    const shareIntentUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(content)}`

    // If running in environment without browser binary support (e.g. AWS Lambda / Vercel Serverless),
    // return the direct 1-click share intent URL
    const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined

    if (isServerless) {
      return NextResponse.json({
        success: true,
        mode: 'intent',
        shareUrl: shareIntentUrl,
        message: 'Opening LinkedIn with your post pre-loaded. Click Post to publish!',
      })
    }

    // Attempt autonomous posting via Playwright stealth browser
    try {
      console.log('🌐 [Auto-Poster] Launching stealth browser for LinkedIn post publication...')
      const session = await SessionManager.launchStealthBrowser(true)

      try {
        await session.page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await sleep(randomBetween(2500, 4500))

        // Check if logged in
        if (session.page.url().includes('/login')) {
          throw new Error('Session cookie expired. Please re-authenticate.')
        }

        // Click "Start a post" button
        const startPostBtn = await session.page.$(
          'button:has-text("Start a post"), button[aria-label="Start a post"], .share-box-feed-entry__trigger'
        )

        if (!startPostBtn) {
          throw new Error('Could not find "Start a post" button on LinkedIn feed.')
        }

        await startPostBtn.click()
        await sleep(randomBetween(1500, 2500))

        // Focus editor
        const editor = await session.page.$(
          'div[role="textbox"][aria-label*="post"], div[role="textbox"][aria-label*="share"], div.ql-editor'
        )

        if (!editor) {
          throw new Error('Could not find post text area.')
        }

        await editor.click()
        await sleep(500)

        // Type post content
        await editor.fill(content)
        await sleep(randomBetween(1500, 3000))

        // Click "Post" button
        const publishBtn = await session.page.$(
          'button.share-actions__primary-action, button:has-text("Post")'
        )

        if (publishBtn) {
          await publishBtn.click()
          await sleep(randomBetween(3000, 5000))
          console.log('✅ [Auto-Poster] Post published successfully!')

          // Log to Supabase
          try {
            const supabase = getSupabaseClient()
            await supabase.from('posts').insert({
              topic: content.slice(0, 50),
              content,
              status: 'published',
              published_at: new Date().toISOString(),
            })
          } catch {}

          return NextResponse.json({
            success: true,
            mode: 'automated',
            message: 'Post successfully published live on your LinkedIn feed!',
          })
        } else {
          throw new Error('Could not find the submit Post button.')
        }
      } finally {
        await session.browser.close()
      }
    } catch (botErr: any) {
      console.warn('⚠️ [Auto-Poster Fallback to 1-Click Intent]:', botErr.message)
      return NextResponse.json({
        success: true,
        mode: 'intent',
        shareUrl: shareIntentUrl,
        message: 'Opening LinkedIn direct post window with pre-loaded text!',
      })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error publishing post' }, { status: 500 })
  }
}
