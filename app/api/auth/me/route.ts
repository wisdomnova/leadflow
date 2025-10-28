import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) { 
  try {
    console.log('🔍 Checking auth...')
    
    const token = request.cookies.get('auth-token')?.value
    console.log('🍪 Token from cookie:', !!token)

    if (!token) {
      console.log('❌ No token found')
      return NextResponse.json({ error: 'No token found' }, { status: 401 })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET not found')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    console.log('✅ Token decoded:', decoded)

    // Get user with organization - only select columns that exist
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        organizations (
          id,
          name,
          trial_ends_at,
          subscription_status,
          created_at
        )
      `)
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      console.log('❌ User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return user without password
    const { password_hash, ...userWithoutPassword } = userData
    console.log('✅ User found:', userWithoutPassword.email)

    return NextResponse.json({ 
      success: true, 
      user: userWithoutPassword 
    })

  } catch (error) {
    console.error('❌ Auth check error:', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}