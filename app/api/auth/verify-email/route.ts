// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'
import { sendEmail } from '@/lib/resend'
import { emailVerifiedSuccessTemplate } from '@/lib/email-templates' 

async function handleVerification(token: string, request: NextRequest) {
  if (!token) {
    return { error: 'Missing verification token', status: 400 }
  }

  // Verify the token
  let decoded: any
  try {  
    decoded = jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    return { error: 'Invalid or expired token', status: 400 }
  }

  console.log('Decoded user ID:', decoded.userId)

  // Get user from database
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', decoded.userId)
    .eq('email_verification_token', token)
    .single()

  if (userError || !user) {
    return { error: 'User not found or token mismatch', status: 404 }
  }

  // Check if token has expired
  if (user.email_verification_expires_at && new Date() > new Date(user.email_verification_expires_at)) {
    return { error: 'Verification token has expired', status: 400 }
  }

  // Check if email is already verified
  if (user.email_verified) {
    return { success: true, alreadyVerified: true, message: 'Email already verified' }
  }

  // Update user as verified
  const { error: updateError } = await supabase
    .from('users')
    .update({
      email_verified: true,
      email_verification_token: null,
      email_verification_expires_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Failed to update user verification:', updateError)
    return { error: 'Failed to update verification status', status: 500 }
  }

  // Send welcome email via Resend (optional)
  try {
    await sendEmail({
      to: user.email,
      subject: 'Welcome to LeadFlow - Email Verified!',
      html: emailVerifiedSuccessTemplate(user.first_name || 'there')
    })
  } catch (emailError) {
    console.warn('Failed to send welcome email via Resend:', emailError)
    // Don't fail the verification for this
  }

  // Log activity
  try {
    await supabase
      .from('activity_logs')
      .insert([{
        organization_id: user.organization_id,
        user_id: user.id,
        action: 'email_verified',
        description: 'Email address verified successfully'
      }])
  } catch (logError) {
    console.warn('Failed to log verification activity:', logError)
  }

  return { success: true, message: 'Email verified successfully' }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/verification-error?error=missing-token', request.url))
    }

    const result = await handleVerification(token, request)

    if (result.error) {
      return NextResponse.redirect(new URL(`/auth/verification-error?error=${encodeURIComponent(result.error)}`, request.url))
    }

    if (result.alreadyVerified) {
      return NextResponse.redirect(new URL('/auth/verification-success?already-verified=true', request.url))
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/verification-success', request.url))

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/auth/verification-error?error=server-error', request.url))
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    const result = await handleVerification(token, request)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}