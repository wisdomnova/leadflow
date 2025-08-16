import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'
import { sendEmail } from '@/lib/resend'
import { emailVerifiedSuccessTemplate } from '@/lib/email-templates'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/verification-error?error=missing-token', request.url))
    }

    // Verify the token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.redirect(new URL('/auth/verification-error?error=invalid-token', request.url))
    }

    console.log('Decoded '+decoded.userId);

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('email_verification_token', token)
      .single()

    if (userError || !user) {
      return NextResponse.redirect(new URL('/auth/verification-error?error=user-not-found', request.url))
    }

    // Check if token has expired
    if (user.email_verification_expires_at && new Date() > new Date(user.email_verification_expires_at)) {
      return NextResponse.redirect(new URL('/auth/verification-error?error=token-expired', request.url))
    }

    // Check if email is already verified
    if (user.email_verified) {
      return NextResponse.redirect(new URL('/auth/verification-success?already-verified=true', request.url))
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
      return NextResponse.redirect(new URL('/auth/verification-error?error=update-failed', request.url))
    }

    // Send welcome email (optional)
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to LeadFlow - Email Verified!',
        html: emailVerifiedSuccessTemplate(user.first_name || 'there')
      })
    } catch (emailError) {
      console.warn('Failed to send welcome email:', emailError)
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

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/verification-success', request.url))

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/auth/verification-error?error=server-error', request.url))
  }
}