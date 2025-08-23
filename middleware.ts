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
  const protectedPaths = [
    '/dashboard', 
    '/contacts', 
    '/campaigns', 
    '/analytics', 
    '/settings', 
    '/billing'
  ]
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtectedPath) {
    const token = req.cookies.get('auth-token')?.value
    
    if (!token) {
      // No token, redirect to sign in
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }
    
    // Check trial expiration for non-billing pages
    if (!pathname.startsWith('/billing')) {
      try {
        // Get user trial status via API call
        const response = await fetch(`${req.nextUrl.origin}/api/auth/check-trial`, {
          headers: {
            'Cookie': req.headers.get('cookie') || ''
          }
        })
        
        if (response.ok) {
          const { trialExpired, subscriptionStatus } = await response.json()
          
          // If trial expired and no active subscription, redirect to upgrade
          if (trialExpired && subscriptionStatus === 'trial') {
            return NextResponse.redirect(new URL('/billing/upgrade', req.url))
          }
        }
      } catch (error) {
        // If check fails, continue - let the page handle it
        console.error('Trial check failed:', error)
      }
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