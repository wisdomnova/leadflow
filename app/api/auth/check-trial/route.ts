import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Get user trial and subscription info 
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('trial_ends_at, subscription_status, plan_type')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const trialEnd = user.trial_ends_at ? new Date(user.trial_ends_at) : null
    const trialExpired = trialEnd ? now > trialEnd : false

    return NextResponse.json({
      trialExpired,
      subscriptionStatus: user.subscription_status,
      planType: user.plan_type,
      trialEndsAt: user.trial_ends_at
    })

  } catch (error) {
    console.error('Trial check error:', error)
    return NextResponse.json({ error: 'Trial check failed' }, { status: 500 })
  }
}