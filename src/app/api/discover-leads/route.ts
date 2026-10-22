import { NextResponse } from 'next/server'
import { generateWithGemini } from '@/ai/gemini-client'
import { generateConnectionNote, generateFollowUpMessage } from '@/ai/outreach-prompts'

interface LeadItem {
  id: string
  name: string
  headline: string
  company: string
  location: string
  profileUrl: string
  status: 'discovered'
  note: string
  followup: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { targetRole, currentRole, goal, apiKey, user } = body

    const userProfile = user || {
      fullName: 'Ankitraj Sharma',
      currentRole: currentRole || 'Full Stack Engineer',
      targetRole: targetRole || 'Senior Full Stack / SDE-2',
      skills: ['React', 'TypeScript', 'Node.js', 'Next.js'],
    }

    const effectiveTargetRole = targetRole || userProfile.targetRole || 'Full Stack Engineer'
    const effectiveGoal = goal || 'referral'

    // 1. Try Gemini LLM for dynamic profile generation if API key is present
    if (apiKey || process.env.GEMINI_API_KEY) {
      try {
        const prompt = `
You are an expert LinkedIn talent scout and referral connector.
A candidate is seeking an internal employee referral for their target role:
- Candidate Name: "${userProfile.fullName}"
- Current Role: "${userProfile.currentRole}"
- Target Role Seeking: "${effectiveTargetRole}"
- Goal: Referral for hiring at top companies (e.g. Microsoft, Google, Amazon, Atlassian, Uber, Swiggy, Zomato, Stripe, Razorpay)

Generate 5 high-impact, realistic LinkedIn professional profiles of people who can directly give an internal referral for this target role:
1. Engineering Manager / Director at a tier-1 company (direct hiring decision maker)
2. Staff / Senior Engineer at a high-growth tech firm (peers who refer candidates)
3. Tech Lead / Principal Architect (team builder)
4. Senior Engineering Manager (division lead)
5. Technical Recruiter / Talent Lead (direct role sourcer)

Return ONLY a JSON array with exactly 5 objects:
[
  {
    "name": "Full Name",
    "headline": "Engineering Manager at Microsoft | Azure Cloud Systems",
    "company": "Microsoft",
    "location": "Bengaluru, India",
    "searchQuery": "Microsoft Engineering Manager"
  }
]
`
        const raw = await generateWithGemini(prompt, {
          temperature: 0.7,
          maxOutputTokens: 1200,
          apiKey: apiKey || process.env.GEMINI_API_KEY,
        })

        const match = raw.match(/\[[\s\S]*\]/)
        if (match) {
          const parsed = JSON.parse(match[0])
          const leads: LeadItem[] = []

          for (let i = 0; i < parsed.length; i++) {
            const p = parsed[i]
            const leadContext = {
              fullName: p.name,
              headline: p.headline,
              company: p.company,
              location: p.location || 'India / Remote',
            }
            const note = await generateConnectionNote(leadContext, userProfile, effectiveGoal, apiKey)
            const followup = await generateFollowUpMessage(leadContext, userProfile, effectiveGoal, apiKey)

            // Direct LinkedIn search URL so it instantly finds this exact person/role on LinkedIn
            const searchKeyword = p.searchQuery || `${p.name} ${p.company}`
            const profileUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchKeyword)}`

            leads.push({
              id: `dynamic-${Date.now()}-${i}`,
              name: p.name,
              headline: p.headline,
              company: p.company,
              location: p.location || 'India / Remote',
              profileUrl,
              status: 'discovered',
              note,
              followup,
            })
          }

          if (leads.length > 0) {
            return NextResponse.json({ success: true, leads, source: 'gemini' })
          }
        }
      } catch (err: any) {
        console.warn('⚠️ [Discover Leads] Gemini API call failed, falling back to smart knowledge-base:', err.message)
      }
    }

    // 2. Smart Knowledge-Base Recommendation Engine (Role-Specific)
    const candidates = getRoleBasedCandidates(effectiveTargetRole)
    const leads: LeadItem[] = []

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i]
      const note = await generateConnectionNote(c, userProfile, effectiveGoal)
      const followup = await generateFollowUpMessage(c, userProfile, effectiveGoal)

      leads.push({
        id: `role-lead-${Date.now()}-${i}`,
        name: c.fullName,
        headline: c.headline,
        company: c.company,
        location: c.location || 'India / Remote',
        profileUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(c.company + ' ' + effectiveTargetRole)}`,
        status: 'discovered',
        note,
        followup,
      })
    }

    return NextResponse.json({ success: true, leads, source: 'role-engine' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to discover leads' }, { status: 500 })
  }
}

function getRoleBasedCandidates(targetRole: string) {
  const lower = targetRole.toLowerCase()

  // AI / Machine Learning / Data Science
  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('data') || lower.includes('ml')) {
    return [
      {
        fullName: 'Kavita Sundaram',
        headline: 'Director of AI Engineering & Applied LLMs',
        company: 'Microsoft',
        location: 'Bengaluru, India',
      },
      {
        fullName: 'Arjun Mehta',
        headline: 'Staff ML Infrastructure Engineer | Generative AI',
        company: 'Google',
        location: 'Hyderabad, India',
      },
      {
        fullName: 'Neha Kapoor',
        headline: 'Tech Talent Acquisition Lead - AI & Deep Learning',
        company: 'NVIDIA',
        location: 'Pune / Bengaluru',
      },
      {
        fullName: 'Sameer Sen',
        headline: 'Engineering Manager | Foundation Models & Inference',
        company: 'Meta',
        location: 'Remote / Global',
      },
      {
        fullName: 'Rohan Deshmukh',
        headline: 'Head of Data Science & Analytics',
        company: 'Swiggy',
        location: 'Bengaluru, India',
      },
    ]
  }

  // Frontend / React / UI / Full Stack
  if (lower.includes('frontend') || lower.includes('react') || lower.includes('ui') || lower.includes('web')) {
    return [
      {
        fullName: 'Sneha Ranganathan',
        headline: 'Principal Frontend Architect | React, Next.js & Web Performance',
        company: 'Stripe',
        location: 'Remote / APAC',
      },
      {
        fullName: 'Aditya Kulkarni',
        headline: 'Engineering Manager - Core Web & Design Systems',
        company: 'Razorpay',
        location: 'Bengaluru, India',
      },
      {
        fullName: 'Pooja Varma',
        headline: 'Senior Technical Recruiter | Frontend & Product Engineering',
        company: 'Uber',
        location: 'Hyderabad, India',
      },
      {
        fullName: 'Manish Chawla',
        headline: 'VP of Engineering | Consumer Platforms',
        company: 'Zomato',
        location: 'Gurugram, India',
      },
      {
        fullName: 'Tanvi Joshi',
        headline: 'Staff Software Engineer | Design Systems & High-Scale UI',
        company: 'Atlassian',
        location: 'Bengaluru, India',
      },
    ]
  }

  // Backend / SDE / Distributed Systems / Cloud / DevOps
  if (lower.includes('backend') || lower.includes('sde') || lower.includes('devops') || lower.includes('cloud') || lower.includes('platform')) {
    return [
      {
        fullName: 'Vikram Sengupta',
        headline: 'VP of Engineering | Distributed Systems & High-Throughput Microservices',
        company: 'Swiggy',
        location: 'Bengaluru, India',
      },
      {
        fullName: 'Priya Sharma',
        headline: 'Engineering Manager | Cloud Architecture & Kubernetes',
        company: 'Microsoft',
        location: 'Bengaluru, India',
      },
      {
        fullName: 'Deepak Nair',
        headline: 'Senior Tech Lead | High-Concurrency Distributed Platforms',
        company: 'Amazon',
        location: 'Hyderabad, India',
      },
      {
        fullName: 'Ananya Deshmukh',
        headline: 'Tech Recruiter & Talent Lead | Hiring SDE-2 & Senior Backend',
        company: 'Stripe',
        location: 'Remote / India',
      },
      {
        fullName: 'Gaurav Singhania',
        headline: 'Staff Platform Engineer | SRE & Cloud Infrastructure',
        company: 'Postman',
        location: 'Bengaluru, India',
      },
    ]
  }

  // Freelance / Agency / Contractor / Solopreneur
  if (lower.includes('freelanc') || lower.includes('contract') || lower.includes('consult')) {
    return [
      {
        fullName: 'Marcus Vance',
        headline: 'Founder & CEO | Hiring Top Contract Full-Stack Engineers',
        company: 'Vance Digital Labs',
        location: 'Remote (US/Global)',
      },
      {
        fullName: 'Simran Oberoi',
        headline: 'Head of Product Engineering | Managing Remote Developer Guild',
        company: 'Nexus Scale',
        location: 'Singapore / Remote',
      },
      {
        fullName: 'David Chen',
        headline: 'Managing Director | Fractional CTO & Enterprise Tech Advisory',
        company: 'Apex Solutions',
        location: 'Remote',
      },
      {
        fullName: 'Ritika Basu',
        headline: 'Talent Partner | Specialist Contractor Networks & Tech Talent',
        company: 'Toptal Partner Network',
        location: 'Global Remote',
      },
    ]
  }

  // Generic Tech Leaders for any other Custom Role
  return [
    {
      fullName: 'Aakash Bhatt',
      headline: `Director of Engineering | Hiring for ${targetRole}`,
      company: 'Jio Platforms',
      location: 'Mumbai / Bengaluru',
    },
    {
      fullName: 'Sunita Menon',
      headline: `Talent Acquisition Lead | Specializing in ${targetRole}`,
      company: 'Tech Mahindra',
      location: 'Bengaluru, India',
    },
    {
      fullName: 'Rajesh Iyer',
      headline: `Senior Engineering Manager | Leading teams in ${targetRole}`,
      company: 'Flipkart',
      location: 'Bengaluru, India',
    },
    {
      fullName: 'Kiran Patel',
      headline: `Staff Engineer & Hiring Committee Member | ${targetRole}`,
      company: 'Oracle Cloud',
      location: 'Hyderabad, India',
    },
  ]
}
