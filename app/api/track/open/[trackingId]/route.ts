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
    
    console.log(`🔍 Open tracking debug:`, {
      trackingId,
      campaignId,
      contactId,
      fullUrl: request.url
    })
    
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

        console.log(`Logged open event for tracking ID: ${trackingId}`)

      // Update campaign contact status if this is their first open
      const { data: updateResult, error: updateError } = await supabase
        .from('campaign_contacts')
        .update({
          status: 'opened',
          opened_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .eq('contact_id', contactId)
        .in('status', ['sent', 'delivered']) // Only update if not already clicked/bounced etc
        .select()

      console.log(`📊 Campaign contact update result:`, {
        campaignId,
        contactId,
        updateResult,
        updateError,
        rowsUpdated: updateResult?.length || 0
      })

      // Debug: Check what campaign_contacts exist for this campaign
      const { data: existingContacts } = await supabase
        .from('campaign_contacts')
        .select('id, campaign_id, contact_id, status, email')
        .eq('campaign_id', campaignId)
        .limit(5)

      console.log(`🔎 Existing campaign_contacts for campaign ${campaignId}:`, existingContacts)
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
