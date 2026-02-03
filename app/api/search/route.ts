import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ campaigns: [], leads: [] });
  }

  try {
    // Search campaigns
    const { data: campaigns } = await context.supabase
      .from("campaigns")
      .select("id, name, status")
      .eq("org_id", context.orgId)
      .ilike("name", `%${q}%`)
      .limit(5);

    // Search leads
    const { data: leads } = await context.supabase
      .from("leads")
      .select("id, first_name, last_name, email, company")
      .eq("org_id", context.orgId)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`)
      .limit(5);

    return NextResponse.json({
      campaigns: campaigns || [],
      leads: leads || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
