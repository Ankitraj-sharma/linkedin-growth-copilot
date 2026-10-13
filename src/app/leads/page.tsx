'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Sparkles,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  Shield,
  Send,
  RefreshCw,
  Search,
  PlusCircle,
  Briefcase,
  CheckCircle2,
} from 'lucide-react'

interface LeadCard {
  id: string
  name: string
  headline: string
  company: string
  location: string
  profileUrl: string
  status: 'discovered' | 'approved' | 'invite_sent' | 'connected'
  note: string
  followup: string
}

export default function LeadStudioPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'discovered' | 'approved' | 'invite_sent'>('all')
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [isSearchingLeads, setIsSearchingLeads] = useState(false)
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null)

  // Multi-User Profile State
  const [userProfile, setUserProfile] = useState({
    fullName: 'Ankitraj Sharma',
    currentRole: 'Full Stack Engineer (React, TypeScript & Node.js)',
    targetRole: 'Senior Full Stack / SDE-2',
    goal: 'referral' as 'networking' | 'referral' | 'recommendation' | 'mentorship',
  })
  const [showProfileSettings, setShowProfileSettings] = useState(true) // Open by default for clarity
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')

  // Quick Add Custom Lead State
  const [showAddModal, setShowAddModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCompany, setCustomCompany] = useState('')
  const [customHeadline, setCustomHeadline] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [isAddingCustom, setIsAddingCustom] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('gemini_api_key')
      if (savedKey) setApiKey(savedKey)

      const savedPersona = localStorage.getItem('user_persona')
      if (savedPersona) {
        try {
          setUserProfile(JSON.parse(savedPersona))
        } catch {}
      }
    }
  }, [])

  const handleUpdatePersona = (field: string, val: string) => {
    const updated = { ...userProfile, [field]: val }
    setUserProfile(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_persona', JSON.stringify(updated))
    }
  }

  const [leads, setLeads] = useState<LeadCard[]>([
    {
      id: 'lead-1',
      name: 'Priya Sharma',
      headline: 'Engineering Manager at Microsoft | Azure Distributed Systems & Kubernetes',
      company: 'Microsoft',
      location: 'Bengaluru, India',
      profileUrl: 'https://linkedin.com/in/sample-priya-sharma',
      status: 'approved',
      note: 'Hi Priya, really admire Microsoft’s Azure engineering scale. As a Senior Full Stack / SDE-2 focused on high-throughput systems, I would love to connect and keep in touch regarding future engineering roles!',
      followup: 'Hi Priya, thanks for connecting! I really admire Microsoft’s cloud tooling. If your team is exploring builders with deep React & distributed systems experience, I would love to share my portfolio.',
    },
    {
      id: 'lead-2',
      name: 'Rohit Verma',
      headline: 'Staff Software Engineer at Google | AI Infrastructure & High-Performance Go',
      company: 'Google',
      location: 'Hyderabad, India',
      profileUrl: 'https://linkedin.com/in/sample-rohit-verma',
      status: 'discovered',
      note: 'Hi Rohit, impressed by your AI infrastructure work at Google. I have been building scalable services and would love to connect to follow your technical insights!',
      followup: 'Hi Rohit, thanks for connecting! I loved your recent thoughts on model orchestration. Would love to pick your brain on distributed architecture if you ever have 5 minutes.',
    },
    {
      id: 'lead-3',
      name: 'Ananya Deshmukh',
      headline: 'Tech Recruiter & Talent Lead at Stripe | Hiring Senior Engineers',
      company: 'Stripe',
      location: 'Remote / India',
      profileUrl: 'https://linkedin.com/in/sample-ananya-deshmukh',
      status: 'discovered',
      note: 'Hi Ananya, noticed your technical talent initiatives at Stripe. I am an experienced Senior Full Stack engineer open to high-impact product engineering roles. Would love to connect!',
      followup: 'Hi Ananya, glad to be connected! If Stripe is currently hiring for senior full-stack roles in APAC/remote, I would love to share my resume and relevant projects.',
    },
  ])

  // Discover & Recommend Leads specifically for the selected targetRole
  const handleSearchLeadsForRole = async () => {
    setIsSearchingLeads(true)
    setSearchFeedback(`🔍 Searching & recommending top connections for "${userProfile.targetRole}"...`)

    try {
      const res = await fetch('/api/discover-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: userProfile.targetRole,
          currentRole: userProfile.currentRole,
          goal: userProfile.goal,
          apiKey,
          user: userProfile,
        }),
      })

      const data = await res.json()
      if (data.success && data.leads?.length) {
        setLeads(data.leads)
        setSearchFeedback(`✅ Found ${data.leads.length} hiring leaders & engineers for "${userProfile.targetRole}" with custom AI notes!`)
      } else {
        setSearchFeedback(`⚠️ ${data.error || 'Could not find leads. Please try again.'}`)
      }
    } catch (e: any) {
      setSearchFeedback(`❌ Search failed: ${e.message}`)
    } finally {
      setIsSearchingLeads(false)
    }
  }

  const handleApprove = (id: string) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status: 'approved' } : lead))
    )
  }

  const handleReject = (id: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id))
  }

  const handleRegenerateNote = async (leadId: string) => {
    setIsGenerating(leadId)
    const targetLead = leads.find((l) => l.id === leadId)
    if (!targetLead) return

    try {
      const res = await fetch('/api/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: {
            fullName: targetLead.name,
            headline: targetLead.headline,
            company: targetLead.company,
          },
          user: userProfile,
          goal: userProfile.goal,
          apiKey,
        }),
      })
      const data = await res.json()
      if (data.note) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, note: data.note, followup: data.followup || l.followup } : l))
        )
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(null)
    }
  }

  const handleCopyAndOpen = (lead: LeadCard) => {
    navigator.clipboard.writeText(lead.note)
    setCopiedId(lead.id)
    setTimeout(() => setCopiedId(null), 3000)
    window.open(lead.profileUrl, '_blank')
  }

  const handleAddCustomLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName.trim()) return

    setIsAddingCustom(true)
    try {
      const leadContext = {
        fullName: customName,
        headline: customHeadline || `${userProfile.targetRole} Lead`,
        company: customCompany || 'Tech Company',
      }

      const res = await fetch('/api/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: leadContext,
          user: userProfile,
          goal: userProfile.goal,
          apiKey,
        }),
      })
      const data = await res.json()

      const newLead: LeadCard = {
        id: `custom-${Date.now()}`,
        name: customName,
        headline: customHeadline || `${userProfile.targetRole} Leader`,
        company: customCompany || 'Company',
        location: 'LinkedIn Profile',
        profileUrl: customUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(customName)}`,
        status: 'approved',
        note: data.note || `Hi ${customName.split(' ')[0]}, would love to connect regarding ${userProfile.targetRole}!`,
        followup: data.followup || `Hi ${customName.split(' ')[0]}, thanks for connecting!`,
      }

      setLeads([newLead, ...leads])
      setCustomName('')
      setCustomCompany('')
      setCustomHeadline('')
      setCustomUrl('')
      setShowAddModal(false)
    } finally {
      setIsAddingCustom(false)
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesFilter = selectedFilter === 'all' || lead.status === selectedFilter
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.headline.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Studio & AI Personalization</h1>
          <p className="text-sm text-slate-500">
            Automatically discover & recommend targeted connections matching your role with custom psychological notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>Add Custom Profile</span>
          </button>

          <button
            onClick={() => setShowProfileSettings(!showProfileSettings)}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>{showProfileSettings ? 'Hide Persona Settings' : 'Edit My Persona'}</span>
          </button>
        </div>
      </div>

      {/* Multi-User Persona Customizer Drawer with Dynamic Lead Search */}
      {showProfileSettings && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-2xl border border-slate-700 shadow-xl space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-sky-400" />
                <span>Your Professional Persona & Target Role</span>
              </h3>
              <p className="text-xs text-slate-400">
                Type your role below. When you click Search, we automatically find and recommend matching decision makers!
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 bg-sky-500/20 text-sky-300 rounded-full border border-sky-400/30 w-fit">
              Dynamic Role Matcher Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Your Full Name</label>
              <input
                type="text"
                value={userProfile.fullName}
                onChange={(e) => handleUpdatePersona('fullName', e.target.value)}
                className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Your Current Role / Skills</label>
              <input
                type="text"
                value={userProfile.currentRole}
                onChange={(e) => handleUpdatePersona('currentRole', e.target.value)}
                placeholder="e.g. Full Stack Engineer (React, Node.js)"
                className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Role Seeking</label>
              <input
                type="text"
                value={userProfile.targetRole}
                onChange={(e) => handleUpdatePersona('targetRole', e.target.value)}
                placeholder="e.g. AI Engineer, Senior SDE-2, DevOps..."
                className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-400 font-semibold text-sky-300"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Outreach Goal</label>
              <select
                value={userProfile.goal}
                onChange={(e) => handleUpdatePersona('goal', e.target.value)}
                className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-400"
              >
                <option value="referral">Job Referral / Hiring</option>
                <option value="recommendation">Recommendation / Endorsement</option>
                <option value="networking">Peer Networking</option>
                <option value="mentorship">Mentorship</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Persona automatically adjusts note psychology & company relevance</span>
            </div>

            <button
              onClick={handleSearchLeadsForRole}
              disabled={isSearchingLeads}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
            >
              <Search className={`w-3.5 h-3.5 ${isSearchingLeads ? 'animate-spin' : ''}`} />
              <span>{isSearchingLeads ? 'Searching & Generating Notes...' : `🔍 Search Leads for "${userProfile.targetRole}"`}</span>
            </button>
          </div>
        </div>
      )}

      {searchFeedback && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs font-medium text-sky-800 flex items-center justify-between animate-fade-in">
          <span>{searchFeedback}</span>
          <button onClick={() => setSearchFeedback(null)} className="text-slate-400 hover:text-slate-600 text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {(['all', 'discovered', 'approved', 'invite_sent'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                selectedFilter === filter
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, company, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 gap-5">
        {filteredLeads.map((lead) => {
          const charCount = lead.note.length
          const isOverLimit = charCount > 295

          return (
            <div
              key={lead.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm transition-all hover:border-slate-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Lead Profile Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-sm">
                      {lead.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base font-bold text-slate-900">{lead.name}</h2>
                        <a
                          href={lead.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-linkedin-500"
                          title="Open LinkedIn profile"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <p className="text-xs font-semibold text-linkedin-600">{lead.company}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{lead.headline}</p>
                  <p className="text-[11px] text-slate-400">{lead.location}</p>
                </div>

                {/* Status Badge */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      lead.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : lead.status === 'invite_sent'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}
                  >
                    {lead.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* AI-Generated Outreach Note Box */}
              <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Personalized Connection Note (LinkedIn max 300 chars)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        isOverLimit ? 'text-red-500 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {charCount}/300
                    </span>
                    <button
                      onClick={() => handleRegenerateNote(lead.id)}
                      disabled={isGenerating === lead.id}
                      className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center space-x-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isGenerating === lead.id ? 'animate-spin' : ''}`} />
                      <span>{isGenerating === lead.id ? 'Writing...' : 'Re-generate'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 font-normal leading-relaxed">
                  "{lead.note}"
                </p>

                {/* Follow-up preview */}
                <details className="text-xs text-slate-500 cursor-pointer">
                  <summary className="font-medium text-slate-600 hover:text-slate-900">
                    View Automated Follow-Up (After Connected)
                  </summary>
                  <p className="mt-2 p-3 bg-white rounded-lg border border-slate-200 text-slate-600 italic">
                    "{lead.followup}"
                  </p>
                </details>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  onClick={() => handleReject(lead.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dismiss</span>
                </button>

                {/* Instant 1-Click Send for Anyone on Web */}
                <button
                  onClick={() => handleCopyAndOpen(lead)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl transition-all flex items-center space-x-1.5 shadow-sm"
                  title="Copies note to clipboard and opens LinkedIn profile"
                >
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  <span>{copiedId === lead.id ? 'Copied! Opening Tab...' : 'Copy Note & Open Profile'}</span>
                </button>

                {lead.status === 'discovered' && (
                  <button
                    onClick={() => handleApprove(lead.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve for Bot</span>
                  </button>
                )}

                {lead.status === 'approved' && (
                  <div className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Queued for Controlled Bot</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Custom Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Custom LinkedIn Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomLeadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Satya Nadella"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  placeholder="e.g. Microsoft"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Headline / Role</label>
                <input
                  type="text"
                  placeholder="e.g. VP of Engineering"
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingCustom || !customName.trim()}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isAddingCustom ? 'Generating Note...' : 'Add & Generate Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
