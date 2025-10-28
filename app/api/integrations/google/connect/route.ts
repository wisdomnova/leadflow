// app/api/integrations/google/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/email-oauth/google-oauth';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Use custom JWT authentication instead of Supabase Auth
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    
    // Validate user exists in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      console.error('User not found in database:', userId, userError)
      return NextResponse.redirect(new URL('/auth/sign-in?error=user_not_found', request.url))
    }
    
    const authUrl = getGoogleAuthUrl(userId)
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Google connect auth error:', error)
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }
}