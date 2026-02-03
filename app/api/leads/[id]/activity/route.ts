import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await context.supabase
    .from("activity_log")
    .select("*")
    .eq("lead_id", id)
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false });

  if (error) {
    // If table doesn't exist yet, return empty array instead of 500
    if (error.code === 'PGRST116' || error.message.includes('relation "activity_log" does not exist')) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
