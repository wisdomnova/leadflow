// app/api/usage/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { campaignId, emailAccountId, contactId } = await request.json()

    // Increment monthly usage using database function
    const { error: updateError } = await supabase.rpc('increment_monthly_usage', {
      p_user_id: user.id
    })

    if (updateError) {
      console.error('Failed to increment usage:', updateError)
      throw updateError
    }

    console.log('✅ Usage tracked for user:', user.id, {
      campaignId,
      emailAccountId,
      contactId
    })

    return NextResponse.json({ 
      success: true,
      message: 'Usage tracked successfully'
    })
  } catch (error: any) {
    console.error('❌ Usage tracking error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to track usage' }, 
      { status: 500 }
    )
  }
}