import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) { 
  try {
    const { trackingId } = await params
    const { searchParams } = new URL(request.url)
    const originalUrl = searchParams.get('url')
    
    if (!originalUrl) {
      return NextResponse.redirect('/')
    }

    // Parse tracking ID to get campaign and contact info
    const [campaignId, contactId] = trackingId.split('_')
    
    if (campaignId && contactId) {
      // Record the click event
      await supabase
        .from('email_events')
        .insert([{
          campaign_id: campaignId,
          contact_id: contactId,
          event_type: 'click',
          tracking_id: trackingId,
          metadata: {
            url: originalUrl,
            user_agent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        }])

            // Update campaign contact status to 'clicked' 
      const { error: updateError } = await supabase
        .from('campaign_contacts')
        .update({
          status: 'clicked',
          clicked_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .eq('contact_id', contactId)
        .in('status', ['sent', 'delivered', 'opened']) // Update from sent, delivered, or opened

      // If email wasn't already marked as delivered, create delivery event since clicking confirms delivery
      if (!updateError) {
        const { data: existingDelivery } = await supabase
          .from('email_events')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('contact_id', contactId)
          .eq('event_type', 'delivered')
          .limit(1)

        if (!existingDelivery || existingDelivery.length === 0) {
          // Create delivery event since clicking confirms delivery
          await supabase
            .from('email_events')
            .insert({
              campaign_id: campaignId,
              contact_id: contactId,
              event_type: 'delivered',
              tracking_id: trackingId,
              metadata: {
                delivery_method: 'click_confirmation',
                reason: 'Email clicked confirms delivery',
                timestamp: new Date().toISOString()
              }
            })
        }
      }
    }

    // Redirect to original URL
    return NextResponse.redirect(originalUrl)
  } catch (error) {
    console.error('Click tracking error:', error)
    
    // Still redirect to original URL even if tracking fails
    const { searchParams } = new URL(request.url)
    const originalUrl = searchParams.get('url')
    return NextResponse.redirect(originalUrl || '/')
  }
}
