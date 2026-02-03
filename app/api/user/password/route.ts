import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserJWT } from "@/lib/jwt";
import { getAdminClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyUserJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Fetch user to verify current password
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", payload.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Compare current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
    }

    // 3. Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 4. Update password
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq("id", payload.userId);

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Password change error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
