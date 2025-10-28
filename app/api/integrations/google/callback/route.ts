// app/api/integrations/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { handleGoogleCallback } from '@/lib/email-oauth/google-oauth';
import { encryptToken } from '@/lib/email-oauth/token-manager';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  const error = searchParams.get('error');
  
  if (error) {
    return NextResponse.redirect(
      new URL(`/email-accounts?error=${error}`, request.url)
    );
  }
  
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/email-accounts?error=missing_params', request.url)
    );
  }
  
  try {
    // Validate user exists in database first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('id', state)
      .single()
    
    if (userError || !userData) {
      console.error('User not found:', state, userError)
      return NextResponse.redirect(
        new URL('/email-accounts?error=user_not_found', request.url)
      );
    }
    
    const { accessToken, refreshToken, expiresAt, email } = await handleGoogleCallback(code);
    
    // Encrypt tokens
    const encryptedAccess = encryptToken(accessToken);
    const encryptedRefresh = encryptToken(refreshToken);
    
    // Store in database using service role
    const { error: dbError } = await supabase
      .from('email_accounts')
      .upsert({
        user_id: userData.id,
        organization_id: userData.organization_id,
        provider: 'google',
        email,
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        token_expires_at: expiresAt.toISOString(),
        status: 'warming_up',
        daily_limit: 20,
        daily_sent: 0,
        warmup_stage: 1,
        warmup_started_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,email'
      })
    
    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
    
    return NextResponse.redirect(
      new URL('/email-accounts?success=connected&provider=google', request.url)
    );
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/email-accounts?error=auth_failed&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}