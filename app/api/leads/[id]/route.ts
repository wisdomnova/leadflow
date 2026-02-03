import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";import { logLeadActivity } from "@/lib/activity-utils";
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await context.supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("org_id", context.orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { data, error } = await context.supabase
      .from("leads")
      .update(body)
      .eq("id", id)
      .eq("org_id", context.orgId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log update activity
    await logLeadActivity({
      supabase: context.supabase,
      leadId: id,
      orgId: context.orgId,
      type: 'lead_updated',
      description: 'Lead profile updated',
      metadata: body
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
