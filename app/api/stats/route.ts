import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [
    { data: campaigns, error: campaignError },
    { count: activeCount },
    { data: recent },
    { data: daily }
  ] = await Promise.all([
    context.supabase
      .from("campaigns")
      .select("sent_count, open_count, reply_count, total_leads")
      .eq("org_id", context.orgId),
    context.supabase
      .from("campaigns")
      .select("id", { count: 'exact', head: true })
      .eq("org_id", context.orgId)
      .eq("status", "running"),
    context.supabase
      .from("campaigns")
      .select("id, name, status, sent_count, reply_count")
      .eq("org_id", context.orgId)
      .order("created_at", { ascending: false })
      .limit(3),
    context.supabase
      .from("analytics_daily")
      .select("*")
      .eq("org_id", context.orgId)
      .gte("date", sevenDaysAgoStr)
      .order("date", { ascending: true })
  ]);

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 500 });
  }

  const totals = {
    totalSent: 0,
    totalOpened: 0,
    totalReplied: 0,
    totalLeads: 0,
    activeCampaigns: activeCount || 0
  };

  campaigns?.forEach(c => {
    totals.totalSent += (c.sent_count || 0);
    totals.totalOpened += (c.open_count || 0);
    totals.totalReplied += (c.reply_count || 0);
    totals.totalLeads += (c.total_leads || 0);
  });

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
