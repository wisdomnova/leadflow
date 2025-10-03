// app/api/track/referral/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { AffiliateManager } from '@/lib/affiliate/affiliate-manager'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ref = url.searchParams.get('ref')
    
    if (!ref) {
      return NextResponse.redirect(new URL('/auth/sign-up', request.url))
    }

    // Get client info for tracking
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || ''
    
    // Track the click
    await AffiliateManager.trackClick(ref, {
      ip_address: ip,
      user_agent: userAgent,
      referer: referer,
      utm_source: url.searchParams.get('utm_source') || undefined,
      utm_medium: url.searchParams.get('utm_medium') || undefined,
      utm_campaign: url.searchParams.get('utm_campaign') || undefined
    })

    // Set referral cookie and redirect to signup
    const response = NextResponse.redirect(new URL('/auth/sign-up', request.url))
    response.cookies.set('referral_code', ref, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response

  } catch (error) {
    console.error('Referral tracking error:', error)
    return NextResponse.redirect(new URL('/auth/sign-up', request.url))
  }
}