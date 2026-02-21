import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { logLeadActivity } from "@/lib/activity-utils";

export async function PATCH(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids, tags, status } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Lead IDs are required" }, { status: 400 });
    }

    const updates: any = {};
    if (tags) updates.tags = tags;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const { data, error } = await context.supabase
      .from("leads")
      .update(updates)
      .in("id", ids)
      .eq("org_id", context.orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activities for each lead
    for (const id of ids) {
      if (tags) {
        await logLeadActivity({
          supabase: context.supabase,
          leadId: id,
          orgId: context.orgId,
          type: "lead_tagged",
          description: `Applied tags: ${tags.join(", ")}`,
          metadata: { tags }
        });
      }
      if (status) {
        await logLeadActivity({
          supabase: context.supabase,
          leadId: id,
          orgId: context.orgId,
          type: "status_changed",
          description: `Changed status to: ${status}`,
          metadata: { status }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids, deleteAll } = await req.json();

    // Delete ALL contacts for the org
    if (deleteAll === true) {
      const { error, count } = await context.supabase
        .from("leads")
        .delete({ count: 'exact' })
        .eq("org_id", context.orgId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, deleted: count || 0 });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Lead IDs are required" }, { status: 400 });
    }

    const { error } = await context.supabase
      .from("leads")
      .delete()
      .in("id", ids)
      .eq("org_id", context.orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
