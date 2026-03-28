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

  // Protect leads that are in running/paused/scheduled campaigns
  const { data: activeRecipients } = await context.supabase
    .from("campaign_recipients")
    .select("lead_id, campaigns!inner(status)")
    .eq("lead_id", id)
    .in("campaigns.status", ["running", "paused", "scheduled"]);

  if (activeRecipients && activeRecipients.length > 0) {
    return NextResponse.json(
      { error: "This contact is part of an active campaign and cannot be deleted." },
      { status: 400 }
    );
  }

  const { error } = await context.supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("org_id", context.orgId);

  if (error) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
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

    // Whitelist allowed fields to prevent mass-assignment
    const ALLOWED_FIELDS = ['first_name', 'last_name', 'email', 'company', 'job_title', 'phone', 'linkedin_url', 'website', 'tags', 'custom_fields', 'status', 'notes'];
    const sanitizedBody: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) sanitizedBody[key] = body[key];
    }
    if (Object.keys(sanitizedBody).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await context.supabase
      .from("leads")
      .update(sanitizedBody)
      .eq("id", id)
      .eq("org_id", context.orgId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
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
