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

  // Update user as verified
  const { error } = await supabase
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
