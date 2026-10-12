-- ==============================================================================
-- LinkedIn Growth Copilot - Complete Database Schema for Supabase
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    target_role VARCHAR(255) NOT NULL,
    target_industry VARCHAR(255),
    target_location VARCHAR(255),
    goal_type VARCHAR(50) DEFAULT 'networking' CHECK (goal_type IN ('networking', 'referral', 'recommendation', 'mentorship')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    daily_limit INTEGER DEFAULT 15,
    user_context TEXT, -- Context about the user (e.g. "Fullstack engineer looking for SDE-2 referrals")
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    headline TEXT,
    company VARCHAR(255),
    location VARCHAR(255),
    profile_url TEXT NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'discovered' CHECK (status IN ('discovered', 'approved', 'queued', 'invite_sent', 'connected', 'messaged', 'replied', 'rejected')),
    generated_note VARCHAR(300), -- LinkedIn 300-char connection note limit
    generated_followup TEXT,     -- Long-form follow-up for referral / recommendation
    connection_sent_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MESSAGES THREAD TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'lead', 'bot')),
    content TEXT NOT NULL,
    intent_detected VARCHAR(50) CHECK (intent_detected IN ('positive', 'neutral', 'negative', 'referral_offered', 'more_info_needed')),
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VIRAL CONTENT & POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    framework VARCHAR(50) DEFAULT 'hook_value_cta' CHECK (framework IN ('hook_value_cta', 'storytelling', 'industry_breakdown', 'hot_take', 'carousel_concept')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOT CONTROLS & SAFETY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.bot_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) DEFAULT 'default_user' UNIQUE,
    max_daily_connections INTEGER DEFAULT 15,
    max_daily_messages INTEGER DEFAULT 20,
    min_delay_seconds INTEGER DEFAULT 45,
    max_delay_seconds INTEGER DEFAULT 120,
    typing_speed_min_ms INTEGER DEFAULT 50,
    typing_speed_max_ms INTEGER DEFAULT 180,
    working_hours_start INTEGER DEFAULT 9,  -- 9:00 AM
    working_hours_end INTEGER DEFAULT 19,   -- 7:00 PM
    safe_mode_enabled BOOLEAN DEFAULT TRUE,
    human_jitter_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACTIVITY & AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type VARCHAR(100) NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'info' CHECK (status IN ('info', 'success', 'warning', 'error')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON public.leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_lead ON public.messages(lead_id);

-- TRIGGER TO AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trg_update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_leads_updated_at ON public.leads;
CREATE TRIGGER trg_update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_posts_updated_at ON public.posts;
CREATE TRIGGER trg_update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_bot_settings_updated_at ON public.bot_settings;
CREATE TRIGGER trg_update_bot_settings_updated_at
BEFORE UPDATE ON public.bot_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated and anon users (for easy prototyping & service key usage)
CREATE POLICY "Allow public all for campaigns" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for bot_settings" ON public.bot_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
