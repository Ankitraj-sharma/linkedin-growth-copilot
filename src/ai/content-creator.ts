import { generateWithGemini } from './gemini-client'

export type PostFramework =
  | 'hook_value_cta'
  | 'storytelling'
  | 'industry_breakdown'
  | 'hot_take'
  | 'carousel_concept'

export interface PostRequest {
  topic: string
  framework?: PostFramework
  targetAudience?: string
  authorPerspective?: string
  tone?: 'authoritative' | 'conversational' | 'inspiring' | 'contrarian'
  apiKey?: string
}

export interface GeneratedPost {
  title: string
  content: string
  framework: PostFramework
  hookVariations: string[]
  suggestedHashtags: string[]
  estimatedReadTimeSeconds: number
}

/**
 * Generates an algorithm-optimized, high-reach LinkedIn post.
 * Uses Gemini LLM if API key is provided, or an intelligent topic-aware synthesis engine.
 */
export async function generateViralPost(request: PostRequest): Promise<GeneratedPost> {
  const framework = request.framework || 'hook_value_cta'
  const tone = request.tone || 'conversational'
  const targetAudience = request.targetAudience || 'Professionals, Builders, and Tech Leaders'
  const perspective = request.authorPerspective || 'Experienced Practitioner'

  // If Gemini API Key is available, use real LLM generation
  if (request.apiKey || process.env.GEMINI_API_KEY) {
    try {
      const prompt = `
You are the top ghostwriter for industry leaders and creators on LinkedIn with millions of organic impressions.
Generate a high-converting, viral-ready LinkedIn post tailored EXACTLY to the following topic:

TOPIC: "${request.topic}"
FRAMEWORK: "${framework}"
TONE: "${tone}"
TARGET AUDIENCE: "${targetAudience}"
AUTHOR PERSPECTIVE: "${perspective}"

FRAMEWORK RULES:
- hook_value_cta: Scroll-stopping 2-line hook, followed by 3-5 high-value bullet points about "${request.topic}", ending with an engagement question.
- storytelling: "Vulnerable beginning -> Challenge faced with ${request.topic} -> The breakthrough -> The actionable lesson."
- industry_breakdown: Breakdown of key pillars, tools, or best practices of "${request.topic}".
- hot_take: A contrarian stance against a common myth in "${request.topic}", backed by logic.
- carousel_concept: Slide 1 hook, Slides 2-6 core insights on "${request.topic}", Slide 7 summary.

FORMATTING REQUIREMENTS:
1. FIRST 2 LINES MUST BE SCROLL-STOPPING: LinkedIn cuts off text with "...see more" after ~140 chars.
2. LOTS OF WHITE SPACE: 1-2 sentences per line maximum.
3. CONVERSATION CTA: End with an engaging question about ${request.topic}.
4. 3-4 RELEVANT HASHTAGS at the bottom.

RESPOND ONLY WITH VALID JSON:
{
  "title": "Short title",
  "content": "Full post text with newlines (\\n\\n)",
  "hookVariations": ["Hook 1...", "Hook 2...", "Hook 3..."],
  "suggestedHashtags": ["#Tag1", "#Tag2", "#Tag3"],
  "estimatedReadTimeSeconds": 45
}
`
      const raw = await generateWithGemini(prompt, {
        temperature: 0.75,
        maxOutputTokens: 1200,
        apiKey: request.apiKey,
      })

      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          title: parsed.title || request.topic,
          content: parsed.content || '',
          framework: framework,
          hookVariations: parsed.hookVariations || [],
          suggestedHashtags: parsed.suggestedHashtags || ['#Career', '#Growth'],
          estimatedReadTimeSeconds: parsed.estimatedReadTimeSeconds || 45,
        }
      }
    } catch (err: any) {
      console.warn('⚠️ [Gemini LLM Call Failed, using dynamic engine]:', err.message || err)
    }
  }

  // Smart Topic-Aware Synthesis Engine (No API key required)
  return synthesizeTopicPost(request)
}

/**
 * Synthesizes high-performing LinkedIn posts customized specifically to the user's prompt topic
 */
function synthesizeTopicPost(request: PostRequest): GeneratedPost {
  const rawTopic = request.topic.trim()
  const lower = rawTopic.toLowerCase()
  const framework = request.framework || 'hook_value_cta'

  // Clean the prompt to extract the clean subject
  const cleanSubject = rawTopic
    .replace(/^(talk about|write about|post about|tell me about|explain|share thoughts on)\s+/i, '')
    .trim()

  const subjectCap = cleanSubject.charAt(0).toUpperCase() + cleanSubject.slice(1)

  // 1. FREELANCING / CONSULTING / AGENCY
  if (lower.includes('freelanc') || lower.includes('client') || lower.includes('agency') || lower.includes('gig') || lower.includes('upwork')) {
    if (framework === 'storytelling') {
      return {
        title: `My Honest Journey in ${subjectCap}`,
        framework,
        content: `When I took my first freelancing client, I made every rookie mistake in the book.

I charged $15/hour.
I said yes to every unreasonable scope change.
And I spent weekends fixing bugs for free just to avoid negative feedback.

Then, a senior freelancer gave me advice that changed everything:
"Clients don't buy your hours. They buy risk reduction and certainty."

Here is what shifted when my income tripled:
1. I stopped trading time for money and started pitching outcomes.
2. I qualified clients aggressively—saying "no" is the ultimate superpower.
3. I built a pipeline so I was never desperate for the next contract.

Freelancing isn't just about freedom; it's about running a serious business of one.

What was the hardest reality check you faced in your freelancing journey?

#Freelancing #RemoteWork #CareerGrowth #Solopreneur #Consulting`,
        hookVariations: [
          'When I took my first freelancing client, I made every rookie mistake in the book.',
          'Most people think freelancing is about freedom.\nThe reality? It is about running a business of one.',
        ],
        suggestedHashtags: ['#Freelancing', '#Solopreneur', '#Consulting', '#RemoteWork'],
        estimatedReadTimeSeconds: 45,
      }
    } else if (framework === 'hot_take') {
      return {
        title: `Unpopular Truth about ${subjectCap}`,
        framework,
        content: `Unpopular opinion: Stop advertising yourself as a "full-stack generalist" freelancer.

In 2026, generalists compete on price with anyone across the globe.
Specialists compete on reputation and impact.

Here is the difference:
• Generalist: "I build websites." (Earns $20/hr, fights over budget)
• Specialist: "I optimize checkout funnels for SaaS apps to increase conversion by 15%." (Charges $5k/project)

The moment you solve a specific, expensive business problem:
1. Price resistance disappears.
2. Inbound referrals replace cold bidding.
3. Scope creep becomes virtually zero.

Specialize until it feels uncomfortably narrow. That is where pricing power lives.

Agree or disagree?

#Freelancing #Consulting #PricingStrategy #CareerAdvice #BusinessTips`,
        hookVariations: [
          'Unpopular opinion: Stop advertising yourself as a generalist freelancer in 2026.',
          'Specialists charge for outcomes. Generalists fight over hourly rates.',
        ],
        suggestedHashtags: ['#Freelancing', '#Consulting', '#PricingStrategy', '#Solopreneur'],
        estimatedReadTimeSeconds: 40,
      }
    } else {
      // Default: hook_value_cta
      return {
        title: `The 4 Rules of High-Income ${subjectCap}`,
        framework,
        content: `Most people think freelancing is about freedom.
The reality? It's about running an entire business of one.

If you are building an independent consulting or freelancing career in 2026, here are 4 non-negotiable rules:

1. Stop charging by the hour. Value-based project pricing aligns your incentives with client success.
2. Never stop prospecting. The biggest mistake is pausing marketing the moment you land a big client.
3. Over-communicate everything. Fast updates, clear deadlines, and transparent roadmaps beat raw technical skill.
4. Productize your services. Turn repetitive tasks into repeatable playbooks.

When you treat your freelance work like a disciplined business, the clients you want will treat you like a trusted partner.

For everyone freelancing right now: What was the #1 lesson that transformed your revenue?

#Freelancing #Solopreneur #RemoteWork #Consulting #Productivity`,
        hookVariations: [
          'Most people think freelancing is about freedom.\nThe reality? It is about running a business of one.',
          'The biggest mistake freelancers make?\nPausing client acquisition the moment they sign a contract.',
        ],
        suggestedHashtags: ['#Freelancing', '#Solopreneur', '#RemoteWork', '#CareerGrowth'],
        estimatedReadTimeSeconds: 45,
      }
    }
  }

  // 2. INTERVIEWS / HIRING / CAREER / RESUME
  if (lower.includes('interview') || lower.includes('hire') || lower.includes('resume') || lower.includes('job') || lower.includes('referral')) {
    return {
      title: `How to Stand Out in ${subjectCap}`,
      framework,
      content: `Sending 300 identical applications on job portals is the slowest way to get hired.

The top 1% candidates do not apply through the front door.
They build leverage.

Here is what actually moves the needle when preparing for tech interviews in 2026:

1. Build public proof of work. A single deployed production project with clear architecture diagrams beats 50 lines on a resume.
2. Optimize your cold outreach. Never ask for a referral on day one. Ask for technical feedback or advice on a specific challenge their team solved.
3. Master behavioral storytelling. Technical skills get you through the screen; concise communication and culture alignment get you the offer.
4. Treat rejection as telemetry. If you fail the phone screen, your pitch is off. If you fail the system design round, your architectural depth needs polish.

The job market is competitive, but it is deeply starved of builders who communicate with clarity.

What has been your biggest takeaway from recent tech interviews?

#TechCareers #SoftwareEngineering #Interviews #JobSearch #Hiring`,
      hookVariations: [
        'Sending 300 identical applications is the slowest way to get hired.\nHere is what top candidates do differently:',
        'The job market is competitive, but it is starved of builders who communicate with clarity.',
      ],
      suggestedHashtags: ['#JobSearch', '#TechCareers', '#SoftwareEngineering', '#Interviews'],
      estimatedReadTimeSeconds: 45,
    }
  }

  // 3. AI / LLM / AGENTS / AUTOMATION
  if (lower.includes('ai') || lower.includes('llm') || lower.includes('agent') || lower.includes('chatgpt') || lower.includes('gemini')) {
    return {
      title: `The Reality of ${subjectCap} in Production`,
      framework,
      content: `The hype around AI agents is everywhere.
The production reality is very different.

After building real-world AI workflows and agent pipelines, here is what actually works:

1. Determinism over unpredictability. Use LLMs for reasoning and synthesis; use deterministic code for business validation and execution.
2. Evaluation is the true moat. If you cannot automatically score the accuracy of your model's outputs, you cannot deploy safely.
3. Human-in-the-loop wins. Pure autonomy often degrades trust. Autonomous drafting paired with human approval is the winning enterprise pattern.
4. Latency and cost compound fast. Smarter chunking and caching beat throwing expensive reasoning models at simple queries.

Stop looking for magical single-prompt solutions. Build robust, observable pipelines.

How is your engineering team integrating AI into production this year?

#ArtificialIntelligence #MachineLearning #AIAgents #SoftwareEngineering #TechTrends`,
      hookVariations: [
        'The hype around AI agents is everywhere.\nThe production reality is very different.',
        'Stop looking for magical single-prompt solutions.\nHere is what building real AI pipelines taught me:',
      ],
      suggestedHashtags: ['#ArtificialIntelligence', '#AIAgents', '#SoftwareEngineering', '#TechTrends'],
      estimatedReadTimeSeconds: 50,
    }
  }

  // 4. GENERAL DYNAMIC SYNTHESIS FOR ANY CUSTOM TOPIC
  return {
    title: `Key Insights on ${subjectCap}`,
    framework,
    content: `Most people approach ${cleanSubject} the hard way.
They focus on short-term tactics instead of core fundamentals.

Here are 4 critical principles that separate beginners from top performers in ${cleanSubject}:

1. Consistency compounds faster than intensity. Small daily improvements outperform sporadic bursts of effort.
2. Simplify before you optimize. The easiest way to succeed in ${cleanSubject} is eliminating needless friction early.
3. Execution beats theory every single time. Real-world feedback teaches lessons that documentation never can.
4. Protect your focus. Master the 20% of actions that drive 80% of tangible outcomes.

Whether you are starting out or scaling your expertise in ${cleanSubject}: Focus on building durable value, not chasing vanity metrics.

What is one rule you personally swear by when it comes to ${cleanSubject}?

#${cleanSubject.replace(/[^a-zA-Z0-9]/g, '')} #CareerGrowth #ProfessionalDevelopment #Productivity #Insights`,
    hookVariations: [
      `Most people approach ${cleanSubject} the hard way.\nHere is what changes when you master the fundamentals:`,
      `Stop overcomplicating ${cleanSubject} in 2026.\nThese 4 rules will save you months of trial and error:`,
    ],
    suggestedHashtags: [
      `#${cleanSubject.replace(/[^a-zA-Z0-9]/g, '')}`,
      '#CareerGrowth',
      '#ProfessionalDevelopment',
      '#Productivity',
    ],
    estimatedReadTimeSeconds: 45,
  }
}
