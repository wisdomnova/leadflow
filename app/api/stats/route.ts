import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: campaigns, error: campaignError } = await context.supabase
    .from("campaigns")
    .select("sent_count, open_count, reply_count, total_leads")
    .eq("org_id", context.orgId);

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 500 });
  }

  const totals = {
    totalSent: 0,
    totalOpened: 0,
    totalReplied: 0,
    totalLeads: 0,
    activeCampaigns: 0
  };

  campaigns?.forEach(c => {
    totals.totalSent += (c.sent_count || 0);
    totals.totalOpened += (c.open_count || 0);
    totals.totalReplied += (c.reply_count || 0);
    totals.totalLeads += (c.total_leads || 0);
  });

  // Get active campaigns count
  const { count: activeCount } = await context.supabase
    .from("campaigns")
    .select("id", { count: 'exact', head: true })
    .eq("org_id", context.orgId)
    .eq("status", "running");

  totals.activeCampaigns = activeCount || 0;

  // Get recent campaigns
  const { data: recent } = await context.supabase
    .from("campaigns")
    .select("id, name, status, sent_count, reply_count")
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false })
    .limit(3);

  // Get daily stats for the last 7 days for the dashboard chart
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: daily } = await context.supabase
    .from("analytics_daily")
    .select("*")
    .eq("org_id", context.orgId)
    .gte("date", sevenDaysAgo.toISOString().split('T')[0])
    .order("date", { ascending: true });

  const chartData = daily?.map(d => ({
    name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    sent: d.sent_count || 0,
    replies: d.reply_count || 0
  })) || [];

  return NextResponse.json({ 
    ...totals, 
    recentCampaigns: recent || [],
    chartData
  });
}
