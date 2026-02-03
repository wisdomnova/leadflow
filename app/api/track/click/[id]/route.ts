import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipientId = id;
  const url = req.nextUrl.searchParams.get("url");

  if (!recipientId || !url) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const supabase = getAdminClient();

  try {
    // 1. Log the click in activity_log or update metrics
    // For production, we want to be fast, so we might skip a complex join and just log by recipientId
    const { data: recipient } = await supabase
      .from("campaign_recipients")
      .select("org_id, campaign_id, lead_id")
      .eq("id", recipientId)
      .single();

    if (recipient) {
      // Increment click_count in campaigns
      await supabase.rpc('increment_campaign_stat', { 
        campaign_id_param: recipient.campaign_id, 
        column_param: 'click_count' 
      });

      // Log activity
      await supabase.from("activity_log").insert({
        org_id: recipient.org_id,
        action_type: "email.click",
        description: `Lead clicked a link: ${url}`,
        metadata: {
          recipient_id: recipientId,
          campaign_id: recipient.campaign_id,
          lead_id: recipient.lead_id,
          url: url
        }
      });
    }

    // 2. Redirect to the original URL
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("Click Tracking Error:", err);
    return NextResponse.redirect(url); // Redirect anyway so the user isn't stuck
  }
}
