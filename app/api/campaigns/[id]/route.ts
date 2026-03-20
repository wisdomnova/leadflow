import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { checkSubscription } from "@/lib/subscription-check";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await context.supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("org_id", context.orgId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json(data);
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

  const sub = await checkSubscription(context.orgId);
  if (!sub.active) {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  const { status } = await req.json();

  // Validate campaign status
  const ALLOWED_STATUSES = ['draft', 'running', 'paused', 'completed', 'archived'];
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 });
  }

  const { error } = await context.supabase
    .from("campaigns")
    .update({ status })
    .eq("id", id)
    .eq("org_id", context.orgId);

  if (error) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

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
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("org_id", context.orgId);

  if (error) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await checkSubscription(context.orgId);
  if (!sub.active) {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, steps, sender_id, sender_ids, config, use_powersend, powersend_server_ids } = body;

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name;
    if (steps !== undefined) {
      if (!Array.isArray(steps) || steps.length === 0 || steps.length > 20) {
        return NextResponse.json({ error: "Campaign must have between 1 and 20 steps" }, { status: 400 });
      }
      updatePayload.steps = steps;
    }
    if (sender_id !== undefined) updatePayload.sender_id = sender_id;
    if (sender_ids !== undefined) updatePayload.sender_ids = sender_ids;
    if (config !== undefined) {
      let finalConfig = config || {};
      if (finalConfig.smart_sending && !sub.smartEnabled && sub.tier === 'starter') {
        finalConfig.smart_sending = false;
      }
      updatePayload.config = finalConfig;
    }
    if (use_powersend !== undefined) updatePayload.use_powersend = use_powersend;
    if (powersend_server_ids !== undefined) updatePayload.powersend_server_ids = powersend_server_ids;

    const { data, error } = await (context.supabase as any)
      .from("campaigns")
      .update(updatePayload)
      .eq("id", id)
      .eq("org_id", context.orgId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
