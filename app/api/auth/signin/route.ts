import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminClient } from "@/lib/supabase";
import { signUserJWT } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    console.log("[SIGNIN] Attempt for email:", email);

    if (!email || !password) {
      console.log("[SIGNIN] Missing fields - email:", !!email, "password:", !!password);
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Fetch user by email
    const { data: user, error: userError } = await (supabase as any)
      .from("users")
      .select("*, organizations(*)")
      .eq("email", email)
      .single();

    if (userError || !user) {
      console.log("[SIGNIN] User lookup failed - error:", userError?.message, "| user found:", !!user);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log("[SIGNIN] User found - id:", (user as any).id, "| has password_hash:", !!(user as any).password_hash, "| org_id:", (user as any).org_id);

    // 2. Compare Password
    const isPasswordValid = await bcrypt.compare(password, (user as any).password_hash);
    if (!isPasswordValid) {
      console.log("[SIGNIN] Password mismatch for user:", (user as any).id);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log("[SIGNIN] Password valid, generating JWT...");

    // 3. Generate Session JWT
    const token = await signUserJWT({
      userId: (user as any).id,
      orgId: (user as any).org_id,
      email: (user as any).email,
      role: (user as any).role,
    });

    // 4. Set Cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({ 
      success: true, 
      user: { email: (user as any).email, fullName: (user as any).full_name, orgName: (user as any).organizations?.name } 
    });
  } catch (err) {
    console.error("Signin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
