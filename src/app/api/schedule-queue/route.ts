import { NextResponse } from 'next/server'
import {
  getScheduledQueue,
  generateBatchTopics,
  scheduleTopics,
  preparePostForQueueItem,
  removeFromQueue,
  getTodaysScheduledPost,
} from '@/ai/content-scheduler'

export async function GET(request: Request) {
  try {
    const queue = await getScheduledQueue()
    const todaysPost = await getTodaysScheduledPost()

    return NextResponse.json({
      success: true,
      queue,
      todaysPost,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error fetching queue' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, nicheOrRole, daysCount, customTopics, itemId, apiKey } = body

    // 1. Auto-generate batch of topics with AI
    if (action === 'generate_batch') {
      if (!nicheOrRole || !nicheOrRole.trim()) {
        return NextResponse.json({ success: false, error: 'Niche or role is required' }, { status: 400 })
      }
      const count = daysCount ? Number(daysCount) : 7
      const batch = await generateBatchTopics(nicheOrRole, count, apiKey)
      const updatedQueue = await scheduleTopics(batch)

      return NextResponse.json({
        success: true,
        message: `Successfully scheduled ${batch.length} days of content!`,
        queue: updatedQueue,
      })
    }

    // 2. Add user's custom line-by-line topics
    if (action === 'add_custom') {
      if (!Array.isArray(customTopics) || customTopics.length === 0) {
        return NextResponse.json({ success: false, error: 'Custom topics list is required' }, { status: 400 })
      }
      const items = customTopics
        .map((t: string) => t.trim())
        .filter(Boolean)
        .map((topic: string) => ({
          topic,
          framework: 'hook_value_cta' as const,
          tone: 'conversational' as const,
        }))

      const updatedQueue = await scheduleTopics(items)
      return NextResponse.json({
        success: true,
        message: `Successfully added ${items.length} topics to schedule!`,
        queue: updatedQueue,
      })
    }

    // 3. Prepare/Pre-generate post and image for a single queue item
    if (action === 'prepare_item') {
      if (!itemId) {
        return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 })
      }
      const queue = await getScheduledQueue()
      const targetItem = queue.find((x) => x.id === itemId)
      if (!targetItem) {
        return NextResponse.json({ success: false, error: 'Item not found in queue' }, { status: 404 })
      }

      const prepared = await preparePostForQueueItem(targetItem, apiKey)
      return NextResponse.json({
        success: true,
        item: prepared,
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error processing queue request' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
    }

    await removeFromQueue(id)
    const updated = await getScheduledQueue()

    return NextResponse.json({
      success: true,
      message: 'Item removed from schedule',
      queue: updated,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error deleting item' }, { status: 500 })
  }
}
