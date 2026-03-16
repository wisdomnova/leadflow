import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

// GET /api/lists/[id] — fetch a single list with its leads
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: list, error } = await context.supabase
    .from("lead_lists")
    .select("*")
    .eq("id", id)
    .eq("org_id", context.orgId)
    .single();

  if (error || !list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  return NextResponse.json(list);
}

// PATCH /api/lists/[id] — update a list
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.color !== undefined) updates.color = body.color;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await (context.supabase as any)
      .from("lead_lists")
      .update(updates)
      .eq("id", id)
      .eq("org_id", context.orgId)
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

// DELETE /api/lists/[id] — delete a list (memberships cascade)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await context.supabase
    .from("lead_lists")
    .delete()
    .eq("id", id)
    .eq("org_id", context.orgId);

  if (error) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
