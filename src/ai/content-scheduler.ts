import { generateWithGemini } from './gemini-client'
import { generateViralPost, PostFramework } from './content-creator'
import { generateTopicImage } from './image-generator'
import { getSupabaseAdminClient } from '../supabase/supabase-client'
import fs from 'fs'
import path from 'path'

export interface ScheduledPostItem {
  id: string
  topic: string
  scheduledDate: string // YYYY-MM-DD
  scheduledTime: string // e.g. "09:30"
  framework: PostFramework
  tone: 'conversational' | 'authoritative' | 'inspiring' | 'contrarian'
  status: 'pending' | 'ready' | 'published' | 'failed'
  content?: string
  imageUrl?: string
  publishedAt?: string
  createdAt: string
}

// Fallback local persistence file for guaranteed zero-downtime offline storage
const LOCAL_QUEUE_FILE = path.join(process.cwd(), '.scheduled_queue.json')

function loadLocalQueue(): ScheduledPostItem[] {
  try {
    if (fs.existsSync(LOCAL_QUEUE_FILE)) {
      const raw = fs.readFileSync(LOCAL_QUEUE_FILE, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {}
  return []
}

function saveLocalQueue(queue: ScheduledPostItem[]) {
  try {
    fs.writeFileSync(LOCAL_QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8')
  } catch {}
}

/**
 * Uses Gemini to generate a batch of 7, 14, or 30 high-reach LinkedIn topics
 * tailored to a specific niche or role, rotating across the 4 viral frameworks.
 */
export async function generateBatchTopics(
  nicheOrRole: string,
  daysCount: number = 7,
  apiKey?: string
): Promise<Array<{ topic: string; framework: PostFramework; tone: 'conversational' | 'authoritative' | 'inspiring' | 'contrarian' }>> {
  const prompt = `
You are the world's leading LinkedIn Growth Architect.
Generate an editorial content calendar of ${daysCount} distinct, high-reach, viral post topics for someone in the following role/niche:
"${nicheOrRole}"

RULES:
1. Every topic must be punchy, practical, or controversial—ready to stop the scroll.
2. Mix across 4 frameworks: "storytelling" (personal failure/win), "hot_take" (provocative counter-intuitive opinion), "industry_breakdown" (deep-dive architectural/strategic lessons), and "hook_value_cta" (actionable rules/frameworks).
3. Vary the tones across: conversational, authoritative, inspiring, and contrarian.
4. Topics can be in English or Hinglish-friendly themes if relevant to Indian tech/founders.

RESPOND STRICTLY IN VALID JSON:
[
  {
    "topic": "Concise high-impact topic title or premise",
    "framework": "storytelling" | "hot_take" | "industry_breakdown" | "hook_value_cta",
    "tone": "conversational" | "authoritative" | "inspiring" | "contrarian"
  }
]
`
  try {
    const raw = await generateWithGemini(prompt, {
      temperature: 0.85,
      maxOutputTokens: 2500,
      apiKey: apiKey || process.env.GEMINI_API_KEY,
      responseMimeType: 'application/json',
    })

    const cleaned = raw.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, daysCount).map((item, idx) => ({
        topic: item.topic || `Topic ${idx + 1} for ${nicheOrRole}`,
        framework: (item.framework as PostFramework) || 'hook_value_cta',
        tone: item.tone || 'conversational',
      }))
    }
  } catch (err: any) {
    console.warn('⚠️ [Gemini Batch Topics Fallback]:', err.message || err)
  }

  // Fallback programmatic topic matrix
  const frameworks: PostFramework[] = ['storytelling', 'hot_take', 'industry_breakdown', 'hook_value_cta']
  const tones: Array<'conversational' | 'authoritative' | 'inspiring' | 'contrarian'> = [
    'conversational',
    'contrarian',
    'authoritative',
    'inspiring',
  ]

  const fallbackIdeas = [
    `How I handled a major mistake in ${nicheOrRole} and what it taught me`,
    `Unpopular opinion on the current state of ${nicheOrRole}`,
    `The 4 core pillars that separate top 1% from the rest in ${nicheOrRole}`,
    `Why conventional advice about ${nicheOrRole} is dead wrong`,
    `A breakdown of the most expensive lesson I learned building in ${nicheOrRole}`,
    `3 non-negotiable daily habits that accelerated my growth in ${nicheOrRole}`,
    `Why working harder is the slowest way to scale in ${nicheOrRole}`,
  ]

  return Array.from({ length: daysCount }).map((_, i) => ({
    topic: fallbackIdeas[i % fallbackIdeas.length],
    framework: frameworks[i % frameworks.length],
    tone: tones[i % tones.length],
  }))
}

/**
 * Fetch all scheduled items from Supabase (or fallback local storage)
 */
export async function getScheduledQueue(): Promise<ScheduledPostItem[]> {
  try {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('scheduled_at', { ascending: true })

    if (!error && data && data.length > 0) {
      return data.map((row: any) => {
        let scheduledDate = new Date().toISOString().split('T')[0]
        let scheduledTime = '09:30'
        if (row.scheduled_at) {
          const d = new Date(row.scheduled_at)
          scheduledDate = d.toISOString().split('T')[0]
          scheduledTime = d.toTimeString().slice(0, 5)
        }
        return {
          id: row.id,
          topic: row.topic,
          scheduledDate,
          scheduledTime,
          framework: row.framework || 'hook_value_cta',
          tone: 'conversational',
          status: row.status === 'published' ? 'published' : row.content ? 'ready' : 'pending',
          content: row.content,
          publishedAt: row.published_at,
          createdAt: row.created_at,
        }
      })
    }
  } catch (err: any) {
    console.warn('⚠️ [Supabase Queue Fetch Fallback]:', err.message || err)
  }

  return loadLocalQueue()
}

/**
 * Schedule a list of topics across consecutive days (starting today or tomorrow)
 */
export async function scheduleTopics(
  topics: Array<{ topic: string; framework?: PostFramework; tone?: any }>,
  startDateString?: string
): Promise<ScheduledPostItem[]> {
  const queue = await getScheduledQueue()
  const baseDate = startDateString ? new Date(startDateString) : new Date()

  const newItems: ScheduledPostItem[] = []

  for (let i = 0; i < topics.length; i++) {
    const targetDate = new Date(baseDate)
    targetDate.setDate(targetDate.getDate() + i)

    const dateStr = targetDate.toISOString().split('T')[0]
    const item: ScheduledPostItem = {
      id: `sched_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      topic: topics[i].topic.trim(),
      scheduledDate: dateStr,
      scheduledTime: '09:30',
      framework: topics[i].framework || 'hook_value_cta',
      tone: topics[i].tone || 'conversational',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    newItems.push(item)

    // Attempt save to Supabase
    try {
      const supabase = getSupabaseAdminClient()
      const scheduledAt = new Date(`${dateStr}T09:30:00+05:30`).toISOString()
      await supabase.from('posts').insert({
        topic: item.topic,
        content: '',
        framework: item.framework,
        status: 'scheduled',
        scheduled_at: scheduledAt,
      })
    } catch {}
  }

  const updatedQueue = [...queue, ...newItems]
  saveLocalQueue(updatedQueue)
  return updatedQueue
}

/**
 * Generates the full post text and matching AI image for a queued item
 */
export async function preparePostForQueueItem(item: ScheduledPostItem, apiKey?: string): Promise<ScheduledPostItem> {
  const generated = await generateViralPost({
    topic: item.topic,
    framework: item.framework,
    tone: item.tone,
    apiKey,
  })

  const imageResult = await generateTopicImage(item.topic, generated.content, 'cinematic_photo', apiKey)

  const updated: ScheduledPostItem = {
    ...item,
    content: generated.content,
    imageUrl: imageResult.imageUrl,
    status: 'ready',
  }

  // Update in Supabase
  try {
    const supabase = getSupabaseAdminClient()
    await supabase
      .from('posts')
      .update({
        content: updated.content,
        status: 'scheduled',
      })
      .eq('id', item.id)
  } catch {}

  // Update local
  const current = loadLocalQueue()
  const index = current.findIndex((x) => x.id === item.id)
  if (index !== -1) {
    current[index] = updated
    saveLocalQueue(current)
  }

  return updated
}

/**
 * Remove an item from the schedule
 */
export async function removeFromQueue(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient()
    await supabase.from('posts').delete().eq('id', id)
  } catch {}

  const current = loadLocalQueue().filter((x) => x.id !== id)
  saveLocalQueue(current)
  return true
}

/**
 * Get today's scheduled post that is ready or needs generation
 */
export async function getTodaysScheduledPost(): Promise<ScheduledPostItem | null> {
  const queue = await getScheduledQueue()
  const todayStr = new Date().toISOString().split('T')[0]

  // Find post scheduled for today that is not yet published
  const todayPost = queue.find((item) => item.scheduledDate === todayStr && item.status !== 'published')
  if (todayPost) return todayPost

  // If none explicitly for today, find the earliest pending/ready post
  const nextPending = queue.find((item) => item.status !== 'published')
  return nextPending || null
}
