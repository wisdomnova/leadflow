import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { logLeadActivity } from "@/lib/activity-utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getAdminClient();

  // 1. Log the open in campaign_recipients
  // We increment 'opens' and potentially 'open_count' in campaigns
  const { data: recipient, error: fetchError } = await supabase
    .from("campaign_recipients")
    .select("campaign_id, lead_id, org_id, opens")
    .eq("id", id)
    .single();

  if (!fetchError && recipient) {
    // Only increment global 'open_count' on first open to avoid inflated stats
    const isFirstOpen = recipient.opens === 0;

    await supabase
      .from("campaign_recipients")
      .update({ opens: recipient.opens + 1, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (isFirstOpen) {
      await supabase.rpc('increment_campaign_stat', { 
        campaign_id_param: recipient.campaign_id, 
        column_param: 'open_count' 
      });
    }

    // Log the open activity
    await logLeadActivity({
      supabase,
      leadId: recipient.lead_id,
      orgId: recipient.org_id,
      type: 'email_opened',
      description: `Email opened in campaign: ${recipient.campaign_id}`
    });
  }

  // 2. Return a 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
