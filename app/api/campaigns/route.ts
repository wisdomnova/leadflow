import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { inngest } from "@/lib/services/inngest";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await context.supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, steps, status, sender_id, config, lead_ids } = await req.json();

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json({ error: "Name and steps are required" }, { status: 400 });
    }

    const { data, error } = await (context.supabase as any)
      .from("campaigns")
      .insert([{
        org_id: context.orgId,
        name,
        steps, // JSONB array of steps
        status: status || "draft",
        sender_id: sender_id || null,
        config: config || {}
      }] as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
