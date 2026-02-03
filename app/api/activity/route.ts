import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserJWT } from "@/lib/jwt";
import { getAdminClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

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

    let query = supabase
      .from("activity_log")
      .select("*")
      .eq("org_id", payload.orgId);

    if (type) {
      query = query.eq("action_type", type);
    }

    query = query.order("created_at", { ascending: false })
      .limit(limit);

    if (filter === 'campaigns') {
      query = query.like('action_type', 'campaign.%');
    } else if (filter === 'replies') {
      query = query.in('action_type', ['lead.replied', 'email.received']);
    } else if (filter === 'team') {
      query = query.like('action_type', 'team.%');
    } else if (filter === 'errors') {
      query = query.in('action_type', ['provider.error', 'sync.failed', 'campaign.failed']);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
