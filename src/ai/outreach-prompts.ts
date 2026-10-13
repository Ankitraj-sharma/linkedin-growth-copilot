import { generateWithGemini } from './gemini-client'

export interface ProfileContext {
  fullName: string
  headline: string
  company: string
  location?: string
  recentActivityOrKeywords?: string
}

export interface UserContext {
  fullName: string
  currentRole: string
  skills?: string[] | string
  experienceYears?: number
  targetRole?: string
  portfolioOrGithubUrl?: string
  goal?: 'networking' | 'referral' | 'recommendation' | 'mentorship'
}

/**
 * Generates an ultra-professional, natural LinkedIn connection request note.
 * STRICT REQUIREMENT: Max 290 characters (LinkedIn 300-char limit).
 */
export async function generateConnectionNote(
  lead: ProfileContext,
  user: UserContext,
  goal: 'networking' | 'referral' | 'recommendation' | 'mentorship' = 'referral',
  apiKey?: string
): Promise<string> {
  const firstName = lead.fullName.split(' ')[0]
  const skillsList = Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || 'modern fullstack tech')
  const targetRole = user.targetRole || user.currentRole

  if (apiKey || process.env.GEMINI_API_KEY) {
    const prompt = `
You are an executive career advisor and networking expert.
Write a concise, natural, and polite LinkedIn connection note.

CRITICAL RULES:
1. STRICT MAXIMUM: 280 characters total (LinkedIn has a hard 300-char limit).
2. DO NOT sound like a robot or salesperson (No "I was fascinated by your profile", "Hope this finds you well").
3. Address them by their first name: "${firstName}".
4. Mention their role at ${lead.company} and align with sender's background in "${targetRole}".
5. Match tone to a top-tier engineer/professional: humble, sharp, and respectful of their time.

Recipient Profile:
- Name: ${lead.fullName}
- Headline: ${lead.headline}
- Company: ${lead.company}

Sender Profile:
- Name: ${user.fullName}
- Current/Target Role: ${targetRole}
- Core Skills: ${skillsList}

Goal: ${goal.toUpperCase()}

OUTPUT: Return ONLY the exact message text (under 280 characters). No quotes, no markdown labels.
`

    try {
      const note = await generateWithGemini(prompt, {
        temperature: 0.7,
        maxOutputTokens: 120,
        apiKey,
      })

      if (note && note.trim().length > 10) {
        const clean = note.trim().replace(/^["']|["']$/g, '')
        return clean.length > 290 ? clean.slice(0, 287) + '...' : clean
      }
    } catch (error) {
      console.warn('⚠️ [AI Note] Gemini call failed, using smart dynamic note generator.')
    }
  }

  // Smart Dynamic Contextual Generator (No API key needed)
  return getAdaptiveConnectionNote(lead, user, goal)
}

/**
 * Generates a warm, professional follow-up message after the connection is accepted.
 */
export async function generateFollowUpMessage(
  lead: ProfileContext,
  user: UserContext,
  goal: 'networking' | 'referral' | 'recommendation' | 'mentorship' = 'referral',
  apiKey?: string
): Promise<string> {
  const firstName = lead.fullName.split(' ')[0]
  const targetRole = user.targetRole || user.currentRole
  const skillsList = Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || 'scalable web technologies')

  if (apiKey || process.env.GEMINI_API_KEY) {
    const prompt = `
You are an elite career strategist.
Write a high-converting follow-up LinkedIn direct message to a newly connected senior professional/manager.

Context:
- Recipient: ${lead.fullName} (${lead.headline} at ${lead.company})
- Sender: ${user.fullName} (${targetRole})
- Core Strengths: ${skillsList}
- Goal: ${goal.toUpperCase()}

Instructions:
1. Thank ${firstName} warmly for accepting the connection.
2. Admire their engineering work or team culture at ${lead.company}.
3. State sender's background in ${targetRole} and value-add in 1 crisp sentence.
4. If goal is "referral": Ask politely if they would be open to a quick pointer or referral for open roles.
5. If goal is "recommendation" or "mentorship": Ask for a brief 5-min piece of advice on career trajectory or feedback.
6. Low-pressure closing ("No worries if you are swamped—wishing you a great week ahead!").
7. Length: Under 120 words.

OUTPUT: Return ONLY the ready-to-send message text. No extra explanations.
`

    try {
      const reply = await generateWithGemini(prompt, {
        temperature: 0.7,
        maxOutputTokens: 350,
        apiKey,
      })
      if (reply && reply.trim().length > 20) {
        return reply.trim()
      }
    } catch (e) {
      // Fallback
    }
  }

  return getAdaptiveFollowUpMessage(lead, user, goal)
}

/**
 * Adaptive Psychological Note Generator (Strictly under 290 characters)
 */
function getAdaptiveConnectionNote(
  lead: ProfileContext,
  user: UserContext,
  goal: string
): string {
  const firstName = lead.fullName.split(' ')[0]
  const targetRole = user.targetRole || user.currentRole || 'Software Engineer'
  const company = lead.company || 'your team'

  if (goal === 'referral') {
    return `Hi ${firstName}, really admire the engineering standard at ${company}. As a ${targetRole}, I am exploring opportunities to contribute to high-impact products. Would love to connect and keep in touch regarding open roles!`
  }

  if (goal === 'recommendation' || goal === 'mentorship') {
    return `Hi ${firstName}, came across your leadership in ${lead.headline?.slice(0, 40) || company}. As a ${targetRole}, I would love to connect and learn from your technical trajectory in the industry!`
  }

  return `Hi ${firstName}, noticed your impactful work at ${company}. I am also building in the ${targetRole} space and would love to connect to exchange insights and follow your engineering updates.`
}

/**
 * Adaptive Follow-up Message
 */
function getAdaptiveFollowUpMessage(
  lead: ProfileContext,
  user: UserContext,
  goal: string
): string {
  const firstName = lead.fullName.split(' ')[0]
  const targetRole = user.targetRole || user.currentRole || 'Software Engineer'
  const company = lead.company || 'your team'
  const skills = Array.isArray(user.skills) ? user.skills.slice(0, 3).join(', ') : (user.skills || 'modern scalable systems')

  if (goal === 'referral') {
    return `Hi ${firstName}, thanks for connecting!

I've been closely following the product engineering initiatives at ${company} and really respect the technical bar.

I'm an active ${targetRole} with a strong focus on ${skills}. I'm currently looking for impactful engineering opportunities. If your team or an adjacent team has open positions and you'd be open to reviewing my work or offering a referral, I'd be truly grateful to share my resume and projects.

Either way, appreciate your time and wishing you a fantastic week ahead!

Best regards,
${user.fullName}`
  }

  return `Hi ${firstName}, thank you for connecting!

I've been inspired by your work at ${company} in ${lead.headline?.slice(0, 50) || 'tech leadership'}.

As a ${targetRole} passionate about ${skills}, I'm always looking to refine my engineering standards. If you ever have a few minutes for a quick tip or advice on scaling as a builder, I'd love to learn from your experience.

Wishing you great success with your current milestones!

Best,
${user.fullName}`
}
