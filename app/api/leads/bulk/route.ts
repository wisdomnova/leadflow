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

    // Delete ALL contacts for the org (excluding leads in running campaigns)
    if (deleteAll === true) {
      // Find leads in active/sending campaigns to protect them
      const { data: protectedLeads } = await context.supabase
        .from("campaign_recipients")
        .select("lead_id, campaigns!inner(status)")
        .in("campaigns.status", ["active", "sending", "scheduled"])
        .eq("campaigns.org_id", context.orgId);

      const protectedIds = [...new Set((protectedLeads || []).map((r: any) => r.lead_id))];

      let query = context.supabase
        .from("leads")
        .delete({ count: 'exact' })
        .eq("org_id", context.orgId);

      // Exclude protected leads from deletion
      if (protectedIds.length > 0) {
        // Delete in batches excluding protected IDs
        // Supabase doesn't have "not in" for delete easily, so we select IDs first
        const { data: allLeads } = await context.supabase
          .from("leads")
          .select("id")
          .eq("org_id", context.orgId);

        const deletableIds = (allLeads || []).map((l: any) => l.id).filter((id: string) => !protectedIds.includes(id));

        if (deletableIds.length === 0) {
          return NextResponse.json({ success: true, deleted: 0, protected: protectedIds.length });
        }

        // Delete in chunks of 500
        let totalDeleted = 0;
        for (let i = 0; i < deletableIds.length; i += 500) {
          const chunk = deletableIds.slice(i, i + 500);
          const { count } = await context.supabase
            .from("leads")
            .delete({ count: 'exact' })
            .in("id", chunk)
            .eq("org_id", context.orgId);
          totalDeleted += count || 0;
        }
        return NextResponse.json({ success: true, deleted: totalDeleted, protected: protectedIds.length });
      }

      const { error, count } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, deleted: count || 0 });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Lead IDs are required" }, { status: 400 });
    }

    // Check if any of the selected leads are in running campaigns
    const { data: activeRecipients } = await context.supabase
      .from("campaign_recipients")
      .select("lead_id, campaigns!inner(status)")
      .in("lead_id", ids)
      .in("campaigns.status", ["active", "sending", "scheduled"]);

    const protectedIds = [...new Set((activeRecipients || []).map((r: any) => r.lead_id))];
    const deletableIds = ids.filter((id: string) => !protectedIds.includes(id));

    if (deletableIds.length === 0 && protectedIds.length > 0) {
      return NextResponse.json(
        { error: `All ${protectedIds.length} selected contact(s) are in running campaigns and cannot be deleted.` },
        { status: 400 }
      );
    }

    const { error } = await context.supabase
      .from("leads")
      .delete()
      .in("id", deletableIds)
      .eq("org_id", context.orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: deletableIds.length, protected: protectedIds.length });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
