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

  return NextResponse.json(data);
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
    const { name, steps, status, sender_id, sender_ids, config, lead_ids, use_powersend, powersend_server_id, powersend_server_ids } = await req.json();

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
          leadIds: lead_ids || [],
        },
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
