import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

function getPayload(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request: NextRequest) {
  try {
    const payload = getPayload(request)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, company_name, role, plan_id, billing_cycle, created_at, last_login')
      .eq('id', payload.userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        companyName: user.company_name,
        role: user.role,
        billingCycle: user.billing_cycle,
        planId: user.plan_id,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = getPayload(request)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, companyName } = body

    if (!fullName && !companyName) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const updates: Record<string, string> = {}
    if (fullName) updates.full_name = fullName
    if (companyName) updates.company_name = companyName

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', payload.userId)
      .select('id, email, full_name, company_name, role, plan_id, billing_cycle, created_at, last_login')
      .single()

    if (error || !updatedUser) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        companyName: updatedUser.company_name,
        role: updatedUser.role,
        billingCycle: updatedUser.billing_cycle,
        planId: updatedUser.plan_id,
        createdAt: updatedUser.created_at,
        lastLogin: updatedUser.last_login,
      },
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
