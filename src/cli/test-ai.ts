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

  console.log('3️⃣ Generating Algorithm-Optimized Viral LinkedIn Post (Hinglish Startup Journey)...')
  const post1 = await generateViralPost({
    topic: 'Maine ek chai ki dukan shuru ki thi or 6 mahine me 10 lakh ka business banaya',
    framework: 'storytelling',
    tone: 'inspiring',
  })
  console.log('🚀 Result Post 1 (Storytelling):\n----------------------------------------')
  console.log(post1.content)
  console.log('----------------------------------------')
  console.log('Hooks:', post1.hookVariations)
  console.log('Hashtags:', post1.suggestedHashtags.join(' '))

  console.log('\n4️⃣ Generating Hot Take on arbitrary workplace topic...')
  const post2 = await generateViralPost({
    topic: 'Why 8-hour workdays kill productivity in knowledge work',
    framework: 'hot_take',
    tone: 'contrarian',
  })
  console.log('🚀 Result Post 2 (Hot Take):\n----------------------------------------')
  console.log(post2.content)
  console.log('----------------------------------------')
  console.log('\n✅ AI Engine test completed successfully!')
}

runTest().catch(console.error)
