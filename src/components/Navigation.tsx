'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  PenTool,
  ShieldCheck,
  Bot,
  Sparkles,
} from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Lead Studio', href: '/leads', icon: Users },
    { label: 'AI Post Studio', href: '/posts', icon: PenTool },
    { label: 'Bot & Safety Controls', href: '/bot', icon: Bot },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-linkedin-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">
                  LinkPilot <span className="text-linkedin-500">AI</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-700 rounded-full border border-sky-100">
                  Stealth Edition
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-linkedin-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-700 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="hidden sm:inline">Safe Jitter Active</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
