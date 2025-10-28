// app/api/integrations/google/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/email-oauth/google-oauth';
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
    
    const authUrl = getGoogleAuthUrl(userId)
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Google connect auth error:', error)
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }
}