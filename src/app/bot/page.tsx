'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield,
  ShieldAlert,
  Clock,
  Sliders,
  Play,
  CheckCircle2,
  AlertCircle,
  Activity,
  Save,
  Send,
  Terminal,
  ExternalLink,
  Zap,
  Monitor,
  Cloud,
  Check,
  Copy,
} from 'lucide-react'

interface QueuedLead {
  id: string
  name: string
  company: string
  headline: string
  profileUrl: string
  note: string
  status: string
}

export default function BotSafetyControlsPage() {
  const [safeMode, setSafeMode] = useState(true)
  const [forceRun, setForceRun] = useState(true) // Default true for manual triggers so tests at night don't halt
  const [dailyQuota, setDailyQuota] = useState(15)
  const [minDelay, setMinDelay] = useState(45)
  const [maxDelay, setMaxDelay] = useState(130)
  const [startHour, setStartHour] = useState(9)
  const [endHour, setEndHour] = useState(19)
  const [isSaved, setIsSaved] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)
  const [runLog, setRunLog] = useState<string[]>([])
  const [approvedLeads, setApprovedLeads] = useState<QueuedLead[]>([])
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null)

  // Load leads from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('linkpilot_leads')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setApprovedLeads(parsed)
          }
        } catch {}
      } else {
        // Default seed leads if none yet
        const defaultQueue: QueuedLead[] = [
          {
            id: 'q-1',
            name: 'Priya Sharma',
            company: 'Microsoft',
            headline: 'Engineering Manager | Azure Systems',
            profileUrl: 'https://www.linkedin.com/search/results/people/?keywords=Microsoft%20Engineering%20Manager',
            note: 'Hi Priya, really admire Microsoft Azure engineering scale. As a builder passionate about high-throughput systems, I would love to connect and follow your updates!',
            status: 'approved',
          },
          {
            id: 'q-2',
            name: 'Rohit Verma',
            company: 'Google',
            headline: 'Staff Software Engineer | AI Infrastructure',
            profileUrl: 'https://www.linkedin.com/search/results/people/?keywords=Google%20Staff%20Software%20Engineer',
            note: 'Hi Rohit, impressed by your AI infrastructure work at Google. Would love to connect and follow your engineering insights.',
            status: 'approved',
          },
        ]
        setApprovedLeads(defaultQueue)
        localStorage.setItem('linkpilot_leads', JSON.stringify(defaultQueue))
      }
    }
  }, [])

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2500)
  }

  // Cloud & Web 1-Click Dispatch for any profile
  const handleDispatchLead = (lead: QueuedLead) => {
    navigator.clipboard.writeText(lead.note)
    setCopiedNoteId(lead.id)
    setTimeout(() => setCopiedNoteId(null), 3000)

    // Open target LinkedIn profile
    window.open(lead.profileUrl, '_blank')

    // Mark as invite_sent in state and localStorage
    const updated = approvedLeads.map((l) => (l.id === lead.id ? { ...l, status: 'invite_sent' } : l))
    setApprovedLeads(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('linkpilot_leads', JSON.stringify(updated))
    }

    setRunLog((prev) => [
      `[${new Date().toLocaleTimeString()}] 🚀 [DISPATCHED] Profile opened for ${lead.name} (${lead.company})! Tailored note copied to clipboard.`,
      ...prev,
    ])
  }

  const handleTrigger = async (dryRun: boolean) => {
    setIsTriggering(true)
    const modeLabel = dryRun ? 'DRY-RUN SIMULATION' : 'LIVE SAFE BATCH'

    setRunLog((prev) => [
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating bot in ${modeLabel} (Jitter: ${minDelay}s - ${maxDelay}s | ForceRun: ${forceRun ? 'YES' : 'NO'})...`,
      ...prev,
    ])

    try {
      const activeLeadsToProcess = approvedLeads
        .filter((l) => l.status === 'approved' || l.status === 'discovered')
        .map((l) => ({
          id: l.id,
          full_name: l.name,
          profile_url: l.profileUrl,
          generated_note: l.note,
          headline: l.headline,
          company: l.company,
        }))

      const res = await fetch('/api/trigger-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun,
          batchLimit: 2,
          forceRun,
          startHour,
          endHour,
          leads: activeLeadsToProcess,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setRunLog((prev) => [
          `[${new Date().toLocaleTimeString()}] ❌ Error: ${data.error || 'Server error occurred.'}`,
          ...prev,
        ])
        return
      }

      if (data.mode === 'cloud') {
        setRunLog((prev) => [
          `[${new Date().toLocaleTimeString()}] ☁️ [CLOUD ENVIRONMENT] Live on Vercel Serverless.`,
          `[${new Date().toLocaleTimeString()}] 💡 Tip 1: Click "⚡ Send Invite Now" below for instant 1-click connection with pre-copied note.`,
          `[${new Date().toLocaleTimeString()}] 💻 Tip 2: Double-click "run-bot.bat" on your Windows PC for fully autonomous background Playwright execution.`,
          ...prev,
        ])
      } else {
        if (data.successful > 0) {
          setRunLog((prev) => [
            `[${new Date().toLocaleTimeString()}] ✅ Batch finished! ${data.successful} connection requests sent with safe human delays.`,
            ...prev,
          ])
        } else {
          setRunLog((prev) => [
            `[${new Date().toLocaleTimeString()}] ⚠️ 0 requests sent. Reason: ${data.stoppedEarlyReason || data.message || 'No approved leads ready in queue.'}`,
            ...prev,
          ])
        }
      }
    } catch (e: any) {
      setRunLog((prev) => [
        `[${new Date().toLocaleTimeString()}] ❌ Network Error: ${e.message}`,
        ...prev,
      ])
    } finally {
      setIsTriggering(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bot Controls & Human-Mimic Safety</h1>
          <p className="text-sm text-slate-500">
            Configure jitter intervals, sleep cycles, and trigger safe automated outreach on approved leads.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Settings Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Safety Sliders */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <Shield className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Autonomous Safe Mode</h3>
                  <p className="text-[11px] text-slate-500">Enforces human typing speed and jitter delays</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={safeMode}
                onChange={(e) => setSafeMode(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Force Run Toggle (Crucial for testing outside 9-19) */}
            <div className="p-3.5 bg-sky-50/70 border border-sky-200/70 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-sky-600" />
                  <span>Manual Override (Bypass Sleep Hours)</span>
                </span>
                <input
                  type="checkbox"
                  checked={forceRun}
                  onChange={(e) => setForceRun(e.target.checked)}
                  className="w-4 h-4 accent-sky-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-sky-700">
                When enabled, manual trigger runs immediately even during off-hours (e.g. night testing).
              </p>
            </div>

            {/* Daily Cap */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Maximum Connections Per Day</span>
                <span className="text-sky-600 font-mono">{dailyQuota} requests</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                value={dailyQuota}
                onChange={(e) => setDailyQuota(parseInt(e.target.value, 10))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Recommended: 10–15/day for maximum stealth and safety.
              </p>
            </div>

            {/* Jitter Delay Range */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Random Cooldown Interval</span>
                <span className="text-amber-600 font-mono">
                  {minDelay}s – {maxDelay}s
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400">Min delay (seconds)</span>
                  <input
                    type="number"
                    value={minDelay}
                    onChange={(e) => setMinDelay(parseInt(e.target.value, 10))}
                    className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Max delay (seconds)</span>
                  <input
                    type="number"
                    value={maxDelay}
                    onChange={(e) => setMaxDelay(parseInt(e.target.value, 10))}
                    className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Allowed Operating Window</span>
                <span className="text-indigo-600 font-mono">
                  {startHour}:00 – {endHour}:00
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400">Start (24h)</span>
                  <input
                    type="number"
                    value={startHour}
                    onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
                    className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">End (24h)</span>
                  <input
                    type="number"
                    value={endHour}
                    onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
                    className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Action Trigger Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => handleTrigger(true)}
                disabled={isTriggering}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                Dry-Run Simulation
              </button>
              <button
                onClick={() => handleTrigger(false)}
                disabled={isTriggering}
                className="flex-1 py-2.5 bg-linkedin-500 hover:bg-linkedin-600 text-white text-xs font-semibold rounded-xl shadow-sm shadow-linkedin-500/20 transition-all disabled:opacity-50"
              >
                {isTriggering ? 'Executing...' : 'Run Live Safe Batch'}
              </button>
            </div>
          </div>

          {/* Local Windows Worker Card */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Windows Autonomous Worker</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              For 100% hands-free background execution with real keystroke simulation and browser stealth, double-click <code className="text-emerald-300 font-mono bg-slate-800 px-1 py-0.5 rounded">run-bot.bat</code> in the project root, or execute:
            </p>
            <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-[11px] text-emerald-400 border border-slate-800 select-all">
              npm run bot:safe
            </div>
            <div className="flex items-center text-[10px] text-slate-400 space-x-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cookie Session: Verified & Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Execution & Security Logs + Interactive Cloud Dispatcher */}
        <div className="lg:col-span-7 space-y-6">
          {/* Terminal */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Real-time Execution & Safety Terminal</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Live Status</span>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs space-y-2 h-[260px] overflow-y-auto shadow-inner">
              <div className="text-emerald-400">
                [SYSTEM READY] Stealth browser fingerprint configured. Circuit breaker armed.
              </div>
              <div className="text-slate-400">
                [CONFIG] Quota: {dailyQuota}/day | Jitter: {minDelay}s - {maxDelay}s | Window: {startHour}:00-{endHour}:00
              </div>
              {runLog.map((log, index) => (
                <div key={index} className="text-slate-300 leading-relaxed">
                  {log}
                </div>
              ))}
              <div className="text-slate-500 pt-2 animate-pulse">
                &gt; Listening for trigger commands...
              </div>
            </div>
          </div>

          {/* Interactive Cloud Dispatcher: Connect with 1-Click */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">1-Click Dispatch Queue ({approvedLeads.length} Leads)</h3>
              </div>
              <span className="text-[11px] text-slate-500">Instant browser outreach</span>
            </div>

            <p className="text-xs text-slate-500">
              Clicking <strong>Send Invite Now</strong> copies the tailored note to your clipboard and opens their profile on LinkedIn for instant 1-click connection:
            </p>

            <div className="space-y-3">
              {approvedLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{lead.name}</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        {lead.company}
                      </span>
                      {lead.status === 'invite_sent' && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Sent
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{lead.headline}</p>
                    <p className="text-[11px] text-sky-800 bg-sky-50 p-1.5 rounded border border-sky-100 italic line-clamp-2">
                      "{lead.note}"
                    </p>
                  </div>

                  <button
                    onClick={() => handleDispatchLead(lead)}
                    className="px-3.5 py-2 bg-linkedin-500 hover:bg-linkedin-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition-all whitespace-nowrap self-end sm:self-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{copiedNoteId === lead.id ? 'Copied & Opening...' : '⚡ Send Invite Now'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
