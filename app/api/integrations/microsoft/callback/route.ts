// app/api/integrations/microsoft/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { handleMicrosoftCallback } from '@/lib/email-oauth/microsoft-oauth';
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
    const { accessToken, refreshToken, expiresAt, email } = await handleMicrosoftCallback(code);
    
    const supabase = createClient();
    
    // Encrypt tokens
    const encryptedAccess = encryptToken(accessToken);
    const encryptedRefresh = encryptToken(refreshToken);
    
    // Store in database
    const { error: dbError } = await supabase
      .from('email_accounts')
      .upsert({
        user_id: state,
        provider: 'microsoft',
        email,
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        token_expires_at: expiresAt.toISOString(),
        status: 'warming_up',
        daily_limit: 20,
        warmup_stage: 1
      }, {
        onConflict: 'user_id,email'
      });
    
    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
    
    return NextResponse.redirect(
      new URL('/email-accounts?success=connected&provider=microsoft', request.url)
    );
  } catch (error: any) {
    console.error('Microsoft OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/email-accounts?error=auth_failed&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}