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
 * Uses Gemini to generate a batch of 7, 14, or 30 high-reach LinkedIn topics WITH FULL READY-TO-PUBLISH POST CONTENT,
 * tailored to a specific niche or role, rotating across the 4 viral frameworks.
 */
export async function generateBatchTopics(
  nicheOrRole: string,
  daysCount: number = 7,
  apiKey?: string
): Promise<Array<{ topic: string; framework: PostFramework; tone: 'conversational' | 'authoritative' | 'inspiring' | 'contrarian'; content?: string }>> {
  const prompt = `
You are the world's leading LinkedIn Growth Architect and elite executive ghostwriter.
Generate an editorial content calendar of ${daysCount} distinct, complete, high-reach LinkedIn posts for someone in the following role or niche:
"${nicheOrRole}"

MANDATORY RULES:
1. Every post item MUST include BOTH a punchy headline ("topic") AND the FULL, READY-TO-PUBLISH post content ("content").
   DO NOT return just a topic title. The user must be able to read, copy, or schedule the entire post immediately.
2. Structure of the "content" body for each post:
   - Line 1: Ultra-compelling, scroll-stopping viral hook (under 12 words, bold statement or counter-intuitive question).
   - Line 2: Empty line for breathing room.
   - Body: 3 to 5 concise, punchy bullet points or short paragraphs with clear whitespace between them. High value, actionable, zero generic fluff.
   - Core Takeaway / Golden Rule: 1-2 impactful sentences summarizing the principle.
   - Call To Action (CTA): An engaging question that invites comments and debate from industry peers.
   - Hashtags: 3-5 relevant hashtags at the bottom (e.g. #Career #Tech #Leadership).
3. Distribute evenly across 4 proven frameworks:
   - "storytelling" (real-world failure, hard-won lesson, or breakthrough moment)
   - "hot_take" (challenging an outdated industry sacred cow)
   - "industry_breakdown" (practical framework, architecture, or actionable step-by-step breakdown)
   - "hook_value_cta" (high-leverage rules, checklist, or playbook)
4. Vary the tones across: conversational, authoritative, inspiring, and contrarian.
5. First-person perspective ("I", "my", "we").

RESPOND STRICTLY IN VALID JSON:
[
  {
    "topic": "Concise high-impact topic title or premise",
    "framework": "storytelling" | "hot_take" | "industry_breakdown" | "hook_value_cta",
    "tone": "conversational" | "authoritative" | "inspiring" | "contrarian",
    "content": "Full LinkedIn post text formatted with line breaks, emojis, bullet points, takeaway, CTA, and hashtags."
  }
]
`
  try {
    const raw = await generateWithGemini(prompt, {
      temperature: 0.85,
      maxOutputTokens: 6000,
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
        content: item.content || undefined,
      }))
    }
  } catch (err: any) {
    console.warn('⚠️ [Gemini Batch Topics Fallback]:', err.message || err)
  }

  // Fallback programmatic topic and post matrix with complete bodies
  const fallbackTemplates = [
    {
      topic: `Why your company doesn't need Machine Learning (and why a simple SQL query will save your quarter)`,
      framework: 'hot_take' as PostFramework,
      tone: 'contrarian' as const,
      content: `80% of teams building Machine Learning models don't actually need Machine Learning.\n\nHere is the hard truth most enterprise consultants won't say:\n\n• Most company data is too noisy and fragmented for complex neural nets.\n• A well-optimized SQL query with window functions can solve 90% of business reporting needs.\n• Linear regression and decision trees beat deep learning on tabular business data 8 out of 10 times.\n• The ongoing maintenance cost of ML pipelines is 10x higher than standard backend infrastructure.\n\nBefore spending $500k on an AI squad:\n1. Audit your data cleanliness.\n2. Write clear SQL aggregates.\n3. Validate if business users actually act on the numbers.\n\nSimplicity scales. Over-engineering kills quarters.\n\nAgree or disagree? How much unnecessary ML have you seen in your company?\n\n#DataEngineering #MachineLearning #SoftwareEngineering #TechStrategy`,
    },
    {
      topic: `How I wasted 6 months building a complex architecture that was beaten by a simple monolith`,
      framework: 'storytelling' as PostFramework,
      tone: 'conversational' as const,
      content: `In 2021, I convinced my team to split our core app into 14 microservices.\n\nIt was the single biggest architectural mistake of my career.\n\nHere's what happened over the next 6 months:\n\n1. Debugging a single checkout required inspecting 5 different distributed tracing logs.\n2. Local development took 45 minutes just to spin up Docker containers.\n3. Network latency between services eroded all theoretical performance gains.\n4. We spent more time managing Kubernetes manifests than shipping features.\n\nWe eventually rewrote the core into a modular monolith in 3 weeks.\n\nDeployment time dropped from 35 mins to 90 seconds. System bugs dropped by 70%.\n\nLesson learned: Never build for Google's scale before you have Google's traffic.\n\nWhat's the biggest architectural lesson you've had to learn the hard way?\n\n#SoftwareDevelopment #Architecture #Microservices #TechLessons`,
    },
    {
      topic: `The 5-step blueprint to level up as a technical leader in under 2 years`,
      framework: 'hook_value_cta' as PostFramework,
      tone: 'authoritative' as const,
      content: `Writing clean code will get you hired. Understanding business leverage will get you promoted.\n\nAfter 8+ years building software systems, here is the exact 5-step playbook that separates Senior engineers from Staff and Leads:\n\n1. Translate PRs into revenue & latency metrics: Don't just say "refactored user auth", say "reduced auth latency by 40%, cutting user dropoff by 3%".\n2. Master asynchronous communication: Write design docs so clearly that teammates in other timezones can unblock themselves.\n3. Focus on unblocking others: The highest ROI work is code reviews, architectural RFCs, and mentoring.\n4. Disagree and commit cleanly: Push for the best design, but align 100% with the team once a decision is made.\n5. Protect focus time relentlessly: Batch meetings into specific afternoons and guard deep-work mornings.\n\nWhich of these 5 do you find most challenging in your day-to-day work?\n\n#CareerGrowth #EngineeringLeadership #TechCareers #Mentorship`,
    },
    {
      topic: `An architectural breakdown of how high-throughput systems handle millions of requests without breaking`,
      framework: 'industry_breakdown' as PostFramework,
      tone: 'authoritative' as const,
      content: `How do top tech companies handle 100,000+ requests per second without database collapse?\n\nHere is the core resilience pattern broken down in 4 simple layers:\n\n1. Edge Caching & CDNs: 85% of read traffic never hits the origin database. Static assets and warm query caches absorb the spike.\n2. Read-Through Redis Caching: Hot user profiles and session tokens stay in memory with strict TTLs.\n3. Asynchronous Write Buffering: Heavy write operations aren't written directly to PostgreSQL. They are published to Kafka/RabbitMQ queues and consumed in controlled batches.\n4. Circuit Breakers & Graceful Degradation: If a downstream recommendation service fails, fallback to a cached static list instead of throwing 500 errors.\n\nResilience isn't about avoiding failure—it's about failing gracefully without bringing down the main transaction path.\n\nSave this breakdown if you're preparing for System Design interviews or scaling your current stack!\n\n#SystemDesign #BackendEngineering #CloudArchitecture #HighScale`,
    },
    {
      topic: `Why the most successful people in tech prioritize energy management over time management`,
      framework: 'inspiring' as PostFramework,
      tone: 'inspiring' as const,
      content: `You don't need an 80-hour work week to produce world-class output.\n\nYou need 4 hours of uninterrupted, high-energy focus.\n\nEarly in my journey, I tracked every single minute on calendars and to-do apps. Yet at 4 PM, I was exhausted and staring blankly at code.\n\nThe real shift happened when I stopped managing time and started managing energy:\n\n• Deep-work blocks before 11 AM: Solving the hardest architectural problem when dopamine and willpower are peaked.\n• No Slack or email before 10 AM: Reactive mode drains creative cognitive stamina before you even write a line.\n• Walking meetings & midday sunlight: 20 minutes outside resets mental fatigue faster than 3 cups of coffee.\n• Hard stop at the end of the workday: Subconscious problem-solving only works when you give your brain true rest.\n\nConsistency beats intensity every single time.\n\nHow do you protect your peak energy hours during the day?\n\n#Productivity #WorkLifeBalance #MentalHealth #DeveloperLife`,
    },
  ]

  return Array.from({ length: daysCount }).map((_, i) => {
    const item = fallbackTemplates[i % fallbackTemplates.length]
    return {
      topic: item.topic,
      framework: item.framework,
      tone: item.tone,
      content: item.content,
    }
  })
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
  topics: Array<{ topic: string; framework?: PostFramework; tone?: any; content?: string }>,
  startDateString?: string
): Promise<ScheduledPostItem[]> {
  const queue = await getScheduledQueue()
  const baseDate = startDateString ? new Date(startDateString) : new Date()

  const newItems: ScheduledPostItem[] = []

  for (let i = 0; i < topics.length; i++) {
    const targetDate = new Date(baseDate)
    targetDate.setDate(targetDate.getDate() + i)

    const dateStr = targetDate.toISOString().split('T')[0]
    const content = topics[i].content ? topics[i].content!.trim() : undefined
    const item: ScheduledPostItem = {
      id: `sched_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      topic: topics[i].topic.trim(),
      scheduledDate: dateStr,
      scheduledTime: '09:30',
      framework: topics[i].framework || 'hook_value_cta',
      tone: topics[i].tone || 'conversational',
      status: content ? 'ready' : 'pending',
      content: content,
      createdAt: new Date().toISOString(),
    }

    newItems.push(item)

    // Attempt save to Supabase
    try {
      const supabase = getSupabaseAdminClient()
      const scheduledAt = new Date(`${dateStr}T09:30:00+05:30`).toISOString()
      await supabase.from('posts').insert({
        topic: item.topic,
        content: item.content || '',
        framework: item.framework,
        status: item.content ? 'ready' : 'scheduled',
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
  let content = item.content
  if (!content || !content.trim()) {
    const generated = await generateViralPost({
      topic: item.topic,
      framework: item.framework,
      tone: item.tone,
      apiKey,
    })
    content = generated.content
  }

  let imageUrl = item.imageUrl
  if (!imageUrl) {
    try {
      const imageResult = await generateTopicImage(item.topic, content, 'cinematic_photo', apiKey)
      imageUrl = imageResult.imageUrl
    } catch (e) {
      console.warn('⚠️ [Image Generation in preparePost]:', e)
    }
  }

  const updated: ScheduledPostItem = {
    ...item,
    content,
    imageUrl,
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
