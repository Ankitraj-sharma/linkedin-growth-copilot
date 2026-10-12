import type { Metadata } from 'next'
import './globals.css'
import { Navigation } from '../components/Navigation'

export const metadata: Metadata = {
  title: 'LinkPilot AI - Safe LinkedIn Growth & Networking Copilot',
  description: 'Controlled human-delay LinkedIn growth engine powered by Supabase and Google Gemini AI.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
