-- ==============================================================================
-- LinkedIn Growth Copilot - Initial Seed Data
-- ==============================================================================

-- 1. Default Bot Safety Configuration
INSERT INTO public.bot_settings (
    user_id,
    max_daily_connections,
    max_daily_messages,
    min_delay_seconds,
    max_delay_seconds,
    typing_speed_min_ms,
    typing_speed_max_ms,
    working_hours_start,
    working_hours_end,
    safe_mode_enabled,
    human_jitter_enabled
) VALUES (
    'default_user',
    15,
    20,
    45,
    120,
    50,
    180,
    9,
    19,
    TRUE,
    TRUE
) ON CONFLICT (user_id) DO NOTHING;

-- 2. Starter Campaigns
INSERT INTO public.campaigns (
    id,
    name,
    target_role,
    target_industry,
    target_location,
    goal_type,
    status,
    daily_limit,
    user_context
) VALUES 
(
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Tech Leaders & Hiring Managers Networking',
    'Engineering Manager OR Senior Tech Lead OR VP of Engineering',
    'Technology / Software',
    'India / Remote',
    'referral',
    'active',
    10,
    'Experienced Full Stack Engineer passionate about scalable distributed systems, AI integrations, and high-impact product engineering.'
),
(
    'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
    'Peer Engineers & AI Researchers Connect',
    'AI Engineer OR Full Stack Developer',
    'Software & Artificial Intelligence',
    'Global',
    'networking',
    'active',
    10,
    'Interested in open-source AI tooling, LLM agents, and developer tools.'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Initial Sample Posts
INSERT INTO public.posts (
    topic,
    content,
    framework,
    status,
    scheduled_at
) VALUES 
(
    'Why Human-in-the-Loop AI is Winning in 2026',
    E'Most AI automation fails because people try to replace the human instead of empowering them.\n\nHere is what I have observed after building autonomous agent pipelines:\n\n1. Pure automation feels robotic and gets flagged.\n2. 100% manual work doesn''t scale.\n3. The sweet spot? The AI drafts, filters, and recommends. The human steers and approves.\n\nAre you using AI as an autopilot or a copilot?\n\n#ArtificialIntelligence #SoftwareEngineering #TechTrends #Productivity',
    'hook_value_cta',
    'draft',
    NOW() + INTERVAL '1 day'
);
