import { getSupabaseClient } from '../supabase/supabase-client'
import { Lead } from '../supabase/types'
import { generateConnectionNote, generateFollowUpMessage, UserContext, ProfileContext } from '../ai/outreach-prompts'

export class LeadService {
  /**
   * Enriches a lead with AI-generated professional connection note & follow-up message
   */
  static async enrichLeadWithAI(leadId: string, userContext: UserContext, goal: 'networking' | 'referral' | 'recommendation' | 'mentorship' = 'networking'): Promise<Lead> {
    const supabase = getSupabaseClient()

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (error || !lead) {
      throw new Error(`Lead not found: ${error?.message || leadId}`)
    }

    const profileContext: ProfileContext = {
      fullName: lead.full_name,
      headline: lead.headline || 'Professional on LinkedIn',
      company: lead.company || 'Tech Industry',
      location: lead.location || 'India',
    }

    console.log(`🤖 [AI Enrichment] Generating personalized note for ${lead.full_name}...`)
    const note = await generateConnectionNote(profileContext, userContext, goal)
    const followup = await generateFollowUpMessage(profileContext, userContext, goal)

    const { data: updated, error: updateError } = await supabase
      .from('leads')
      .update({
        generated_note: note,
        generated_followup: followup,
      })
      .eq('id', leadId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return updated as Lead
  }

  /**
   * Approves a lead for the outreach bot queue
   */
  static async approveLead(leadId: string, customNote?: string): Promise<void> {
    const supabase = getSupabaseClient()
    const updatePayload: any = { status: 'approved' }

    if (customNote) {
      updatePayload.generated_note = customNote
    }

    const { error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', leadId)

    if (error) throw error
  }

  /**
   * Rejects or archives a lead
   */
  static async rejectLead(leadId: string, reason?: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('leads')
      .update({ status: 'rejected', notes: reason || 'Dismissed by user' })
      .eq('id', leadId)

    if (error) throw error
  }

  /**
   * Fetches pipeline counts grouped by status
   */
  static async getPipelineMetrics(): Promise<Record<string, number>> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('leads').select('status')

    if (error || !data) {
      return { discovered: 0, approved: 0, queued: 0, invite_sent: 0, connected: 0, replied: 0 }
    }

    const counts: Record<string, number> = {
      discovered: 0,
      approved: 0,
      queued: 0,
      invite_sent: 0,
      connected: 0,
      replied: 0,
      rejected: 0,
    }

    data.forEach((row) => {
      if (counts[row.status] !== undefined) {
        counts[row.status]++
      }
    })

    return counts
  }
}
