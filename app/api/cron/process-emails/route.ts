// app/api/cron/process-email-queue/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendCampaignEmail } from '@/lib/campaign-email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Verify request is from Supabase
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
  // Get pending emails that are due to be sent
  const { data: queuedEmails, error } = await supabase
    .from('email_queue')
    .select(`
      *,
      email_accounts (*),
      contacts (email, first_name, last_name)
    `)
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
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

      // Replace variables in subject and body
      const processedSubject = replaceVariables(email.subject, email.variables, email.contacts)
      const processedBody = replaceVariables(email.body, email.variables, email.contacts)

      // Send email
      const result = await sendCampaignEmail({
        emailAccountId: email.email_account_id,
        to: email.contacts.email,
        subject: processedSubject,
        body: processedBody
      })

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

      console.log(`✅ Sent email to ${email.contacts.email}`)

    } catch (error: any) {
      console.error(`❌ Error sending email to ${email.contacts?.email}:`, error)

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
  let result = text
  
  // Replace contact variables
  result = result.replace(/\{\{first_name\}\}/g, contact.first_name || '')
  result = result.replace(/\{\{last_name\}\}/g, contact.last_name || '')
  result = result.replace(/\{\{email\}\}/g, contact.email || '')
  
  // Replace custom variables
  if (variables && typeof variables === 'object') {
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, variables[key] || '')
    })
  }
  
  return result
}