import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params
    
    // Parse tracking ID to get campaign and contact info
    const [campaignId, contactId] = trackingId.split('_')
    
    if (campaignId && contactId) {
      // Record the open event
      await supabase 
        .from('email_events')
        .insert([{
          campaign_id: campaignId,
          contact_id: contactId,
          event_type: 'open',
          tracking_id: trackingId,
          metadata: {
            user_agent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        }])

      // Update campaign contact status if this is their first open
      await supabase
        .from('campaign_contacts')
        .update({
          status: 'opened',
          opened_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .eq('contact_id', contactId)
        .in('status', ['sent', 'delivered']) // Only update if not already clicked/bounced etc
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    
    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Open tracking error:', error)
    
    // Still return pixel even if tracking fails
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    return new NextResponse(pixel, {
      headers: { 'Content-Type': 'image/gif' }
    })
  }
}
