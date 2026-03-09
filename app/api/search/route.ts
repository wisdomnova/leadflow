import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { sanitizeSearchQuery } from "@/lib/sanitize";

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

  const sq = sanitizeSearchQuery(q);

  try {
    // Search campaigns
    const { data: campaigns } = await context.supabase
      .from("campaigns")
      .select("id, name, status")
      .eq("org_id", context.orgId)
      .ilike("name", `%${sq}%`)
      .limit(5);

    // Search leads
    const { data: leads } = await context.supabase
      .from("leads")
      .select("id, first_name, last_name, email, company")
      .eq("org_id", context.orgId)
      .or(`first_name.ilike.%${sq}%,last_name.ilike.%${sq}%,email.ilike.%${sq}%,company.ilike.%${sq}%`)
      .limit(5);

    return NextResponse.json({
      campaigns: campaigns || [],
      leads: leads || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}
