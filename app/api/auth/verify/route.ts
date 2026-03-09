import { NextRequest, NextResponse } from "next/server";
import { verifyVerificationJWT } from "@/lib/jwt";
import { getAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/signin?error=invalid_token", req.url));
  }

  const payload = await verifyVerificationJWT(token);

  if (!payload || !payload.email) {
    return NextResponse.redirect(new URL("/signin?error=expired_token", req.url));
  }

  const supabase = getAdminClient();

  // Check if already verified to make token single-use effectively
  const { data: user } = await (supabase as any)
    .from("users")
    .select("is_verified")
    .eq("email", payload.email)
    .single();

  if (user?.is_verified) {
    // Already verified — redirect without error (idempotent)
    return NextResponse.redirect(new URL("/signin?verified=true", req.url));
  }

  // Update user as verified
  const { error } = await (supabase as any)
    .from("users")
    .update({ is_verified: true })
    .eq("email", payload.email);

  if (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(new URL("/signin?error=verification_failed", req.url));
  }

  // Redirect to onboarding with success message
  return NextResponse.redirect(new URL("/onboarding?verified=true", req.url));
}
