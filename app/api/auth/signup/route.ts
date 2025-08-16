import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { sendEmail } from '@/lib/resend'
import { emailVerificationTemplate } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, companyName } = await request.json()

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users') 
      .select('id, email_verified')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      if (existingUser.email_verified) {
        return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 })
      } else {
        return NextResponse.json({ 
          error: 'Account exists but email not verified. Please check your email for verification link.' 
        }, { status: 400 })
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create organization first
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: companyName || `${firstName} ${lastName}'s Organization`,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
      }])
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Generate email verification token
    const verificationToken = jwt.sign(
      { email: email.toLowerCase(), type: 'email_verification' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        organization_id: orgData.id,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_expires_at: verificationExpires.toISOString()
      }])
      .select()
      .single()

    if (userError) {
      console.error('User creation error:', userError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Update verification token with user ID
    const finalVerificationToken = jwt.sign(
      { userId: userData.id, email: email.toLowerCase(), type: 'email_verification' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    await supabase
      .from('users')
      .update({ email_verification_token: finalVerificationToken })
      .eq('id', userData.id)

    // Create verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${finalVerificationToken}`

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to LeadFlow - Verify Your Email',
        html: emailVerificationTemplate({
          name: firstName,
          verificationUrl
        })
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration for email error, but log it
    }

    // Log activity
    try {
      await supabase
        .from('activity_logs') 
        .insert([{
          organization_id: orgData.id,
          user_id: userData.id,
          action: 'user_registered',
          description: 'User account created - email verification pending'
        }])
    } catch (logError) {
      console.warn('Failed to log registration activity:', logError)
    }

    // Return user without password
    const { password_hash, ...userWithoutPassword } = userData

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'Account created successfully! Please check your email to verify your account.',
      requiresVerification: true,
      email: email
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}