// scripts/test-manual-polling.ts
import { pollInboxes } from '../lib/email-oauth/inbox-poller'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testManualPolling() {
  console.log('🔧 Testing manual inbox polling...')
  
  try {
    // Check current inbox message count
    const { count: beforeCount } = await supabase
      .from('inbox_messages')
      .select('id', { count: 'exact' })
    
    console.log(`📊 Inbox messages before polling: ${beforeCount}`)
    
    // Run inbox polling
    console.log('🔄 Running inbox polling...')
    await pollInboxes()
    
    // Check inbox message count after polling
    const { count: afterCount } = await supabase
      .from('inbox_messages')
      .select('id', { count: 'exact' })
    
    console.log(`📊 Inbox messages after polling: ${afterCount}`)
    
    if (afterCount && beforeCount && afterCount > beforeCount) {
      console.log(`✅ Successfully processed ${afterCount - beforeCount} new emails!`)
      
      // Show the latest messages
      const { data: latestMessages } = await supabase
        .from('inbox_messages')
        .select('id, subject, from_email, classification, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('\n📧 Latest inbox messages:')
      latestMessages?.forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg.subject} - ${msg.from_email} (${msg.classification})`)
      })
    } else {
      console.log('ℹ️  No new emails processed this time')
    }
    
  } catch (error) {
    console.error('❌ Manual polling test failed:', error)
  }
}

testManualPolling().catch(console.error)