import { NextRequest, NextResponse } from "next/server";
import { verifyUserJWT } from "@/lib/jwt";

// Paths that require authentication
// NOTE: /api/* routes are NOT middleware-protected; each handler calls getSessionContext() individually.
// If adding new API routes, ensure they include auth checks.
const protectedPaths = ["/dashboard", "/onboarding"];

// Security headers applied to every response
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co https://api.dicebear.com https://www.googletagmanager.com https://www.tryleadflow.ai; connect-src 'self' https://*.supabase.co https://*.sentry.io https://www.google-analytics.com https://o4509086498988032.ingest.us.sentry.io; font-src 'self' https://fonts.gstatic.com; frame-src 'none'; object-src 'none'; base-uri 'self';",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if the current path is protected
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    const token = req.cookies.get("session_token")?.value;

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/signin";
      const response = NextResponse.redirect(url);
      for (const [key, value] of Object.entries(securityHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }

    const payload = await verifyUserJWT(token);
    
    if (!payload) {
      const url = req.nextUrl.clone();
      url.pathname = "/session-expired";
      const response = NextResponse.redirect(url);
      for (const [key, value] of Object.entries(securityHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    }
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
