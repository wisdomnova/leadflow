import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

// PATCH /api/templates/[id] - Update a template
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
    
    // Whitelist fields to update
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.body !== undefined) updates.body = body.body;
    if (body.category !== undefined) updates.category = body.category;
    if (body.is_starred !== undefined) updates.is_starred = body.is_starred;
    
    updates.updated_at = new Date().toISOString();

    const { data: template, error } = await context.supabase
      .from("email_templates")
      .update(updates)
      .eq("id", id)
      .eq("org_id", context.orgId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { error } = await context.supabase
      .from("email_templates")
      .delete()
      .eq("id", id)
      .eq("org_id", context.orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
