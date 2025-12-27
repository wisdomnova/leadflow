import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('id, name, description, price_monthly, price_yearly, email_limit, user_limit, features, stripe_price_id_monthly, stripe_price_id_yearly')
      .order('price_monthly', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 })
    }

    const plans = (data || []).map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.price_monthly ?? 0,
      annualPrice: plan.price_yearly ?? 0,
      emailLimit: plan.email_limit,
      userLimit: plan.user_limit,
      features: plan.features || [],
      monthlyPriceId: plan.stripe_price_id_monthly,
      annualPriceId: plan.stripe_price_id_yearly,
    }))

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error loading plans:', error)
    return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 })
  }
}
