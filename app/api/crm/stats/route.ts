import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get counts in parallel — pushes, imports, and failures
  const [
    { count: totalPushes },
    { count: failedPushes },
    { count: totalImports },
    { count: importedLeads }
  ] = await Promise.all([
    context.supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("org_id", context.orgId)
      .eq("action_type", "crm.push"),
    context.supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("org_id", context.orgId)
      .eq("action_type", "crm.push")
      .not("metadata->error", "is", null),
    context.supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("org_id", context.orgId)
      .eq("action_type", "crm.import"),
    context.supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("org_id", context.orgId)
      .in("source", ["hubspot", "pipedrive", "salesforce"])
  ]);

  const totalSynced = (totalPushes || 0) + (importedLeads || 0);
  const totalOps = (totalPushes || 0) + (totalImports || 0);
  const failedOps = failedPushes || 0;
  
  return NextResponse.json({
    total: totalSynced,
    totalPushes: totalPushes || 0,
    totalImports: totalImports || 0,
    importedLeads: importedLeads || 0,
    failed: failedOps,
    success: totalOps - failedOps,
    efficiency: totalOps ? Math.round(((totalOps - failedOps) / totalOps) * 100) : 100
  });
}
