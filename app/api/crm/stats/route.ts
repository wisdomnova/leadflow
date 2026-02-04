import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get counts in parallel
  const [
    { count: totalPushes, error: totalError },
    { count: failedPushes, error: failedError }
  ] = await Promise.all([
    context.supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("org_id", context.orgId)
      .eq("type", "crm.push"),
    context.supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("org_id", context.orgId)
      .eq("type", "crm.push")
      .not("metadata->error", "is", null)
  ]);

  // Get synced contacts (unique emails pushed successfully)
  // This is a bit more complex, for now we'll just return the counts
  
  return NextResponse.json({
    total: totalPushes || 0,
    failed: failedPushes || 0,
    success: (totalPushes || 0) - (failedPushes || 0),
    efficiency: totalPushes ? Math.round(((totalPushes - (failedPushes || 0)) / totalPushes) * 100) : 100
  });
}
