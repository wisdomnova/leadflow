// app/api/cron/process-emails/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendCampaignEmail } from '@/lib/campaign-email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Handle both GET and POST requests for flexibility
export async function GET(request: NextRequest) {
  return handleEmailProcessing(request)
}

export async function POST(request: NextRequest) {
  return handleEmailProcessing(request)
}

async function handleEmailProcessing(request: NextRequest) {
  try {
    // Verify request is authorized
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await processEmailQueue() 
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email queue processed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function processEmailQueue() {
  // Get pending emails that are due to be sent - fix the join
  const { data: queuedEmails, error } = await supabase
    .from('email_queue')
    .select(`
      *,
      email_accounts (*),
      campaign_contacts!inner(
        id,
        email,
        first_name,
        last_name,
        company,
        phone
      )
    `)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(50)

  if (error) {
    console.error('Error fetching queue:', error)
    throw error
  }

  if (!queuedEmails || queuedEmails.length === 0) {
    console.log('No emails in queue')
    return
  }

  console.log(`Processing ${queuedEmails.length} emails...`)

  for (const email of queuedEmails) {
    try {
      // Skip if email account doesn't exist or is not active
      if (!email.email_accounts || 
          !['active', 'warming_up'].includes(email.email_accounts.status)) {
        await supabase
          .from('email_queue')
          .update({ 
            status: 'failed',
            error_message: 'Email account not active'
          })
          .eq('id', email.id)
        continue
      }

      // Update status to sending
      await supabase
        .from('email_queue')
        .update({ status: 'sending' })
        .eq('id', email.id)

      // Replace variables in subject and body - use campaign_contacts data
      // const processedSubject = replaceVariables(email.subject, email.variables, email.campaign_contacts)
      // const processedBody = replaceVariables(email.body, email.variables, email.campaign_contacts)

      // Send email
      const result = await sendCampaignEmail({
        emailAccountId: email.email_account_id,
        to: email.campaign_contacts.email,
        subject: email.subject,
        body: email.body
      });

      console.log(`Sending email to: ${email.campaign_contacts.email}`, `with subject: ${email.subject}`, `and body: ${email.body}`);

      // Update status to sent
      await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          message_id: result.messageId,
          thread_id: result.threadId || null
        })
        .eq('id', email.id)

      console.log(`✅ Sent email to ${email.campaign_contacts.email}`)

    } catch (error: any) {
      console.error(`❌ Error sending email to ${email.campaign_contacts?.email}:`, error)

      // Update status to failed
      await supabase
        .from('email_queue')
        .update({
          status: 'failed',
          error_message: error.message,
          retry_count: (email.retry_count || 0) + 1
        })
        .eq('id', email.id)
    }

    // Add delay between emails (rate limiting)
    await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
  }
}

function replaceVariables(text: string, variables: any, contact: any) {
  // Add null check
  if (!text || typeof text !== 'string') {
    return text || ''
  }
  
  let result = text
  
  // Replace contact variables with null checks
  result = result.replace(/\{\{first_name\}\}/g, contact?.first_name || '')
  result = result.replace(/\{\{last_name\}\}/g, contact?.last_name || '')
  result = result.replace(/\{\{email\}\}/g, contact?.email || '')
  result = result.replace(/\{\{company\}\}/g, contact?.company || '')
  
  // Replace custom variables
  if (variables && typeof variables === 'object') {
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, variables[key] || '')
    })
  }
  
  return result
}