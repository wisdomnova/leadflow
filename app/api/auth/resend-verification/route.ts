import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'
import { sendEmail } from '@/lib/resend'
import { emailVerificationTemplate } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
 
    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.email_verified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
    }

    // Generate new verification token
    const verificationToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'email_verification' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verification_token: verificationToken,
        email_verification_expires_at: verificationExpires.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update verification token:', updateError)
      return NextResponse.json({ error: 'Failed to generate verification token' }, { status: 500 })
    }

    // Create verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`

    // Send verification email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify Your LeadFlow Email Address',
        html: emailVerificationTemplate({
          name: user.first_name || 'there',
          verificationUrl
        })
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Verification email sent successfully' })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}