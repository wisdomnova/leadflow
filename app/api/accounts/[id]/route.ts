import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if any active campaigns are using this sender
  // NOTE: TOCTOU race — a campaign could start between this check and the delete.
  // For full safety, wrap in a DB transaction or use a DB-level constraint.
  const { data: activeCampaigns } = await context.supabase
    .from("campaigns")
    .select("id, name")
    .eq("sender_id", id)
    .eq("org_id", context.orgId)
    .eq("status", "running");

  if (activeCampaigns && activeCampaigns.length > 0) {
    const campaignNames = activeCampaigns.map(c => c.name).join(", ");
    return NextResponse.json({ 
      error: `Cannot delete sender profile. It is currently being used by active campaigns: ${campaignNames}. Please pause them first.` 
    }, { status: 400 });
  }

  const { error } = await context.supabase
    .from("email_accounts")
    .delete()
    .eq("id", id)
    .eq("org_id", context.orgId);

  if (error) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
