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
  skills: string[]
  experienceYears?: number
  targetRole?: string
  portfolioOrGithubUrl?: string
}

/**
 * Generates an ultra-professional, natural LinkedIn connection request note.
 * STRICT REQUIREMENT: Max 300 characters (LinkedIn limitation).
 */
export async function generateConnectionNote(
  lead: ProfileContext,
  user: UserContext,
  goal: 'networking' | 'referral' | 'recommendation' | 'mentorship' = 'networking'
): Promise<string> {
  const firstName = lead.fullName.split(' ')[0]

  const prompt = `
You are an executive career advisor and networking expert.
Write a concise, natural, and polite LinkedIn connection note.

CRITICAL RULES:
1. MAXIMUM 290 characters TOTAL (LinkedIn has a strict 300-char limit).
2. DO NOT sound like a generic bot or salesperson (No "I was fascinated by your profile", "Hope this finds you well").
3. Address them professionally by their first name: "${firstName}".
4. State a clear, genuine reason for connecting based on the Goal: "${goal}".
5. Match tone to a high-caliber professional: humble, sharp, and respectful of their time.

Recipient Profile:
- Name: ${lead.fullName}
- Headline: ${lead.headline}
- Company: ${lead.company}

Sender Profile:
- Name: ${user.fullName}
- Current Role / Background: ${user.currentRole}
- Core Skills: ${user.skills.join(', ')}
${user.targetRole ? `- Target Role: ${user.targetRole}` : ''}

Goal:
${
  goal === 'referral'
    ? 'Connect with an engineering lead/manager at their company to learn about open roles and explore referral opportunities.'
    : goal === 'recommendation'
    ? 'Connect with a respected senior professional to seek insights, guidance, and future professional endorsements.'
    : goal === 'mentorship'
    ? 'Learn from their leadership trajectory in the industry.'
    : 'Expand mutual engineering network with peers doing impactful work.'
}

OUTPUT: Return ONLY the exact message text (under 290 characters). No quotes, no markdown labels.
`

  try {
    const note = await generateWithGemini(prompt, {
      temperature: 0.65,
      maxOutputTokens: 120,
    })

    // Double-check 300 char constraint
    if (note.length > 295) {
      return note.slice(0, 292) + '...'
    }
    return note
  } catch (error) {
    // High-quality fallback template if API key is not yet set
    return getFallbackConnectionNote(lead, user, goal)
  }
}

/**
 * Generates a warm, professional follow-up message after the connection is accepted.
 */
export async function generateFollowUpMessage(
  lead: ProfileContext,
  user: UserContext,
  goal: 'networking' | 'referral' | 'recommendation' | 'mentorship' = 'referral'
): Promise<string> {
  const firstName = lead.fullName.split(' ')[0]

  const prompt = `
You are an elite career strategist.
Write a follow-up LinkedIn direct message to a newly connected senior professional/peer.

Context:
- Recipient: ${lead.fullName} (${lead.headline} at ${lead.company})
- Sender: ${user.fullName} (${user.currentRole})
- Core Strengths: ${user.skills.join(', ')}
- Goal: ${goal.toUpperCase()}

Instructions:
1. Thank ${firstName} warmly for connecting.
2. If goal is "referral":
   - Briefly state admiration for the engineering culture at ${lead.company}.
   - In 1-2 lines, highlight sender's core competence without bragging.
   - Humbly ask if they would be open to a quick pointer or referral for relevant open positions.
3. If goal is "recommendation" or "mentorship":
   - Reference their expertise in ${lead.headline}.
   - Ask for a brief piece of advice or whether they would be open to reviewing a recent project/case-study for feedback.
4. Keep the message under 150 words.
5. Provide a clear, low-pressure closing (e.g., "Either way, appreciate your time and wishing you a great week ahead!").

OUTPUT: Return ONLY the ready-to-send message text. No extra explanations.
`

  try {
    return await generateWithGemini(prompt, {
      temperature: 0.7,
      maxOutputTokens: 400,
    })
  } catch (error) {
    return getFallbackFollowUpMessage(lead, user, goal)
  }
}

/**
 * Analyzes an incoming message to detect intent and suggest the best response
 */
export async function analyzeIncomingMessage(messageText: string): Promise<{
  intent: 'positive' | 'neutral' | 'negative' | 'referral_offered' | 'more_info_needed'
  suggestedAction: string
}> {
  const prompt = `
Analyze the following reply received on LinkedIn:
"${messageText}"

Classify into one of these intents:
- referral_offered: They agreed to refer, asked for resume/email/job ID.
- positive: Warm, open to chat or gave encouraging response.
- more_info_needed: Asked questions about experience, tech stack, or portfolio.
- neutral: Brief acknowledgement (e.g. "Thanks", "Sure").
- negative: Declined, not hiring, or asked not to message.

Respond with JSON in this format:
{
  "intent": "positive",
  "suggestedAction": "Send resume link and thank them for the guidance."
}
`

  try {
    const raw = await generateWithGemini(prompt, {
      temperature: 0.2,
      maxOutputTokens: 200,
    })
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    // Fallback classification
  }

  return {
    intent: 'neutral',
    suggestedAction: 'Review message manually and craft a polite acknowledgement.',
  }
}

// Fallback templates when offline or during initial configuration
function getFallbackConnectionNote(
  lead: ProfileContext,
  user: UserContext,
  goal: string
): string {
  const firstName = lead.fullName.split(' ')[0]
  if (goal === 'referral') {
    return `Hi ${firstName}, saw your engineering leadership at ${lead.company}. I'm a ${user.currentRole} focusing on ${user.skills[0] || 'scalable systems'}. Would love to connect and keep in touch regarding future opportunities!`
  }
  return `Hi ${firstName}, impressed by your work at ${lead.company}. I'm also building in ${user.skills[0] || 'software engineering'} and would love to connect to follow your insights.`
}

function getFallbackFollowUpMessage(
  lead: ProfileContext,
  user: UserContext,
  goal: string
): string {
  const firstName = lead.fullName.split(' ')[0]
  return `Hi ${firstName}, thanks for connecting!

I've been following the engineering initiatives at ${lead.company} and really admire the technical bar. 

As a ${user.currentRole} specializing in ${user.skills.slice(0, 3).join(', ')}, I'm exploring new impactful opportunities. If your team is looking for passionate builders or if you'd be open to referring me for open roles, I'd love to share my portfolio.

No worries if you're swamped—appreciate your time and wishing you a great week ahead!

Best regards,
${user.fullName}`
}
