import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getAdminClient } from "@/lib/supabase";
import { validatePassword } from "@/lib/password-validation";
import { rateLimiters, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimiters.passwordReset(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    // Validate password strength
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.errors[0] }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Hash the provided token and find user by hashed token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { data: user, error: userError } = await (supabase as any)
      .from("users")
      .select("id, reset_token_expires")
      .eq("reset_token", tokenHash)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // 2. Check expiration
    if (new Date((user as any).reset_token_expires) < new Date()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    // 3. Hash New Password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Atomically update password and clear token (prevents race condition)
    const { error: updateError } = await (supabase as any)
      .from("users")
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq("id", (user as any).id)
      .eq("reset_token", tokenHash); // Ensure token hasn't been used by another request

    if (updateError) {
      return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Password has been reset successfully." });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
