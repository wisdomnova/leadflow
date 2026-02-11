import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await context.supabase
    .from("sending_domains")
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
    const { domainName, dkimSelector, trackingDomain } = await req.json();

    if (!domainName) {
      return NextResponse.json({ error: "Domain name is required" }, { status: 400 });
    }

    // Unlimited domains for all plans in current version
    
    const { data, error } = await (context.supabase as any)
      .from("sending_domains")
      .insert([{
        org_id: context.orgId,
        domain_name: domainName,
        dkim_selector: dkimSelector || "sig1",
        tracking_domain: trackingDomain || null,
        spf_status: "pending",
        dkim_status: "pending",
        dmarc_status: "pending",
        tracking_status: "pending",
      }] as any)
      .select()
      .single();

    if (error) {
      // Handle unique constraint error
      if (error.code === '23505') {
        return NextResponse.json({ error: "Domain already exists" }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
