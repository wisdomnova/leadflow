import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserJWT } from "@/lib/jwt";
import { getAdminClient } from "@/lib/supabase";

/**
 * GET: Fetch notifications for the authenticated user
 */
export async function GET(req: NextRequest) {
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

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", payload.userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Fetch notifications error:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Notifications API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST: Mark all notifications as read
 */
export async function POST(req: NextRequest) {
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

    const supabase = getAdminClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", payload.userId)
      .eq("is_read", false);

    if (error) {
      console.error("Mark all as read error:", error);
      return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
