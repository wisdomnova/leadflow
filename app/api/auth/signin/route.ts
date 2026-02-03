import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminClient } from "@/lib/supabase";
import { signUserJWT } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Fetch user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*, organizations(*)")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 2. Compare Password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 3. Generate Session JWT
    const token = await signUserJWT({
      userId: user.id,
      orgId: user.org_id,
      email: user.email,
      role: user.role,
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
      user: { email: user.email, fullName: user.full_name, orgName: user.organizations?.name } 
    });
  } catch (err) {
    console.error("Signin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
