export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Campaign {
  id: string
  name: string
  target_role: string
  target_industry?: string | null
  target_location?: string | null
  goal_type: 'networking' | 'referral' | 'recommendation' | 'mentorship'
  status: 'active' | 'paused' | 'completed'
  daily_limit: number
  user_context?: string | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  campaign_id?: string | null
  full_name: string
  headline?: string | null
  company?: string | null
  location?: string | null
  profile_url: string
  status: 'discovered' | 'approved' | 'queued' | 'invite_sent' | 'connected' | 'messaged' | 'replied' | 'rejected'
  generated_note?: string | null
  generated_followup?: string | null
  connection_sent_at?: string | null
  connected_at?: string | null
  notes?: string | null
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  lead_id: string
  sender_type: 'user' | 'lead' | 'bot'
  content: string
  intent_detected?: 'positive' | 'neutral' | 'negative' | 'referral_offered' | 'more_info_needed' | null
  sent_at: string
}

export interface Post {
  id: string
  topic: string
  content: string
  framework: 'hook_value_cta' | 'storytelling' | 'industry_breakdown' | 'hot_take' | 'carousel_concept'
  status: 'draft' | 'scheduled' | 'published'
  scheduled_at?: string | null
  published_at?: string | null
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
}

export interface BotSettings {
  id: string
  user_id: string
  max_daily_connections: number
  max_daily_messages: number
  min_delay_seconds: number
  max_delay_seconds: number
  typing_speed_min_ms: number
  typing_speed_max_ms: number
  working_hours_start: number
  working_hours_end: number
  safe_mode_enabled: boolean
  human_jitter_enabled: boolean
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  action_type: string
  lead_id?: string | null
  status: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: Record<string, any>
  created_at: string
}
