'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Send,
  UserCheck,
  TrendingUp,
  Shield,
  Clock,
  Play,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

export default function DashboardOverview() {
  const [isRunning, setIsRunning] = useState(false)
  const [botStatusMessage, setBotStatusMessage] = useState<string | null>(null)

  const handleTriggerBot = async (dryRun: boolean) => {
    setIsRunning(true)
    setBotStatusMessage(`🚀 Bot triggered in ${dryRun ? 'Dry-Run Simulation' : 'Live Safe'} mode...`)

    try {
      const res = await fetch('/api/trigger-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, batchLimit: 3 }),
      })
      const data = await res.json()
      if (data.success) {
        setBotStatusMessage(`✅ Run finished: Processed ${data.processed} leads safely!`)
      } else {
        setBotStatusMessage(`⚠️ Notice: ${data.message || data.error}`)
      }
    } catch (err: any) {
      setBotStatusMessage(`❌ Error starting bot: ${err.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Welcome & Safety Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-sky-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-semibold mb-3 border border-sky-100">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>AI Growth Copilot Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, Ankit! 👋
            </h1>
            <p className="mt-1 text-slate-500 text-sm sm:text-base max-w-2xl">
              Your autonomous networking engine is actively monitoring limits. All outreach actions are staggered with human delays to protect your profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleTriggerBot(true)}
              disabled={isRunning}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 text-slate-500" />
              <span>Test Dry-Run</span>
            </button>
            <button
              onClick={() => handleTriggerBot(false)}
              disabled={isRunning}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-linkedin-500 hover:bg-linkedin-600 text-white text-sm font-semibold rounded-xl shadow-sm shadow-linkedin-500/30 transition-all disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              <span>{isRunning ? 'Processing...' : 'Run Safe Batch (Live)'}</span>
            </button>
          </div>
        </div>

        {botStatusMessage && (
          <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 flex items-center justify-between animate-fade-in">
            <span>{botStatusMessage}</span>
            <button onClick={() => setBotStatusMessage(null)} className="text-xs text-slate-400 hover:text-slate-600">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Quota</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">7 / 15</span>
            <span className="text-xs font-medium text-emerald-600">Safe Range</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '46%' }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leads Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">48</span>
            <span className="text-xs font-medium text-sky-600">+12 Discovered</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">14 awaiting approval in studio</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Acceptance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">41.8%</span>
            <span className="text-xs font-medium text-indigo-600">Top 10% benchmark</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Industry avg is ~18-22%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Human Delay</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">82s</span>
            <span className="text-xs font-medium text-amber-600">Random Jitter</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Min 45s • Max 130s interval</p>
        </div>
      </div>

      {/* Two Column Layout: Pipeline Overview & Fast Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Funnel & AI Lead Review CTA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900">Outreach Conversion Funnel</h2>
              <Link href="/leads" className="text-xs font-semibold text-linkedin-500 hover:text-linkedin-600 flex items-center space-x-1">
                <span>Open Lead Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>1. Discovered by Criteria</span>
                  <span className="font-bold text-slate-900">48 profiles</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-sky-500 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>2. Approved & Queued (AI Notes Ready)</span>
                  <span className="font-bold text-slate-900">34 profiles (70%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '70%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>3. Invites Sent with Human Delays</span>
                  <span className="font-bold text-slate-900">22 sent (45%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>4. Connections Accepted</span>
                  <span className="font-bold text-slate-900">11 connected (23%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '23%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>5. Conversations & Referrals Triggered</span>
                  <span className="font-bold text-slate-900">6 positive responses</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/posts"
              className="group p-5 bg-gradient-to-br from-white to-sky-50/50 rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Write Viral Post</h3>
              <p className="mt-1 text-xs text-slate-500">
                Generate high-reach hooks, storytelling posts, and CTAs using Gemini.
              </p>
            </Link>

            <Link
              href="/bot"
              className="group p-5 bg-gradient-to-br from-white to-emerald-50/50 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Safety & Bot Settings</h3>
              <p className="mt-1 text-xs text-slate-500">
                Adjust jitter seconds, daily connection limits, and working hours.
              </p>
            </Link>
          </div>
        </div>

        {/* Right Column: Recent Activity Logs Preview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Live Safety Stream</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-1.5 text-emerald-600 font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connection Invite Sent</span>
                </div>
                <p className="text-slate-600">Priya Sharma (Microsoft) with personalized 240-char note.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">18 mins ago</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-1.5 text-amber-600 font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Human Jitter Cooldown</span>
                </div>
                <p className="text-slate-600">Paused for 94 seconds to mimic human reading behavior.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">22 mins ago</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-1.5 text-sky-600 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Note Generated</span>
                </div>
                <p className="text-slate-600">Drafted tailored recommendation note for Rajesh Verma.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">1 hour ago</span>
              </div>
            </div>

            <Link
              href="/bot"
              className="mt-4 block text-center text-xs font-semibold text-slate-500 hover:text-slate-700 py-2 border-t border-slate-100"
            >
              View Full Audit Logs →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
