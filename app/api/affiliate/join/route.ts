// app/api/affiliate/join/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AffiliateManager } from '@/lib/affiliate/affiliate-manager'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { payment_email, payment_method, payment_details } = await request.json()

    // Check if user already has affiliate account
    const existingAffiliate = await AffiliateManager.getAffiliateByUserId(decoded.userId)
    if (existingAffiliate) {
      return NextResponse.json({ error: 'Affiliate account already exists' }, { status: 400 })
    }

    // Create affiliate account
    const affiliate = await AffiliateManager.createAffiliate(decoded.userId, {
      payment_email,
      payment_method,
      payment_details
    })

    return NextResponse.json({ 
      success: true, 
      affiliate: {
        id: affiliate.id,
        affiliate_code: affiliate.affiliate_code,
        referral_link: affiliate.referral_link,
        status: affiliate.status
      }
    })

  } catch (error) {
    console.error('Affiliate join error:', error)
    return NextResponse.json({ error: 'Failed to create affiliate account' }, { status: 500 })
  }
}