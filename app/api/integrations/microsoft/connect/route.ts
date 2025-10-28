// app/api/integrations/microsoft/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getMicrosoftAuthUrl } from '@/lib/email-oauth/microsoft-oauth';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }
  
  const authUrl = getMicrosoftAuthUrl(user.id);
  return NextResponse.redirect(authUrl);
}