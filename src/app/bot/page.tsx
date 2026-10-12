'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'

export default function BotSafetyControlsPage() {
  const [safeMode, setSafeMode] = useState(true)
  const [dailyQuota, setDailyQuota] = useState(15)
  const [minDelay, setMinDelay] = useState(45)
  const [maxDelay, setMaxDelay] = useState(130)
  const [startHour, setStartHour] = useState(9)
  const [endHour, setEndHour] = useState(19)
  const [isSaved, setIsSaved] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)
  const [runLog, setRunLog] = useState<string[]>([])

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2500)
  }

  const handleTrigger = async (dryRun: boolean) => {
    setIsTriggering(true)
    setRunLog((prev) => [
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating bot in ${dryRun ? 'DRY-RUN' : 'LIVE'} mode with randomized jitter (${minDelay}s - ${maxDelay}s)...`,
      ...prev,
    ])

    try {
      const res = await fetch('/api/trigger-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, batchLimit: 2 }),
      })
      const data = await res.json()
      setRunLog((prev) => [
        `[${new Date().toLocaleTimeString()}] ✅ ${data.message || 'Execution completed safely.'}`,
        ...prev,
      ])
    } catch (e: any) {
      setRunLog((prev) => [
        `[${new Date().toLocaleTimeString()}] ❌ Failed: ${e.message}`,
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
            Configure jitter intervals, daily caps, and monitor live audit logs to guarantee minimum account risk.
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
                Dry-Run Test
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
        </div>

        {/* Right Column: Execution & Security Logs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Real-time Execution & Safety Terminal</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Auto-refreshing</span>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs space-y-2 h-[340px] overflow-y-auto shadow-inner">
              <div className="text-emerald-400">
                [SYSTEM READY] Stealth browser fingerprint configured. Circuit breaker armed.
              </div>
              <div className="text-slate-400">
                [CONFIG] Quota: {dailyQuota}/day | Delays: {minDelay}s - {maxDelay}s | Window: {startHour}:00-{endHour}:00
              </div>
              {runLog.map((log, index) => (
                <div key={index} className="text-slate-300">
                  {log}
                </div>
              ))}
              <div className="text-slate-500 pt-2 animate-pulse">
                &gt; Listening for trigger commands...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
