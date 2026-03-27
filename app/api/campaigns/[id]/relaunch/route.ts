import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { inngest } from "@/lib/services/inngest";
import { checkSubscription } from "@/lib/subscription-check";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/campaigns/[id]/relaunch
 * Re-triggers campaign/email.process events for all active recipients that haven't been sent yet.
 * Useful when the original campaign launch partially failed or events were lost.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await checkSubscription(context.orgId);
  if (!sub.active) {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  // Verify campaign belongs to org and is running
  const { data: campaign, error: campError } = await context.supabase
    .from("campaigns")
    .select("id, status, org_id")
    .eq("id", campaignId)
    .eq("org_id", context.orgId)
    .single();

  if (campError || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if ((campaign as any).status !== "running") {
    return NextResponse.json({ error: "Campaign must be in 'running' status to relaunch" }, { status: 400 });
  }

  // Get all active recipients that have never been sent (stuck recipients)
  const allStuck: any[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await (supabaseAdmin as any)
      .from("campaign_recipients")
      .select("lead_id, current_step")
      .eq("campaign_id", campaignId)
      .eq("status", "active")
      .is("last_sent_at", null)
      .range(from, from + PAGE - 1);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch stuck recipients" }, { status: 500 });
    }
    if (!data || data.length === 0) break;
    allStuck.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  if (allStuck.length === 0) {
    return NextResponse.json({ message: "No stuck recipients found", relaunched: 0 });
  }

  // Dispatch campaign/email.process events in batches
  const EVENT_BATCH_SIZE = 100;
  let dispatched = 0;
  for (let i = 0; i < allStuck.length; i += EVENT_BATCH_SIZE) {
    const batch = allStuck.slice(i, i + EVENT_BATCH_SIZE);
    const events = batch.map((r: any) => ({
      name: "campaign/email.process" as const,
      data: {
        campaignId,
        leadId: r.lead_id,
        stepIdx: r.current_step || 0,
        orgId: context.orgId,
      },
    }));
    await inngest.send(events);
    dispatched += batch.length;
  }

  return NextResponse.json({
    message: `Relaunched ${dispatched} stuck recipients`,
    relaunched: dispatched,
  });
}
