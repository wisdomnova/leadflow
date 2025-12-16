import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const JWT_SECRET = process.env.JWT_SECRET!

interface EmailProviderRequest {
  providerType: 'gmail' | 'resend' | 'smtp' | 'skip'
  resendApiKey?: string
  smtpHost?: string
  smtpPort?: number
  smtpUsername?: string
  smtpPassword?: string
  smtpFromEmail?: string
  smtpFromName?: string
  gmailAccessToken?: string
  gmailRefreshToken?: string
}

// Helper function to extract user ID from JWT
function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const body: EmailProviderRequest = await request.json()
    const { providerType, resendApiKey, smtpHost, smtpPort, smtpUsername, smtpPassword, smtpFromEmail, smtpFromName, gmailAccessToken, gmailRefreshToken } = body

    // Validate input
    if (!providerType || !['gmail', 'resend', 'smtp', 'skip'].includes(providerType)) {
      return NextResponse.json(
        { message: 'Invalid provider type' },
        { status: 400 }
      )
    }

    // Validate provider-specific fields
    if (providerType === 'resend' && !resendApiKey) {
      return NextResponse.json(
        { message: 'Resend API key is required' },
        { status: 400 }
      )
    }

    if (providerType === 'smtp' && (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !smtpFromEmail)) {
      return NextResponse.json(
        { message: 'All SMTP fields are required' },
        { status: 400 }
      )
    }

    if (providerType === 'gmail' && (!gmailAccessToken || !gmailRefreshToken)) {
      return NextResponse.json(
        { message: 'Gmail API key is required' },
        { status: 400 }
      )
    }

    // Check if provider already exists for this user
    const { data: existingProvider } = await supabase
      .from('email_providers')
      .select('id')
      .eq('user_id', userId)
      .single()

    const providerData = {
      user_id: userId,
      provider_type: providerType,
      is_verified: providerType === 'skip' ? false : true,
      updated_at: new Date().toISOString(),
      ...(providerType === 'resend' && { resend_api_key: resendApiKey }),
      ...(providerType === 'smtp' && {
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_username: smtpUsername,
        smtp_password: smtpPassword,
        smtp_from_email: smtpFromEmail,
        smtp_from_name: smtpFromName || 'Leadflow',
      }),
      ...(providerType === 'gmail' && {
        gmail_access_token: gmailAccessToken,
        gmail_refresh_token: gmailRefreshToken,
        gmail_token_expiry: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      }),
    }

    let result
    if (existingProvider) {
      // Update existing provider
      const { data, error } = await supabase
        .from('email_providers')
        .update(providerData)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { message: 'Failed to update email provider' },
          { status: 500 }
        )
      }
      result = data
    } else {
      // Create new provider
      const { data, error } = await supabase
        .from('email_providers')
        .insert([providerData])
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { message: 'Failed to create email provider' },
          { status: 500 }
        )
      }
      result = data
    }

    return NextResponse.json(
      {
        success: true,
        message: `Email provider ${providerType === 'skip' ? 'skipped' : 'configured'} successfully`,
        provider: {
          id: result.id,
          providerType: result.provider_type,
          isVerified: result.is_verified,
          createdAt: result.created_at,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Email provider setup error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve current provider config
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const { data: provider, error } = await supabase
      .from('email_providers')
      .select('id, provider_type, is_verified, created_at')
      .eq('user_id', userId)
      .single()

    if (error) {
      return NextResponse.json(
        { message: 'No email provider configured' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        provider: {
          id: provider.id,
          providerType: provider.provider_type,
          isVerified: provider.is_verified,
          createdAt: provider.created_at,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get email provider error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
