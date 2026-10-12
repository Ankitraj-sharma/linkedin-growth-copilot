import { getSupabaseClient } from '../supabase/supabase-client'
import { Post } from '../supabase/types'
import { generateViralPost, PostRequest } from '../ai/content-creator'

export class PostService {
  /**
   * Generates a viral post using Gemini AI and stores it as a draft in Supabase
   */
  static async createDraftFromTopic(request: PostRequest): Promise<Post> {
    const supabase = getSupabaseClient()
    const generated = await generateViralPost(request)

    const { data, error } = await supabase
      .from('posts')
      .insert({
        topic: request.topic,
        content: generated.content,
        framework: generated.framework,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error
    return data as Post
  }

  /**
   * Schedules a post for a specific time
   */
  static async schedulePost(postId: string, scheduledAt: Date): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('posts')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledAt.toISOString(),
      })
      .eq('id', postId)

    if (error) throw error
  }

  /**
   * Lists posts optionally filtered by status
   */
  static async listPosts(status?: string): Promise<Post[]> {
    const supabase = getSupabaseClient()
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as Post[]
  }
}
