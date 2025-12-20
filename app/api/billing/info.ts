import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

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

    // Get user billing info
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

    return NextResponse.json({
      billingInfo: {
        companyName: user.company_name || 'Not provided',
        email: user.email,
        fullName: user.full_name || 'Not provided',
        address: 'Not provided',
        taxId: 'Not provided',
      },
    })
  } catch (error) {
    console.error('Error fetching billing info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing info' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { companyName, fullName } = body

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        company_name: companyName,
        full_name: fullName,
      })
      .eq('id', payload.userId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update billing info' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      billingInfo: {
        companyName: updatedUser.company_name,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
      },
    })
  } catch (error) {
    console.error('Error updating billing info:', error)
    return NextResponse.json(
      { error: 'Failed to update billing info' },
      { status: 500 }
    )
  }
}
