import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Get user from database with fresh data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        email_verified_at,
        trial_ends_at,
        subscription_status,
        organization_id,
        created_at,
        updated_at,
        deleted_at
      `)
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user account is active
    if (user.deleted_at) {
      return NextResponse.json({ error: 'Account deactivated' }, { status: 403 })
    }

    return NextResponse.json({ 
      user,
      valid: true 
    })

  } catch (error) {
    console.error('Token verification error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Token verification failed' }, { status: 500 })
  }
}