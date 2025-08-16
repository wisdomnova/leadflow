import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Find user with organization data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        organizations (
          id,
          name,
          trial_ends_at,
          subscription_status
        )
      `)
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, userData.password_hash)
    
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Check email verification
    if (!userData.email_verified) {
      return NextResponse.json({ 
        error: 'Please verify your email address before logging in. Check your email for the verification link.',
        requiresVerification: true,
        email: userData.email
      }, { status: 403 })
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: userData.id, 
        email: userData.email,
        organizationId: userData.organization_id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Update last login
    await supabase
      .from('users')
      .update({ 
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id)

    // Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          organization_id: userData.organization_id,
          user_id: userData.id,
          action: 'user_login',
          description: 'User logged in successfully'
        }])
    } catch (logError) {
      console.warn('Failed to log login activity:', logError)
    }

    // Return user without password
    const { password_hash, ...userWithoutPassword } = userData

    const response = NextResponse.json({ 
      success: true, 
      user: {
        ...userWithoutPassword,
        organization: userData.organizations
      },
      token,
      message: 'Login successful'
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}