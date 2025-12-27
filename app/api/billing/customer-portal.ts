import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { verifyToken } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-11-17.clover' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value
    const payload = token ? verifyToken(token) : null
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', payload.userId)
      .single()

    if (error || !user?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/settings/billing`
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('Portal session error', e)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
