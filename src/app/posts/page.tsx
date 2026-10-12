'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'

export default function PostStudioPage() {
  const [topic, setTopic] = useState('Why architecture fundamentals beat learning 10 new frameworks every year')
  const [framework, setFramework] = useState<'hook_value_cta' | 'storytelling' | 'industry_breakdown' | 'hot_take'>('hook_value_cta')
  const [tone, setTone] = useState<'conversational' | 'authoritative' | 'inspiring' | 'contrarian'>('conversational')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, framework, tone }),
      })
      const data = await res.json()
      if (data.content) {
        setPostContent(data.content)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(postContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Post Studio & Reach Engine</h1>
          <p className="text-sm text-slate-500">
            Generate high-engagement LinkedIn posts engineered for organic reach, comments, and visibility.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Creator Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                What do you want to talk about?
              </label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g. System design lessons from handling high traffic, or How junior devs should prepare for interviews..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                High-Reach Framework
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'hook_value_cta', label: 'Hook + Value + CTA' },
                  { id: 'storytelling', label: 'Storytelling Lesson' },
                  { id: 'industry_breakdown', label: 'Tech Breakdown' },
                  { id: 'hot_take', label: 'Contrarian Hot Take' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFramework(item.id as any)}
                    className={`p-2.5 text-xs font-semibold rounded-xl border text-left transition-all ${
                      framework === item.id
                        ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Voice Tone
              </label>
              <div className="flex gap-2">
                {(['conversational', 'authoritative', 'inspiring', 'contrarian'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize border transition-all ${
                      tone === t
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
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
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              LinkedIn Feed Mockup Preview
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Post'}</span>
              </button>
            </div>
          </div>

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
    </div>
  )
}
