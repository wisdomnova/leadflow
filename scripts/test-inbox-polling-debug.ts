// scripts/test-inbox-polling-debug.ts
import { createClient } from '@supabase/supabase-js'
import { pollInboxes } from '../lib/email-oauth/inbox-poller'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debugInboxPolling() {
  console.log('🔧 Testing inbox polling with debug info...')
  
  try {
    // Check email accounts
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .in('status', ['active', 'warming_up'])
    
    if (error) {
      console.error('❌ Error fetching accounts:', error)
      return
    }
    
    console.log(`📧 Found ${accounts?.length || 0} active email accounts`)
    
    for (const account of accounts || []) {
      console.log(`\n📋 Account: ${account.email}`)
      console.log(`   Provider: ${account.provider}`)
      console.log(`   Status: ${account.status}`)
      console.log(`   Expires at: ${account.expires_at}`)
      
      const expiresAt = new Date(account.expires_at)
      const now = new Date()
      const isExpired = expiresAt <= now
      
      console.log(`   Token expired: ${isExpired ? 'YES' : 'NO'}`)
      
      if (isExpired) {
        console.log(`   ⚠️  Token expired ${Math.round((now.getTime() - expiresAt.getTime()) / 1000 / 60)} minutes ago`)
      } else {
        console.log(`   ✅ Token expires in ${Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60)} minutes`)
      }
    }
    
    console.log('\n🚀 Starting inbox polling test...')
    await pollInboxes()
    
  } catch (error) {
    console.error('❌ Debug test failed:', error)
  }
}

debugInboxPolling().catch(console.error)