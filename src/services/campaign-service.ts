import { getSupabaseClient } from '../supabase/supabase-client'
import { Campaign } from '../supabase/types'

export class CampaignService {
  static async listCampaigns(): Promise<Campaign[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Campaign[]
  }

  static async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name: campaign.name || 'New Networking Campaign',
        target_role: campaign.target_role || 'Engineering Lead',
        target_industry: campaign.target_industry || 'Tech',
        target_location: campaign.target_location || 'India / Remote',
        goal_type: campaign.goal_type || 'networking',
        daily_limit: campaign.daily_limit || 15,
        user_context: campaign.user_context || '',
      })
      .select()
      .single()

    if (error) throw error
    return data as Campaign
  }

  static async updateStatus(campaignId: string, status: 'active' | 'paused' | 'completed'): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', campaignId)

    if (error) throw error
  }
}
