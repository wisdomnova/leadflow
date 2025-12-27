import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = rateLimit({ key: `upgrade:${ip}`, limit: 10, windowMs: 60_000 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId, billingCycle = 'monthly' } = body

    const validCycles = ['monthly', 'yearly']
    if (!validCycles.includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 })
    }

    if (!planId) {
      return NextResponse.json(
        { error: 'Missing planId' },
        { status: 400 }
      )
    }

    // Call the create-checkout-session endpoint
    const checkoutRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: payload.userId,
        planId,
        billingCycle,
      }),
    })

    if (!checkoutRes.ok) {
      const error = await checkoutRes.json()
      return NextResponse.json(error, { status: checkoutRes.status })
    }

    const checkoutData = await checkoutRes.json()
    return NextResponse.json(checkoutData)
  } catch (error) {
    console.error('Error creating upgrade session:', error)
    return NextResponse.json(
      { error: 'Failed to create upgrade session' },
      { status: 500 }
    )
  }
}
