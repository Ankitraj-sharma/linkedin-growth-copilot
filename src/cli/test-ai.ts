import { generateConnectionNote, generateFollowUpMessage } from '../ai/outreach-prompts'
import { generateViralPost } from '../ai/content-creator'

async function runTest() {
  console.log('================================================================')
  console.log('🤖 LinkedIn Growth Copilot - AI Engine Test')
  console.log('================================================================\n')

  const sampleLead = {
    fullName: 'Priya Sharma',
    headline: 'Engineering Manager at Microsoft | Distributed Systems & Cloud',
    company: 'Microsoft',
    location: 'Bengaluru, India',
  }

  const sampleUser = {
    fullName: 'Ankit Raj Sharma',
    currentRole: 'Full Stack Engineer',
    skills: ['React', 'Next.js', 'Node.js', 'TypeScript', 'System Design'],
    targetRole: 'SDE-2 / Senior Frontend Engineer',
  }

  console.log('1️⃣ Generating Safe & Professional Connection Note (<300 chars)...')
  const note = await generateConnectionNote(sampleLead, sampleUser, 'referral')
  console.log('📝 Result Note:\n----------------------------------------')
  console.log(note)
  console.log('----------------------------------------')
  console.log(`Character count: ${note.length}/300\n`)

  console.log('2️⃣ Generating Follow-Up Recommendation/Referral Message...')
  const followup = await generateFollowUpMessage(sampleLead, sampleUser, 'referral')
  console.log('💬 Result Follow-up:\n----------------------------------------')
  console.log(followup)
  console.log('----------------------------------------\n')

  console.log('3️⃣ Generating Algorithm-Optimized Viral LinkedIn Post...')
  const post = await generateViralPost({
    topic: 'How Junior vs Senior Engineers handle Production Bugs',
    framework: 'hook_value_cta',
  })
  console.log('🚀 Result Post:\n----------------------------------------')
  console.log(post.content)
  console.log('----------------------------------------')
  console.log('Hooks:', post.hookVariations)
  console.log('Hashtags:', post.suggestedHashtags.join(' '))
  console.log('\n✅ AI Engine test completed successfully!')
}

runTest().catch(console.error)
