// scripts/verify-inbox-db.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyInboxDatabase() {
  console.log('🔍 Verifying inbox database tables...')
  
  try {
    // Test inbox_messages table
    console.log('\n📋 Checking inbox_messages table...')
    const { data: messages, error: messagesError } = await supabase
      .from('inbox_messages')
      .select('*')
      .limit(1)
    
    if (messagesError) {
      console.error('❌ Error with inbox_messages table:', messagesError)
    } else {
      console.log('✅ inbox_messages table exists')
      console.log('📊 Current message count:', (await supabase.from('inbox_messages').select('id', { count: 'exact' })).count)
    }
    
    // Test message_classifications table
    console.log('\n🤖 Checking message_classifications table...')
    const { data: classifications, error: classError } = await supabase
      .from('message_classifications')
      .select('*')
      .limit(1)
    
    if (classError) {
      console.error('❌ Error with message_classifications table:', classError)
    } else {
      console.log('✅ message_classifications table exists')
      console.log('📊 Current classification count:', (await supabase.from('message_classifications').select('id', { count: 'exact' })).count)
    }
    
    // Test email_threads table
    console.log('\n🧵 Checking email_threads table...')
    const { data: threads, error: threadsError } = await supabase
      .from('email_threads')
      .select('*')
      .limit(1)
    
    if (threadsError) {
      console.error('❌ Error with email_threads table:', threadsError)
    } else {
      console.log('✅ email_threads table exists')
      console.log('📊 Current thread count:', (await supabase.from('email_threads').select('id', { count: 'exact' })).count)
    }
    
    // Check email accounts that should receive emails
    console.log('\n📧 Checking active email accounts...')
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('email, provider, status, organization_id')
      .in('status', ['active', 'warming_up'])
    
    if (accountsError) {
      console.error('❌ Error fetching email accounts:', accountsError)
    } else {
      console.log('✅ Active email accounts:')
      accounts?.forEach(account => {
        console.log(`   - ${account.email} (${account.provider}) - ${account.status} - org: ${account.organization_id}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Database verification failed:', error)
  }
}

verifyInboxDatabase().catch(console.error)