import { NextRequest, NextResponse } from 'next/server'

// Public routes that don't require auth
const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/signup',
  '/email-setup',
  '/reset-password',
  '/api',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow API routes through
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
