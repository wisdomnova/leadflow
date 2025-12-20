import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: NextRequest) {
  try {
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

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get payment methods from Stripe
    const paymentMethods: any[] = []
    
    if (user.stripe_customer_id) {
      const methods = await stripe.paymentMethods.list({
        customer: user.stripe_customer_id,
        type: 'card',
      })

      methods.data.forEach((method, idx) => {
        if (method.card) {
          paymentMethods.push({
            id: method.id,
            type: method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1),
            last4: method.card.last4,
            expires: `${method.card.exp_month}/${method.card.exp_year}`,
            isDefault: idx === 0,
          })
        }
      })
    }

    return NextResponse.json({
      paymentMethods,
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}
