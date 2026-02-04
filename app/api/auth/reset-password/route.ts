import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Find user by token
    const { data: user, error: userError } = await (supabase as any)
      .from("users")
      .select("id, reset_token_expires")
      .eq("reset_token", token)
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

    // 4. Update User
    await (supabase as any)
      .from("users")
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq("id", (user as any).id);

    return NextResponse.json({ success: true, message: "Password has been reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
