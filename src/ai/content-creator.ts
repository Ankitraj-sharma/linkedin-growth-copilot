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
 * Generates an algorithm-optimized, high-reach LinkedIn post using Gemini AI
 */
export async function generateViralPost(request: PostRequest): Promise<GeneratedPost> {
  const framework = request.framework || 'hook_value_cta'
  const tone = request.tone || 'conversational'
  const targetAudience = request.targetAudience || 'Developers, Tech Founders, and Engineering Leaders'
  const perspective = request.authorPerspective || 'Software Engineer building modern AI-driven solutions'

  const prompt = `
You are the top ghostwriter for tech leaders and creators on LinkedIn with millions of organic impressions.
Generate a high-converting, viral-ready LinkedIn post based on the following:

TOPIC: "${request.topic}"
FRAMEWORK: "${framework}"
TONE: "${tone}"
TARGET AUDIENCE: "${targetAudience}"
AUTHOR PERSPECTIVE: "${perspective}"

FRAMEWORK DEFINITIONS:
- hook_value_cta: A punchy scroll-stopping 2-line hook, followed by 3-5 high-value bullet points, and an engagement question.
- storytelling: "Vulnerable beginning -> The turning point / challenge -> The breakthrough -> The actionable lesson."
- industry_breakdown: Breakdown of a complex technical concept, architecture, or ecosystem trend in simple, memorable terms.
- hot_take: A respectful contrarian stance against a common industry myth, supported by pragmatic logic.
- carousel_concept: Slide 1 hook, Slides 2-7 bullet points with key insights, Slide 8 conclusion/recap.

CRITICAL FORMATTING GUIDELINES FOR LINKEDIN ALGORITHM:
1. THE FIRST 2 LINES MUST BE IRRESISTIBLE: LinkedIn cuts off text with "...see more" after ~140 characters. Make the first 2 lines provoke curiosity.
2. WHITE SPACE & SHORT PARAGRAPHS: Maximum 1-2 sentences per line. Never write chunky text walls.
3. NO CLICHÉ BUZZWORDS: Avoid "Thrilled to announce", "In today's fast-paced world", "Game changer".
4. END WITH A CONVERSATION-TRIGGERING CTA: Ask a specific, easy-to-answer question to drive comment velocity.
5. HASHTAGS: Exactly 3 to 4 hyper-relevant hashtags at the very bottom.

FORMAT YOUR RESPONSE AS A VALID JSON OBJECT (no extra markdown wrapping):
{
  "title": "Short title describing this post",
  "content": "The full LinkedIn post text with newlines (\\n\\n) and emojis where appropriate",
  "hookVariations": [
    "Hook option 1...",
    "Hook option 2...",
    "Hook option 3..."
  ],
  "suggestedHashtags": ["#Tech", "#SoftwareEngineering", "#AI"],
  "estimatedReadTimeSeconds": 45
}
`

  try {
    const raw = await generateWithGemini(prompt, {
      temperature: 0.75,
      maxOutputTokens: 1200,
    })

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        title: parsed.title || request.topic,
        content: parsed.content || '',
        framework: framework,
        hookVariations: parsed.hookVariations || [],
        suggestedHashtags: parsed.suggestedHashtags || ['#Tech', '#Engineering'],
        estimatedReadTimeSeconds: parsed.estimatedReadTimeSeconds || 40,
      }
    }
  } catch (error) {
    console.warn('⚠️ [Post Generation] Using template fallback:', error)
  }

  return getFallbackPost(request)
}

function getFallbackPost(request: PostRequest): GeneratedPost {
  const content = `Most engineers focus on learning 10 different tools.
Top 1% engineers focus on mastering 1 mental model.

Here is the difference I realized after building real-world software:

1. Tools come and go every 2 years.
2. Architecture fundamentals remain unchanged for decades.
3. Clear communication beats clever code every single time.
4. If your system can't be easily debugged, it's not production-ready.

Build systems that are boringly reliable, not needlessly complex.

What's one core principle you value most in your tech stack?

#SoftwareEngineering #Architecture #Productivity #Coding`

  return {
    title: request.topic,
    content,
    framework: request.framework || 'hook_value_cta',
    hookVariations: [
      'Most engineers focus on learning 10 different tools.\nTop 1% focus on mastering 1 mental model.',
      'Stop overcomplicating your architecture in 2026.\nHere is what really moves the needle:',
    ],
    suggestedHashtags: ['#SoftwareEngineering', '#Coding', '#CareerGrowth'],
    estimatedReadTimeSeconds: 45,
  }
}
