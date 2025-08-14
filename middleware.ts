import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Middleware completely disabled - allow all requests through
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/contacts/:path*',
    '/campaigns/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/auth/:path*'
  ]
}