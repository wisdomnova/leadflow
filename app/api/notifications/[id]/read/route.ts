import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserJWT } from "@/lib/jwt";
import { getAdminClient } from "@/lib/supabase";

/**
 * PATCH: Mark a specific notification as read
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyUserJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const supabase = getAdminClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", payload.userId);

    if (error) {
      console.error("Mark as read error:", error);
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Single Notification API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
