// ./app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { EmailService } from '@/lib/email-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign')
    const contactId = searchParams.get('contact')

    if (!campaignId || !contactId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe-error`)
    }

    // Log unsubscribe event
    await EmailService.logEmailEvent({
      campaignId,
      contactId,
      stepNumber: 1,
      type: 'unsubscribe'
    })

    // Redirect to unsubscribe confirmation page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe-success?campaign=${campaignId}&contact=${contactId}`
    )

  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe-error`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { campaignId, contactId, email } = await request.json()

    // Update contact status to unsubscribed
    await supabase
      .from('campaign_contacts')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .eq('campaign_id', campaignId)

    // Log unsubscribe event
    await EmailService.logEmailEvent({
      campaignId,
      contactId,
      stepNumber: 1,
      type: 'unsubscribe',
      metadata: { email, unsubscribeMethod: 'manual' }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unsubscribe POST error:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}