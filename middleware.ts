import { NextRequest, NextResponse } from "next/server";
import { verifyUserJWT } from "@/lib/jwt";

// Paths that require authentication
const protectedPaths = ["/dashboard", "/onboarding"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if the current path is protected
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    const token = req.cookies.get("session_token")?.value;

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }

    const payload = await verifyUserJWT(token);
    
    if (!payload) {
      const url = req.nextUrl.clone();
      url.pathname = "/session-expired";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
