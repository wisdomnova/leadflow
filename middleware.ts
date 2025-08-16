import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Home page - redirect to dashboard if authenticated
  if (pathname === '/') {
    const token = req.cookies.get('auth-token')?.value
    
    if (token) {
      // User is authenticated, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // Not authenticated, continue to home page
    return NextResponse.next()
  }
  
  // Auth routes - redirect to dashboard if already authenticated
  if (pathname.startsWith('/auth/')) {
    const token = req.cookies.get('auth-token')?.value
    
    if (token) {
      // Just check if token exists, let API routes handle validation
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    return NextResponse.next()
  }
  
  // Protected routes - require authentication
  const protectedPaths = ['/dashboard', '/contacts', '/campaigns', '/analytics', '/settings', '/billing']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtectedPath) {
    const token = req.cookies.get('auth-token')?.value
    
    if (!token) {
      // No token, redirect to sign in
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }
    
    // Token exists, let the page/API routes handle detailed validation
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/contacts/:path*', 
    '/campaigns/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/billing/:path*',
    '/auth/:path*'
  ]
}