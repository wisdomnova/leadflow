import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

const BATCH_SIZE = 500;

// GET /api/lists/[id]/leads — fetch lead IDs in a list
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const idsOnly = searchParams.get("ids_only") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "1000"), 1000);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Verify list belongs to org
  const { data: list } = await context.supabase
    .from("lead_lists")
    .select("id")
    .eq("id", id)
    .eq("org_id", context.orgId)
    .single();

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  if (idsOnly) {
    const { data, error, count } = await context.supabase
      .from("lead_list_memberships")
      .select("lead_id", { count: "exact" })
      .eq("list_id", id)
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
    }

    return NextResponse.json({
      leads: (data || []).map((m: any) => ({ id: m.lead_id })),
      total: count,
    });
  }

  // Full lead data join
  const { data, error, count } = await context.supabase
    .from("lead_list_memberships")
    .select("lead_id, leads(*)", { count: "exact" })
    .eq("list_id", id)
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  return NextResponse.json({
    leads: (data || []).map((m: any) => m.leads).filter(Boolean),
    total: count,
  });
}

// POST /api/lists/[id]/leads — add leads to a list
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { lead_ids } = await req.json();

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: "lead_ids array is required" }, { status: 400 });
    }

    // Verify list belongs to org
    const { data: list } = await context.supabase
      .from("lead_lists")
      .select("id")
      .eq("id", id)
      .eq("org_id", context.orgId)
      .single();

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Batch insert memberships
    let added = 0;
    for (let i = 0; i < lead_ids.length; i += BATCH_SIZE) {
      const batch = lead_ids.slice(i, i + BATCH_SIZE).map((leadId: string) => ({
        list_id: id,
        lead_id: leadId,
      }));

      const { data, error } = await context.supabase
        .from("lead_list_memberships")
        .upsert(batch, { onConflict: "list_id,lead_id", ignoreDuplicates: true })
        .select("id");

      if (!error && data) added += data.length;
    }

    return NextResponse.json({ success: true, added });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/lists/[id]/leads — remove leads from a list
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { lead_ids } = await req.json();

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: "lead_ids array is required" }, { status: 400 });
    }

    for (let i = 0; i < lead_ids.length; i += BATCH_SIZE) {
      const batch = lead_ids.slice(i, i + BATCH_SIZE);
      await context.supabase
        .from("lead_list_memberships")
        .delete()
        .eq("list_id", id)
        .in("lead_id", batch);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
