import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

// GET /api/lists — fetch all lists for the org (with lead counts)
export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch lists
  const { data: lists, error } = await context.supabase
    .from("lead_lists")
    .select("*")
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  // Fetch lead counts via RPC
  const { data: counts } = await context.supabase
    .rpc("get_list_lead_counts", { p_org_id: context.orgId });

  const countMap: Record<string, number> = {};
  if (counts) {
    for (const row of counts as any[]) {
      countMap[row.list_id] = Number(row.lead_count);
    }
  }

  const listsWithCounts = (lists || []).map((list: any) => ({
    ...list,
    lead_count: countMap[list.id] || 0,
  }));

  return NextResponse.json(listsWithCounts);
}

// POST /api/lists — create a new list
export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, color } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 });
    }

    if (name.trim().length > 200) {
      return NextResponse.json({ error: "List name must be under 200 characters" }, { status: 400 });
    }

    const { data, error } = await (context.supabase as any)
      .from("lead_lists")
      .insert([{
        org_id: context.orgId,
        name: name.trim(),
        description: description || '',
        color: color || '#745DF3',
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: "A list with this name already exists" }, { status: 400 });
      }
      return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
