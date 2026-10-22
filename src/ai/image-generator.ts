import { generateWithGemini } from './gemini-client'

export interface GeneratedImageResult {
  imageUrl: string
  promptUsed: string
  visualStyle: 'cinematic_photo' | 'minimalist_3d' | 'quote_card'
}

/**
 * Generates an algorithm-optimized LinkedIn visual for any given post topic.
 * Uses Gemini to translate the concept into a vivid, professional Flux image prompt,
 * and generates a high-definition 1200x630 (landscape) image via Pollinations AI.
 */
export async function generateTopicImage(
  topic: string,
  postContent?: string,
  preferredStyle: 'cinematic_photo' | 'minimalist_3d' | 'quote_card' = 'cinematic_photo',
  apiKey?: string
): Promise<GeneratedImageResult> {
  const cleanTopic = topic.trim()

  // 1. If quote card is preferred, generate branded SVG data URI
  if (preferredStyle === 'quote_card') {
    const excerpt = postContent ? extractKeyHook(postContent) : cleanTopic
    const svgDataUri = generateQuoteCardSvg(excerpt)
    return {
      imageUrl: svgDataUri,
      promptUsed: excerpt,
      visualStyle: 'quote_card',
    }
  }

  // 2. Use Gemini to craft a photorealistic or conceptual Flux image prompt
  let imagePrompt = `Professional modern editorial photograph representing ${cleanTopic}, corporate aesthetics, warm studio lighting, 8k resolution, minimalist, cinematic depth of field, high contrast, clean background, award winning photography`

  try {
    const promptRefinerQuery = `
You are a professional photography director and visual editor for top LinkedIn publications (like Forbes, Wired, Fast Company).
Generate a concrete, literal, photorealistic photography prompt for an AI image generator (Flux) that directly matches the EXACT real-world topic below.

TOPIC: "${cleanTopic}"
${postContent ? `POST SNIPPET: "${postContent.slice(0, 300)}..."` : ''}

CRITICAL RULES FOR ACCURATE TOPIC VISUALS:
1. IDENTIFY THE PHYSICAL, REAL-WORLD SCENE:
   - If the topic is about coding/software: A focused software engineer at a wooden desk with dual high-res monitors showing realistic clean code, warm desk lamp, coffee mug, photorealistic modern office.
   - If the topic is about chai / street business / food / shop: An authentic Indian roadside tea stall, steaming brass kettle, cutting chai glasses on a rustic wooden counter, soft morning golden hour sunlight.
   - If the topic is about salary negotiation / job offer / contract: A modern office desk with an open signed contract, fountain pen, laptop, clean daylight, executive boardroom in background.
   - If the topic is about burnout / work-life balance: Running shoes resting next to an open laptop on a sunlit wooden table, indoor plants, peaceful morning atmosphere.
   - If the topic is about real estate: Modern architectural blueprint spread on a table with house keys and a miniature house model, soft natural lighting.
   - If the topic is about data science / AI / ML: A clean laptop screen visualizing clear data graphs, Python code notebooks, clean minimalist desk, bright natural daylight.
   - If the topic is about startup failure / starting over: A founder writing ideas on a glass whiteboard with sticky notes, messy notebook, evening dusk city lights outside window.
2. TRANSLATE HINDI/HINGLISH: Understand the exact physical cultural setting (e.g., 'chai ki dukan' -> Indian street tea stall; 'boss se ladai' -> corporate discussion room).
3. STRICTLY NO ABSTRACT SURREALISM: DO NOT generate glowing neon cubes, floating sci-fi crystals, laser grids, or purple cyberpunk matrix effects. Make it look like a REAL, high-end photograph taken with a 35mm lens.
4. Output ONLY the prompt string, under 45 words, no conversational quotes or filler.
`
    const refined = await generateWithGemini(promptRefinerQuery, {
      temperature: 0.7,
      maxOutputTokens: 100,
      apiKey: apiKey || process.env.GEMINI_API_KEY,
    })

    if (refined && refined.trim().length > 10) {
      imagePrompt = refined.trim().replace(/^["']|["']$/g, '')
    }
  } catch (err: any) {
    console.warn('⚠️ [Image Prompt Refiner Fallback]:', err.message || err)
  }

  // 3. Generate high-definition Pollinations AI URL (Flux model, 1200x630 LinkedIn landscape, no watermark)
  const encoded = encodeURIComponent(imagePrompt)
  const seed = Math.floor(Math.random() * 1000000)
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&model=flux&nologo=true&seed=${seed}`

  return {
    imageUrl,
    promptUsed: imagePrompt,
    visualStyle: preferredStyle,
  }
}

/**
 * Extracts the single punchiest 1-2 sentence hook from post content
 */
function extractKeyHook(content: string): string {
  const paragraphs = content.split('\n\n').map((p) => p.trim()).filter(Boolean)
  if (paragraphs.length > 0) {
    return paragraphs[0].slice(0, 140)
  }
  return content.slice(0, 140)
}

/**
 * Generates an aesthetic, dark-mode SVG quote card as a Data URI for instant preview
 */
export function generateQuoteCardSvg(quoteText: string, authorName = 'Ankit Raj Sharma'): string {
  const cleanQuote = quoteText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

  // Split into multiple lines of ~40 chars
  const words = cleanQuote.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > 38) {
      lines.push(currentLine.trim())
      currentLine = word
    } else {
      currentLine = (currentLine + ' ' + word).trim()
    }
  }
  if (currentLine) lines.push(currentLine.trim())

  const textTspans = lines
    .map((line, i) => `<tspan x="100" dy="${i === 0 ? 0 : 44}">${line}</tspan>`)
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="1200" height="630" rx="0" fill="url(#bg)" />
    
    <!-- Grid overlay pattern -->
    <g opacity="0.05">
      <path d="M0 100 H1200 M0 200 H1200 M0 300 H1200 M0 400 H1200 M0 500 H1200" stroke="#ffffff" stroke-width="1"/>
      <path d="M200 0 V630 M400 0 V630 M600 0 V630 M800 0 V630 M1000 0 V630" stroke="#ffffff" stroke-width="1"/>
    </g>

    <!-- Glowing Top Accent -->
    <rect x="100" y="80" width="80" height="6" rx="3" fill="url(#accent)" />
    
    <!-- Quotation mark icon -->
    <text x="100" y="170" font-family="Georgia, serif" font-size="72" fill="#38bdf8" opacity="0.6">“</text>

    <!-- Main Quote Text -->
    <text x="100" y="230" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="700" fill="#f8fafc" letter-spacing="-0.5">
      ${textTspans}
    </text>

    <!-- Footer: Author Info -->
    <g transform="translate(100, 510)">
      <circle cx="28" cy="28" r="28" fill="#0284c7" />
      <text x="28" y="37" font-family="-apple-system, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
      <text x="75" y="24" font-family="-apple-system, sans-serif" font-size="20" font-weight="700" fill="#ffffff">${authorName}</text>
      <text x="75" y="46" font-family="-apple-system, sans-serif" font-size="14" font-weight="500" fill="#94a3b8">LinkPilot AI • LinkedIn Growth Series</text>
    </g>
  </svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
