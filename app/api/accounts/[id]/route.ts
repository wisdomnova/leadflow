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
  const { data: activeCampaigns } = await context.supabase
    .from("campaigns")
    .select("id, name")
    .eq("sender_id", id)
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
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
