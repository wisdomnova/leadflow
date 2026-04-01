import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { inngest } from "@/lib/services/inngest";
import { checkSubscription } from "@/lib/subscription-check";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await context.supabase
    .from("campaigns")
    .select("*")
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  // For running campaigns, check if daily sending capacity is exhausted
  const runningCampaigns = (data || []).filter((c: any) => c.status === "running");
  const capacityMap: Record<string, boolean> = {};

  if (runningCampaigns.length > 0) {
    // Check PowerSend server capacity
    const { data: servers } = await context.supabase
      .from("smart_servers")
      .select("id, current_usage, daily_limit")
      .eq("org_id", context.orgId)
      .in("status", ["active", "warming"]);

    // Check mailbox capacity for each server
    const serverIds = (servers || []).map((s: any) => s.id);
    let allMailboxesAtLimit = false;

    if (serverIds.length > 0) {
      const { data: mailboxes } = await (context.supabase as any)
        .from("server_mailboxes")
        .select("server_id, current_usage, daily_limit")
        .in("server_id", serverIds)
        .eq("status", "active");

      const availableMailboxes = (mailboxes || []).filter(
        (m: any) => m.current_usage < m.daily_limit
      );
      allMailboxesAtLimit = (mailboxes || []).length > 0 && availableMailboxes.length === 0;

      // Server-level check
      const allServersAtLimit = (servers || []).length > 0 && (servers || []).every(
        (s: any) => s.current_usage >= s.daily_limit
      );

      // Mark each running campaign
      for (const campaign of runningCampaigns) {
        if ((campaign as any).use_powersend) {
          // PowerSend: check the servers assigned to this campaign
          const campaignServerIds: string[] = (campaign as any).powersend_server_ids || [];
          if (campaignServerIds.length > 0) {
            const campaignServers = (servers || []).filter((s: any) => campaignServerIds.includes(s.id));
            const campaignMailboxes = (mailboxes || []).filter((m: any) => campaignServerIds.includes(m.server_id));
            const campaignAvailable = campaignMailboxes.filter((m: any) => m.current_usage < m.daily_limit);
            const serversAtLimit = campaignServers.length > 0 && campaignServers.every((s: any) => s.current_usage >= s.daily_limit);
            capacityMap[(campaign as any).id] = (campaignMailboxes.length > 0 && campaignAvailable.length === 0) || serversAtLimit;
          } else {
            capacityMap[(campaign as any).id] = allMailboxesAtLimit || allServersAtLimit;
          }
        }
      }
    }
  }

  // Attach daily_limit_reached flag to each campaign
  const enriched = (data || []).map((c: any) => ({
    ...c,
    daily_limit_reached: capacityMap[c.id] || false,
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Strict Subscription Check
  const sub = await checkSubscription(context.orgId);
  if (!sub.active) {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  try {
    const { name, steps, status, sender_id, sender_ids, config, lead_ids, list_id, use_powersend, powersend_server_id, powersend_server_ids } = await req.json();

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json({ error: "Name and steps are required" }, { status: 400 });
    }

    // Validate steps structure
    if (steps.length === 0 || steps.length > 20) {
      return NextResponse.json({ error: "Campaign must have between 1 and 20 steps" }, { status: 400 });
    }
    for (const step of steps) {
      if (!step || typeof step !== 'object') {
        return NextResponse.json({ error: "Each step must be an object" }, { status: 400 });
      }
      if (step.subject && typeof step.subject === 'string' && step.subject.length > 1000) {
        return NextResponse.json({ error: "Step subject must be under 1000 characters" }, { status: 400 });
      }
      if (step.body && typeof step.body === 'string' && step.body.length > 100000) {
        return NextResponse.json({ error: "Step body must be under 100KB" }, { status: 400 });
      }
    }

    // Plan Gating: Check if user is allowed to use Smart Sending
    let finalConfig = config || {};
    if (finalConfig.smart_sending) {
      if (!sub.smartEnabled && sub.tier === 'starter' && sub.usage.isOver) {
        // If not entitled, disable smart sending in the config before saving
        finalConfig.smart_sending = false;
      }
    }

    const { data, error } = await (context.supabase as any)
      .from("campaigns")
      .insert([{
        org_id: context.orgId,
        name,
        steps, // JSONB array of steps
        status: status || "draft",
        sender_id: sender_id || null,
        sender_ids: Array.isArray(sender_ids) && sender_ids.length > 0 ? sender_ids : [],
        lead_ids: Array.isArray(lead_ids) ? lead_ids : [],
        list_id: list_id || null,
        use_powersend: use_powersend || false,
        powersend_server_ids: Array.isArray(powersend_server_ids) && powersend_server_ids.length > 0 
          ? powersend_server_ids 
          : (use_powersend && powersend_server_id ? [powersend_server_id] : []),
        powersend_config: use_powersend && powersend_server_id 
          ? { server_id: powersend_server_id } 
          : {},
        config: finalConfig
      }] as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
    }

    // Trigger campaign launch if set to running
    if (status === "running") {
      await inngest.send({
        name: "campaign/launch",
        data: {
          campaignId: data.id,
          orgId: context.orgId,
          listId: list_id || null,
        },
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
