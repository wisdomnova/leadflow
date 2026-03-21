import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminClient } from "@/lib/supabase";
import { signUserJWT } from "@/lib/jwt";
import { cookies } from "next/headers";
import { rateLimiters, getClientIp } from "@/lib/rate-limit";

// Dummy hash for timing-safe comparison when user not found
const DUMMY_HASH = "$2a$12$LJ3m4ys3Sz8n2a0Oj6MxEe0000000000000000000000000000000";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimiters.auth(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const { email: rawEmail, password, rememberMe } = await req.json();

    if (!rawEmail || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();
    console.log(`[AUTH] Sign-in attempt for: ${email}`);

    const supabase = getAdminClient();
    console.log(`[AUTH] Supabase client created`);

    // 1. Fetch user by email
    const { data: user, error: userError } = await (supabase as any)
      .from("users")
      .select("*, organizations(*)")
      .eq("email", email)
      .single();

    console.log(`[AUTH] Supabase query result - Error: ${userError?.message || "none"}, User found: ${!!user}`);

    // Always run bcrypt comparison to prevent timing-based user enumeration
    const hashToCompare = user ? (user as any).password_hash : DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(password, hashToCompare);

    console.log(`[AUTH] Password valid: ${isPasswordValid}, User exists: ${!!user}`);

    if (userError || !user || !isPasswordValid) {
      console.log(`[AUTH] Sign-in failed - Error: ${userError?.message}, User: ${user ? "found" : "not found"}, PasswordValid: ${isPasswordValid}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check email verification status
    if (!(user as any).is_verified) {
      return NextResponse.json({ error: "Please verify your email address before signing in. Check your inbox for the verification link." }, { status: 403 });
    }

    // 3. Generate Session JWT
    const sessionDuration = rememberMe ? "30d" : "4h";
    const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4; // 30 days or 4 hours
    const token = await signUserJWT({
      userId: (user as any).id,
      orgId: (user as any).org_id,
      email: (user as any).email,
      role: (user as any).role,
    }, sessionDuration);

    // 4. Set Cookie
    // TODO: Add server-side session revocation (store session ID in DB, validate on each request)
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: cookieMaxAge,
      path: "/",
    });

    return NextResponse.json({ 
      success: true, 
      user: { email: (user as any).email, fullName: (user as any).full_name, orgName: (user as any).organizations?.name } 
    });
  } catch (err) {
    console.error(`[AUTH] Unexpected error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
