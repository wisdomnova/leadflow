// ./app/api/track/click/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trackingId } = await params
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')

    if (!targetUrl) {
      console.error('No target URL provided for click tracking')
      return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || 'https://leadflow.com')
    } 

    const trackingData = EmailService.decodeTrackingId(trackingId)

    if (trackingData) {
      // Get user agent and IP for analytics
      const userAgent = request.headers.get('user-agent') || undefined
      const forwardedFor = request.headers.get('x-forwarded-for')
      const realIp = request.headers.get('x-real-ip')
      const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined

      // Log click event
      await EmailService.logEmailEvent({
        campaignId: trackingData.campaignId,
        contactId: trackingData.contactId, 
        stepNumber: trackingData.stepNumber,
        type: 'click',
        messageId: undefined,
        url: decodeURIComponent(targetUrl),
        userAgent,
        ipAddress
      })
    }

    // Redirect to original URL
    const decodedUrl = decodeURIComponent(targetUrl)
    
    // Validate URL format
    try {
      new URL(decodedUrl)
      return NextResponse.redirect(decodedUrl)
    } catch (urlError) {
      console.error('Invalid URL format:', decodedUrl)
      return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || 'https://leadflow.com')
    }

  } catch (error) {
    console.error('Click tracking error:', error)
    
    // Fallback redirect on error
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')
    
    if (targetUrl) {
      try {
        const decodedUrl = decodeURIComponent(targetUrl)
        new URL(decodedUrl) // Validate URL
        return NextResponse.redirect(decodedUrl)
      } catch (urlError) {
        console.error('Fallback URL validation failed:', urlError)
      }
    }
    
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || 'https://leadflow.com')
  }
}