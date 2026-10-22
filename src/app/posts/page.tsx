'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  PenTool,
  Copy,
  Check,
  Calendar,
  Share2,
  Clock,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send,
  Image as ImageIcon,
  Plus,
  Trash2,
  Play,
  RefreshCw,
  Layers,
  Flame,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  FileText,
} from 'lucide-react'

interface ScheduledItem {
  id: string
  topic: string
  scheduledDate: string
  scheduledTime: string
  framework: 'hook_value_cta' | 'storytelling' | 'industry_breakdown' | 'hot_take'
  tone: 'conversational' | 'authoritative' | 'inspiring' | 'contrarian'
  status: 'pending' | 'ready' | 'published' | 'failed'
  content?: string
  imageUrl?: string
  publishedAt?: string
  createdAt?: string
}

export default function PostStudioPage() {
  const [activeTab, setActiveTab] = useState<'studio' | 'autopilot'>('studio')

  // Studio State
  const [topic, setTopic] = useState('Why architecture fundamentals beat learning 10 new frameworks every year')
  const [framework, setFramework] = useState<'hook_value_cta' | 'storytelling' | 'industry_breakdown' | 'hot_take'>('hook_value_cta')
  const [tone, setTone] = useState<'conversational' | 'authoritative' | 'inspiring' | 'contrarian'>('conversational')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)

  // Image Generation State
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageStyle, setImageStyle] = useState<'cinematic_photo' | 'quote_card'>('cinematic_photo')

  // Auto-Pilot Queue State
  const [queue, setQueue] = useState<ScheduledItem[]>([])
  const [isLoadingQueue, setIsLoadingQueue] = useState(false)
  const [bulkInput, setBulkInput] = useState('')
  const [calendarNiche, setCalendarNiche] = useState('Full Stack Engineer & Tech Builder')
  const [calendarDays, setCalendarDays] = useState<'7' | '14' | '30'>('7')
  const [isScheduling, setIsScheduling] = useState(false)
  const [todaysPost, setTodaysPost] = useState<ScheduledItem | null>(null)
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({})
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<string>('')
  const [preparingItemId, setPreparingItemId] = useState<string | null>(null)
  const [isBatchGenerating, setIsBatchGenerating] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const [copiedQueueId, setCopiedQueueId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gemini_api_key')
      if (saved) setApiKey(saved)

      const savedQueue = localStorage.getItem('linkpilot_scheduled_queue')
      if (savedQueue) {
        try {
          const parsed = JSON.parse(savedQueue)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQueue(parsed)
            const todayStr = new Date().toISOString().split('T')[0]
            const todayItem =
              parsed.find((p: any) => p.scheduledDate === todayStr && p.status !== 'published') ||
              parsed[0]
            setTodaysPost(todayItem)
          }
        } catch {}
      }
    }
    fetchQueue()
  }, [])

  const handleSaveKey = (key: string) => {
    setApiKey(key)
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', key)
    }
  }

  const fetchQueue = async () => {
    setIsLoadingQueue(true)
    try {
      const res = await fetch('/api/schedule-queue')
      const data = await res.json()
      if (data.success && Array.isArray(data.queue) && data.queue.length > 0) {
        setQueue(data.queue)
        if (typeof window !== 'undefined') {
          localStorage.setItem('linkpilot_scheduled_queue', JSON.stringify(data.queue))
        }
        if (data.todaysPost) setTodaysPost(data.todaysPost)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingQueue(false)
    }
  }

  const [postContent, setPostContent] = useState(`Most software engineers spend 80% of their time chasing new frameworks.
The top 1% spend 80% of their time mastering fundamentals.

Here is what I realized after building real-world distributed systems:

1. Frameworks come and go every 2 years.
2. Core data structures & system design remain unchanged for decades.
3. Clean communication and failure recovery beat clever one-liners every single time.
4. If your system cannot be easily debugged at 2:00 AM, it is not production-ready.

Build systems that are boringly reliable, not needlessly complex.

What is one architectural rule you never compromise on?

#SoftwareEngineering #Architecture #Coding #CareerGrowth #WebDev`)

  const [postTitle, setPostTitle] = useState('Key Architectural Insights')
  const [hookVariations, setHookVariations] = useState<string[]>([])
  const [hashtags, setHashtags] = useState<string[]>(['#SoftwareEngineering', '#Architecture', '#Coding'])
  const [readTime, setReadTime] = useState<number>(45)

  // Generate Post
  const handleGenerate = async (overrideTopic?: string, overrideFramework?: any, overrideTone?: any) => {
    const currentTopic = overrideTopic !== undefined ? overrideTopic : topic
    if (!currentTopic.trim()) return

    setIsGenerating(true)
    const targetFramework = overrideFramework || framework
    const targetTone = overrideTone || tone

    try {
      const res = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentTopic,
          framework: targetFramework,
          tone: targetTone,
          apiKey,
        }),
      })
      const data = await res.json()
      if (data.content) {
        setPostContent(data.content)
        if (data.title) setPostTitle(data.title)
        if (data.hookVariations) setHookVariations(data.hookVariations)
        if (data.suggestedHashtags) setHashtags(data.suggestedHashtags)
        if (data.estimatedReadTimeSeconds) setReadTime(data.estimatedReadTimeSeconds)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate Matching AI Image
  const handleGenerateImage = async (styleOverride?: 'cinematic_photo' | 'quote_card') => {
    if (!topic.trim()) return
    setIsGeneratingImage(true)
    const activeStyle = styleOverride || imageStyle

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          content: postContent,
          style: activeStyle,
          apiKey,
        }),
      })
      const data = await res.json()
      if (data.success && data.imageUrl) {
        setImageUrl(data.imageUrl)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleSelectFramework = (f: typeof framework) => {
    setFramework(f)
    if (topic.trim() && postContent) {
      handleGenerate(topic, f, tone)
    }
  }

  const handleSelectTone = (t: typeof tone) => {
    setTone(t)
    if (topic.trim() && postContent) {
      handleGenerate(topic, framework, t)
    }
  }

  const handleSwapHook = (newHook: string) => {
    const paragraphs = postContent.split('\n\n')
    if (paragraphs.length > 1) {
      paragraphs[0] = newHook
      setPostContent(paragraphs.join('\n\n'))
    }
  }

  const [isPublishing, setIsPublishing] = useState(false)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(postContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePublishPost = async () => {
    setIsPublishing(true)
    setPublishMessage('Publishing post to your LinkedIn profile...')

    try {
      const res = await fetch('/api/publish-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent,
          imageUrl,
        }),
      })
      const data = await res.json()

      if (data.success) {
        if (data.mode === 'intent' && data.shareUrl) {
          window.open(data.shareUrl, '_blank')
          setPublishMessage('✅ Opened LinkedIn with your post pre-filled! Click "Post" to submit.')
        } else {
          setPublishMessage('🎉 Post successfully published live to your LinkedIn feed!')
        }
      } else {
        const fallbackUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postContent)}`
        window.open(fallbackUrl, '_blank')
        setPublishMessage('✅ Opened LinkedIn with your post ready to publish!')
      }
    } catch (e: any) {
      const fallbackUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postContent)}`
      window.open(fallbackUrl, '_blank')
      setPublishMessage('✅ Opened LinkedIn post window!')
    } finally {
      setIsPublishing(false)
    }
  }

  // Auto-Pilot Queue Handlers
  const handleAddCustomTopics = async () => {
    const lines = bulkInput.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return

    setIsScheduling(true)
    try {
      const res = await fetch('/api/schedule-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_custom',
          customTopics: lines,
        }),
      })
      const data = await res.json()
      if (data.success && data.queue) {
        setQueue(data.queue)
        if (typeof window !== 'undefined') {
          localStorage.setItem('linkpilot_scheduled_queue', JSON.stringify(data.queue))
        }
        setBulkInput('')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsScheduling(false)
    }
  }

  const handleGenerateBatch = async () => {
    if (!calendarNiche.trim()) return

    setIsScheduling(true)
    try {
      const res = await fetch('/api/schedule-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_batch',
          nicheOrRole: calendarNiche,
          daysCount: calendarDays,
          apiKey,
        }),
      })
      const data = await res.json()
      if (data.success && data.queue && data.queue.length > 0) {
        setQueue(data.queue)
        if (typeof window !== 'undefined') {
          localStorage.setItem('linkpilot_scheduled_queue', JSON.stringify(data.queue))
        }
        const todayStr = new Date().toISOString().split('T')[0]
        const todayItem =
          data.queue.find((p: any) => p.scheduledDate === todayStr && p.status !== 'published') ||
          data.queue[0]
        setTodaysPost(todayItem)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsScheduling(false)
    }
  }

  const handleDeleteQueueItem = async (id: string) => {
    const updated = queue.filter((x) => x.id !== id)
    setQueue(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('linkpilot_scheduled_queue', JSON.stringify(updated))
    }
    try {
      await fetch(`/api/schedule-queue?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleExpand = (id: string) => {
    setExpandedPostIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleStartEdit = (item: ScheduledItem) => {
    setEditingPostId(item.id)
    setEditingContent(item.content || '')
    setExpandedPostIds((prev) => ({ ...prev, [item.id]: true }))
  }

  const handleCancelEdit = () => {
    setEditingPostId(null)
    setEditingContent('')
  }

  const handleSaveEdit = (id: string) => {
    const updated = queue.map((x) =>
      x.id === id ? { ...x, content: editingContent, status: 'ready' as const } : x
    )
    setQueue(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('linkpilot_scheduled_queue', JSON.stringify(updated))
    }
    if (todaysPost?.id === id) {
      setTodaysPost({ ...todaysPost, content: editingContent, status: 'ready' })
    }
    setEditingPostId(null)
    setEditingContent('')
  }

  const handleCopyQueueItem = (item: ScheduledItem) => {
    if (!item.content) return
    navigator.clipboard.writeText(item.content)
    setCopiedQueueId(item.id)
    setTimeout(() => setCopiedQueueId(null), 2500)
  }

  const handlePrepareQueueItem = async (item: ScheduledItem) => {
    setPreparingItemId(item.id)
    try {
      const res = await fetch('/api/schedule-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prepare_item',
          itemId: item.id,
          item,
          apiKey,
        }),
      })
      const data = await res.json()
      if (data.success && data.item) {
        const updated = queue.map((x) => (x.id === data.item.id ? data.item : x))
        setQueue(updated)
        if (typeof window !== 'undefined') {
          localStorage.setItem('linkpilot_scheduled_queue', JSON.stringify(updated))
        }
        if (todaysPost?.id === data.item.id) {
          setTodaysPost(data.item)
        }
        // Auto-expand so user can immediately read their full generated post
        setExpandedPostIds((prev) => ({ ...prev, [data.item.id]: true }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPreparingItemId(null)
    }
  }

  const handleGenerateAllPending = async () => {
    const pendingItems = queue.filter((x) => !x.content)
    if (pendingItems.length === 0) return

    setIsBatchGenerating(true)
    setBatchProgress({ current: 0, total: pendingItems.length })
    let currentQueue = [...queue]

    for (let i = 0; i < pendingItems.length; i++) {
      const target = pendingItems[i]
      setBatchProgress({ current: i + 1, total: pendingItems.length })
      setPreparingItemId(target.id)

      try {
        const res = await fetch('/api/schedule-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prepare_item',
            itemId: target.id,
            item: target,
            apiKey,
          }),
        })
        const data = await res.json()
        if (data.success && data.item) {
          currentQueue = currentQueue.map((x) => (x.id === data.item.id ? data.item : x))
          setQueue([...currentQueue])
          if (typeof window !== 'undefined') {
            localStorage.setItem('linkpilot_scheduled_queue', JSON.stringify(currentQueue))
          }
          if (todaysPost?.id === data.item.id) {
            setTodaysPost(data.item)
          }
          setExpandedPostIds((prev) => ({ ...prev, [data.item.id]: true }))
        }
      } catch (err) {
        console.error('Batch prep error:', err)
      }
    }

    setPreparingItemId(null)
    setIsBatchGenerating(false)
  }

  const handlePostQueuedNow = async (item: ScheduledItem) => {
    setIsPublishing(true)
    setPublishMessage(`Publishing today's queued post ("${item.topic}")...`)
    try {
      let finalContent = item.content
      let finalImage = item.imageUrl

      if (!finalContent) {
        const prepRes = await fetch('/api/schedule-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prepare_item',
            itemId: item.id,
            apiKey,
          }),
        })
        const prepData = await prepRes.json()
        if (prepData.success && prepData.item) {
          finalContent = prepData.item.content
          finalImage = prepData.item.imageUrl
        }
      }

      const res = await fetch('/api/publish-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: finalContent || item.topic,
          imageUrl: finalImage,
        }),
      })
      const data = await res.json()

      if (data.success && data.shareUrl) {
        window.open(data.shareUrl, '_blank')
      }
      setPublishMessage('✅ Post queued for LinkedIn feed!')
      fetchQueue()
    } catch (e) {
      console.error(e)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Post Studio & Reach Engine</h1>
          <p className="text-sm text-slate-500">
            Generate high-engagement LinkedIn posts, matching AI visuals, and automated 30-day posting calendars.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'studio'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-sky-600" />
              <span>Post Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('autopilot')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'autopilot'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Auto-Pilot 30-Day Queue</span>
              {queue.length > 0 && (
                <span className="bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                  {queue.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>{apiKey ? '⚡ Connected' : '🔑 Custom Key'}</span>
          </button>
        </div>
      </div>

      {showKeyInput && (
        <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-900">Custom Google Gemini API Key</span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 hover:underline font-semibold"
            >
              Get Free Key from Google AI Studio →
            </a>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Paste AI Studio Key (AIzaSy...)"
              value={apiKey}
              onChange={(e) => handleSaveKey(e.target.value)}
              className="flex-1 p-2 bg-white border border-sky-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
            />
            {apiKey && (
              <button
                onClick={() => handleSaveKey('')}
                className="px-3 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {publishMessage && (
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs font-medium text-sky-800 flex items-center justify-between">
          <span>{publishMessage}</span>
          <button onClick={() => setPublishMessage(null)} className="text-slate-400 hover:text-slate-600 text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SINGLE POST STUDIO & VISUAL GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Creator Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    What do you want to talk about?
                  </label>
                  {topic && (
                    <button
                      type="button"
                      onClick={() => setTopic('')}
                      className="text-[11px] text-slate-400 hover:text-rose-600 font-medium transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Type ANY topic, experience, rough thought, or story (in English, Hindi, or Hinglish)...&#10;&#10;Examples:&#10;• 'Maine ek startup shuru kiya tha jo fail ho gya aur 5 lessons seekhe'&#10;• 'How to negotiate salary when you have competing offers'&#10;• 'Why 90% of team meetings should be an async update'&#10;• 'Real estate investment rules for first-time buyers in their 20s'"
                  className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all leading-relaxed"
                />
                <div className="mt-2 flex items-start gap-2 p-2.5 bg-sky-50/70 border border-sky-100 rounded-xl text-[11px] text-sky-900 leading-snug">
                  <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Universal AI Engine:</span> Write about ANY topic, personal journey, or technical concept in English, Hindi, or Hinglish.
                  </div>
                </div>
              </div>

              {/* Framework Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    High-Reach Framework
                  </label>
                  <span className="text-[10px] text-slate-400">Click to instantly adapt style</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'hook_value_cta', label: 'Hook + Value + CTA' },
                    { id: 'storytelling', label: 'Storytelling Lesson' },
                    { id: 'industry_breakdown', label: 'In-Depth Breakdown' },
                    { id: 'hot_take', label: 'Contrarian Hot Take' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectFramework(item.id as any)}
                      className={`p-2.5 text-xs font-semibold rounded-xl border text-left transition-all ${
                        framework === item.id
                          ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm ring-1 ring-sky-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Voice Tone
                  </label>
                  <span className="text-[10px] text-slate-400">Instant tone adapt</span>
                </div>
                <div className="flex gap-2">
                  {(['conversational', 'authoritative', 'inspiring', 'contrarian'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleSelectTone(t)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize border transition-all ${
                        tone === t
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Image Generation Section */}
              <div className="p-3.5 bg-gradient-to-tr from-slate-50 to-sky-50/50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-sky-600" />
                    <span>Topic-Matched Visual</span>
                  </span>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      onClick={() => {
                        setImageStyle('cinematic_photo')
                        if (imageUrl) handleGenerateImage('cinematic_photo')
                      }}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                        imageStyle === 'cinematic_photo'
                          ? 'bg-sky-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      AI Visual
                    </button>
                    <button
                      onClick={() => {
                        setImageStyle('quote_card')
                        if (imageUrl) handleGenerateImage('quote_card')
                      }}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                        imageStyle === 'quote_card'
                          ? 'bg-sky-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Quote Card
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateImage()}
                  disabled={isGeneratingImage || !topic.trim()}
                  className="w-full py-2 bg-white hover:bg-sky-50 border border-sky-300 text-sky-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-2xs"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-sky-600 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingImage ? 'Synthesizing Visual...' : imageUrl ? 'Regenerate Matching Visual' : 'Generate Matching AI Visual'}</span>
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !topic.trim()}
                className="w-full py-3 bg-gradient-to-r from-linkedin-600 to-sky-500 hover:from-linkedin-700 hover:to-sky-600 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Engineering Post with Gemini...' : 'Generate High-Reach Post'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: LinkedIn Post Mockup Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                LinkedIn Feed Mockup Preview
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handlePublishPost}
                  disabled={isPublishing || !postContent.trim()}
                  className="px-3.5 py-1.5 bg-linkedin-500 hover:bg-linkedin-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-linkedin-500/20 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPublishing ? 'Publishing...' : '🚀 Publish to LinkedIn'}</span>
                </button>
              </div>
            </div>

            {/* Hook Variations Quick-Switcher */}
            {hookVariations.length > 0 && (
              <div className="p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Alternate Scroll-Stopping Hooks:</span>
                  </span>
                  <span className="text-[10px] text-sky-600 font-semibold">Click to swap opening</span>
                </div>
                <div className="space-y-1.5">
                  {hookVariations.map((hook, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSwapHook(hook)}
                      className="w-full text-left p-2 bg-white/90 hover:bg-white border border-sky-200 rounded-xl text-[11px] text-slate-700 hover:text-sky-900 transition-all shadow-2xs hover:shadow-xs flex items-center justify-between group"
                    >
                      <span className="line-clamp-2">"{hook}"</span>
                      <span className="text-[10px] text-sky-600 opacity-0 group-hover:opacity-100 font-bold ml-2 whitespace-nowrap">
                        Use Hook ↵
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Realistic LinkedIn Feed Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
              {/* Author Header */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold flex items-center justify-center shadow-sm">
                  AR
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ankit Raj Sharma</h3>
                  <p className="text-xs text-slate-500 leading-tight">
                    Full Stack Engineer • AI & Scalable Systems Builder
                  </p>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-0.5">
                    <span>Just now</span>
                    <span>•</span>
                    <span>🌐</span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal select-text">
                {postContent}
              </div>

              {/* Topic-Matched AI Image Preview */}
              {imageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-xs group bg-slate-950">
                  <img
                    src={imageUrl}
                    alt="Post Visual"
                    className="w-full h-auto max-h-[420px] object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => setImageUrl(null)}
                      className="px-2 py-1 bg-black/70 hover:bg-black text-white rounded-lg text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* LinkedIn Interaction Mockup */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs font-semibold">
                <button className="flex items-center space-x-1.5 hover:text-linkedin-500 py-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Like</span>
                </button>
                <button className="flex items-center space-x-1.5 hover:text-linkedin-500 py-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>Comment</span>
                </button>
                <button className="flex items-center space-x-1.5 hover:text-linkedin-500 py-1">
                  <Repeat2 className="w-4 h-4" />
                  <span>Repost</span>
                </button>
                <button className="flex items-center space-x-1.5 hover:text-linkedin-500 py-1">
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AUTO-PILOT 30-DAY QUEUE & CALENDAR */}
      {/* ========================================================================= */}
      {activeTab === 'autopilot' && (
        <div className="space-y-6">
          {/* Top Banner: Today's Scheduled Post */}
          {todaysPost && (
            <div className="p-5 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    Today's Scheduled Post (9:30 AM IST)
                  </span>
                  <span className="text-sky-100 text-xs">{todaysPost.scheduledDate}</span>
                </div>
                <h3 className="text-base font-bold line-clamp-1">"{todaysPost.topic}"</h3>
                <p className="text-xs text-sky-100 line-clamp-1">
                  {todaysPost.content ? todaysPost.content.slice(0, 120) + '...' : 'Content ready to generate automatically'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handlePostQueuedNow(todaysPost)}
                  disabled={isPublishing}
                  className="px-4 py-2 bg-white text-sky-900 hover:bg-sky-50 text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  <span>{isPublishing ? 'Publishing...' : '🚀 Post Today\'s Queue Now'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Bulk Input & 30-Day AI Calendar Generator */}
            <div className="lg:col-span-5 space-y-5">
              {/* Option A: AI Calendar Generator */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Auto-Generate Content Calendar</span>
                  </h3>
                  <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md font-semibold">1-Click</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Your Niche, Goal, or Role:
                  </label>
                  <input
                    type="text"
                    value={calendarNiche}
                    onChange={(e) => setCalendarNiche(e.target.value)}
                    placeholder="E.g. Full Stack Engineer, SaaS Founder, Growth Hacker..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Number of Days:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['7', '14', '30'] as const).map((days) => (
                      <button
                        key={days}
                        onClick={() => setCalendarDays(days)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          calendarDays === days
                            ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateBatch}
                  disabled={isScheduling || !calendarNiche.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-linkedin-600 to-sky-500 hover:from-linkedin-700 hover:to-sky-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isScheduling ? 'animate-spin' : ''}`} />
                  <span>{isScheduling ? 'Crafting Calendar with Gemini...' : `🤖 Generate ${calendarDays}-Day Auto-Pilot Plan`}</span>
                </button>
              </div>

              {/* Option B: Custom Bulk Topics Paste */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Paste Custom Topics</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">One topic per line</span>
                </div>

                <textarea
                  rows={5}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Paste your ideas here (1 per line):&#10;Day 1: Why I stopped using Redux&#10;Day 2: How I got my first freelance client&#10;Day 3: 5 mistakes first-time founders make&#10;Day 4: System design tips for junior devs..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 leading-relaxed"
                />

                <button
                  onClick={handleAddCustomTopics}
                  disabled={isScheduling || !bulkInput.trim()}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Topics to Schedule</span>
                </button>
              </div>

              {/* Auto-Pilot Info Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-600">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>How Daily Auto-Posting Works</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  • <strong>Daily 9:30 AM IST Cron:</strong> Powered by GitHub Actions & stealth Playwright.
                </p>
                <p className="text-[11px] leading-relaxed">
                  • <strong>Automatic Visuals:</strong> Every post generates an HD AI visual before publishing.
                </p>
                <p className="text-[11px] leading-relaxed">
                  • <strong>Zero Manual Work:</strong> Just populate your queue and let LinkPilot post automatically every morning.
                </p>
              </div>
            </div>

            {/* Right: Scheduled Timeline Table */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Scheduled Queue ({queue.length} Posts)
                  </h2>
                </div>
                <button
                  onClick={fetchQueue}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Batch Action Banner for Pending Posts */}
              {queue.some((x) => !x.content) && (
                <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>{queue.filter((x) => !x.content).length} Posts Need Full Descriptions & Body</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Auto-generate viral hooks, body paragraphs, takeaways, and CTAs for all pending posts in 1 click.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateAllPending}
                    disabled={isBatchGenerating}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 whitespace-nowrap transition-all disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isBatchGenerating ? 'animate-spin' : ''}`} />
                    <span>
                      {isBatchGenerating
                        ? `Writing Post ${batchProgress.current}/${batchProgress.total}...`
                        : `⚡ Auto-Generate All Full Posts`}
                    </span>
                  </button>
                </div>
              )}

              {queue.length === 0 ? (
                <div className="p-10 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Your Auto-Pilot Queue is Empty</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Use the generator on the left to create a 7, 14, or 30-day content calendar, or paste your custom topics!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {queue.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-3.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                            Day {index + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.scheduledDate} • {item.scheduledTime} IST</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.content
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {item.status === 'published'
                              ? '✅ Published'
                              : item.content
                              ? '✨ Ready with Full Post'
                              : '⏳ Pending Generation'}
                          </span>

                          <button
                            onClick={() => handleDeleteQueueItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Topic Title & Badges */}
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.topic}
                        </h4>
                        <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                          <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 capitalize font-medium">
                            {item.framework.replace(/_/g, ' ')}
                          </span>
                          <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 capitalize font-medium">
                            {item.tone}
                          </span>
                        </div>
                      </div>

                      {/* Post Content / Body Section */}
                      {editingPostId === item.id ? (
                        <div className="p-3 bg-sky-50/50 border border-sky-300 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span className="flex items-center gap-1.5 text-sky-700">
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit Full Post Description
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">{editingContent.length} chars</span>
                          </div>
                          <textarea
                            rows={7}
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-sans leading-relaxed"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save Post</span>
                            </button>
                          </div>
                        </div>
                      ) : item.content ? (
                        <div className="bg-slate-50/90 rounded-xl border border-slate-200/90 p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-sky-600" />
                              <span>Full Post Description ({item.content.length} chars • ~{Math.round(item.content.split(/\s+/).length)} words)</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopyQueueItem(item)}
                                className="text-slate-600 hover:text-sky-600 font-medium flex items-center gap-1 transition-colors"
                                title="Copy post content to clipboard"
                              >
                                {copiedQueueId === item.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="text-slate-600 hover:text-sky-600 font-medium flex items-center gap-1 transition-colors"
                                title="Edit post content"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>

                          {expandedPostIds[item.id] ? (
                            <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans pt-1 border-t border-slate-200/60">
                              {item.content}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-700 line-clamp-3 leading-relaxed font-sans pt-1">
                              {item.content}
                            </div>
                          )}

                          <button
                            onClick={() => handleToggleExpand(item.id)}
                            className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 pt-1 transition-colors"
                          >
                            {expandedPostIds[item.id] ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" />
                                <span>Collapse Post</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" />
                                <span>Read Full Post & Takeaways ({item.content.split('\n\n').length} sections)</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Full post description & body pending</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-700 leading-relaxed">
                            Topic headline is scheduled. Click below to write the complete scroll-stopping viral hook, body points, takeaway, and CTA with Gemini AI.
                          </p>
                          <button
                            onClick={() => handlePrepareQueueItem(item)}
                            disabled={preparingItemId === item.id}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${preparingItemId === item.id ? 'animate-spin' : ''}`} />
                            <span>
                              {preparingItemId === item.id ? 'Writing Full Post with Gemini...' : '✨ Generate Full Post Body & Visual Now'}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Row Actions & Thumbnail */}
                      <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          {item.imageUrl ? (
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-9 rounded-md overflow-hidden border border-slate-200 shrink-0 bg-slate-900">
                                <img src={item.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Visual attached</span>
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">No visual attached</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {!item.content && (
                            <button
                              onClick={() => handlePrepareQueueItem(item)}
                              disabled={preparingItemId === item.id}
                              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <Sparkles className={`w-3 h-3 ${preparingItemId === item.id ? 'animate-spin' : ''}`} />
                              <span>{preparingItemId === item.id ? 'Writing...' : 'Write Full Post'}</span>
                            </button>
                          )}

                          {item.content && !item.imageUrl && (
                            <button
                              onClick={() => handlePrepareQueueItem(item)}
                              disabled={preparingItemId === item.id}
                              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>{preparingItemId === item.id ? 'Generating Visual...' : 'Add Visual'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handlePostQueuedNow(item)}
                            disabled={isPublishing}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50 shadow-2xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>Post Now</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
