import { getSupabaseClient } from '../supabase/supabase-client'

async function verifyDatabase() {
  console.log('🔍 [Database Check] Verifying connection to Supabase...')
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('bot_settings')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ [Database Check Failed]:', error.message)
      console.log('👉 Make sure you ran supabase/schema.sql in your Supabase SQL editor!')
      process.exit(1)
    }

    console.log('✅ [Database Check Passed]: Successfully connected to Supabase!')
    console.log('📊 Bot Settings Rows:', data)
  } catch (err: any) {
    console.error('❌ [Unexpected Error]:', err.message || err)
    process.exit(1)
  }
}

verifyDatabase()
