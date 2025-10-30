// scripts/test-inbox-polling-complete.ts
import { createClient } from '@supabase/supabase-js'
import { ReplyDetectionService } from '../lib/reply-detection'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testInboxPollingComplete() {
  console.log('🔧 Testing complete inbox polling with database saving...')
  
  try {
    // 1. Check database tables
    console.log('\n📋 Checking database tables...')
    
    const { count: messageCount } = await supabase
      .from('inbox_messages')
      .select('id', { count: 'exact' })
    
    console.log(`📊 Current inbox_messages count: ${messageCount}`)
    
    // 2. Check active email accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .in('status', ['active', 'warming_up'])
      .limit(1)
    
    if (accountsError || !accounts?.length) {
      console.error('❌ No active email accounts found:', accountsError)
      return
    }
    
    const testAccount = accounts[0]
    console.log(`📧 Testing with account: ${testAccount.email}`)
    console.log(`   Organization: ${testAccount.organization_id}`)
    
    // 3. Test ReplyDetectionService with a sample email
    console.log('\n🧪 Testing ReplyDetectionService.processIncomingEmail...')
    
    const sampleEmail = {
      message_id: `test_${Date.now()}`,
      subject: 'Test Email for Inbox Processing',
      content: 'This is a test email to verify that inbox processing is working correctly.',
      html_content: '<p>This is a test email to verify that inbox processing is working correctly.</p>',
      from_email: 'test@example.com',
      from_name: 'Test User',
      to_email: testAccount.email,
      to_name: testAccount.display_name || 'Test Recipient',
      headers: {
        'message-id': `<test_${Date.now()}@example.com>`,
        'date': new Date().toISOString()
      },
      received_at: new Date().toISOString()
    }
    
    try {
      const result = await ReplyDetectionService.processIncomingEmail(
        sampleEmail,
        testAccount.organization_id
      )
      
      console.log('✅ ReplyDetectionService processed email successfully:')
      console.log(`   Message ID: ${result.id}`)
      console.log(`   Subject: ${result.subject}`)
      console.log(`   From: ${result.from_email}`)
      console.log(`   Classification: ${result.classification}`)
      console.log(`   Sentiment Score: ${result.sentiment_score}`)
      
      // 4. Verify the message was saved to database
      const { count: newMessageCount } = await supabase
        .from('inbox_messages')
        .select('id', { count: 'exact' })
      
      console.log(`📊 New inbox_messages count: ${newMessageCount}`)
      
      if (newMessageCount && newMessageCount > (messageCount || 0)) {
        console.log('✅ Email successfully saved to inbox_messages!')
      } else {
        console.log('❌ Email may not have been saved to inbox_messages')
      }
      
      // 5. Check if classification was saved
      const { data: classification } = await supabase
        .from('message_classifications')
        .select('*')
        .eq('message_id', result.id)
        .single()
      
      if (classification) {
        console.log('✅ AI classification saved successfully:')
        console.log(`   Intent: ${classification.intent}`)
        console.log(`   Sentiment: ${classification.sentiment}`)
        console.log(`   Confidence: ${classification.confidence}`)
      } else {
        console.log('❌ AI classification may not have been saved')
      }
      
    } catch (processError) {
      console.error('❌ ReplyDetectionService failed:', processError)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testInboxPollingComplete().catch(console.error)