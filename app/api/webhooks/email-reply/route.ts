import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { classifyReply } from '@/lib/ai-reply-classifier'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-webhook-secret')
    if (secret !== process.env.EMAIL_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message_id, from_email, subject, body_text, body_html, received_at } = body

    if (!message_id || !from_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find original campaign send by message_id
    const { data: send, error: sendErr } = await supabase
      .from('campaign_sends')
      .select('id, campaign_id, contact_id, user_id')
      .eq('message_id', message_id)
      .limit(1)
      .maybeSingle()

    if (sendErr) {
      console.error('Find send error:', sendErr)
    }

    // Classify reply with AI
    const classification = await classifyReply(body_text || body_html || '')

    // Store reply
    const { error: replyErr } = await supabase
      .from('email_replies')
      .insert({
        user_id: send?.user_id || null,
        campaign_send_id: send?.id || null,
        contact_id: send?.contact_id || null,
        from_email,
        subject,
        body_text,
        body_html,
        received_at: received_at || new Date().toISOString(),
        reply_category: classification.category,
        sentiment_score: classification.sentiment,
        metadata: { summary: classification.summary },
      })

    if (replyErr) {
      console.error('Store reply error:', replyErr)
      return NextResponse.json({ error: replyErr.message }, { status: 400 })
    }

    // Update campaign_send replied_at
    if (send?.id) {
      await supabase
        .from('campaign_sends')
        .update({ replied_at: received_at || new Date().toISOString(), status: 'replied' })
        .eq('id', send.id)
    }

    return NextResponse.json({ ok: true, category: classification.category })
  } catch (error) {
    console.error('Reply webhook error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
