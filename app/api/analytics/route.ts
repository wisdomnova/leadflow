import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("timeRange") || "30");
  
  try {
    const supabase = context.supabase;
    const orgId = context.orgId;

    const now = new Date();
    const periodStart = new Date();
    periodStart.setDate(now.getDate() - days);
    
    const prevPeriodStart = new Date();
    prevPeriodStart.setDate(now.getDate() - (days * 2));

    // 1 & 2. Fetch everything in parallel
    const [
      { data: campaigns, error: campaignsError },
      { data: dailyStats, error: dailyError }
    ] = await Promise.all([
      supabase
        .from("campaigns")
        .select("id, name, sent_count, open_count, reply_count, click_count")
        .eq("org_id", orgId)
        .gt('sent_count', 0)
        .order("sent_count", { ascending: false })
        .limit(5),
      supabase
        .from("analytics_daily")
        .select("*")
        .eq("org_id", orgId)
        .gte("date", prevPeriodStart.toISOString().split('T')[0])
        .order("date", { ascending: false })
    ]);

    if (campaignsError) throw campaignsError;
    if (dailyError) throw dailyError;

    // Split stats into current and previous periods
    const currentPeriodStats = dailyStats.filter(s => s.date >= periodStart.toISOString().split('T')[0]);
    const prevPeriodStats = dailyStats.filter(s => s.date < periodStart.toISOString().split('T')[0] && s.date >= prevPeriodStart.toISOString().split('T')[0]);

    const aggregate = (stats: any[]) => ({
      sent: stats.reduce((acc, s) => acc + (s.sent_count || 0), 0),
      open: stats.reduce((acc, s) => acc + (s.open_count || 0), 0),
      reply: stats.reduce((acc, s) => acc + (s.reply_count || 0), 0),
      click: stats.reduce((acc, s) => acc + (s.click_count || 0), 0),
    });

    const currentData = aggregate(currentPeriodStats);
    const prevData = aggregate(prevPeriodStats);

    const calculateChange = (current: number, prev: number) => {
      if (prev === 0) return { trend: current > 0 ? 'up' : 'up', change: current > 0 ? '+100%' : '0%' };
      const percent = ((current - prev) / prev) * 100;
      return {
        trend: percent >= 0 ? 'up' : 'down',
        change: `${percent >= 0 ? '+' : ''}${percent.toFixed(0)}%`
      };
    };

    const getRate = (part: number, total: number) => total > 0 ? ((part / total) * 100).toFixed(1) + '%' : '0%';

    const stats = [
      { 
        name: 'Total Sent', 
        value: currentData.sent.toLocaleString(), 
        ...calculateChange(currentData.sent, prevData.sent) 
      },
      { 
        name: 'Open Rate', 
        value: getRate(currentData.open, currentData.sent),
        ...calculateChange(
          currentData.sent > 0 ? (currentData.open / currentData.sent) : 0,
          prevData.sent > 0 ? (prevData.open / prevData.sent) : 0
        )
      },
      { 
        name: 'Replies', 
        value: currentData.reply.toLocaleString(),
        ...calculateChange(currentData.reply, prevData.reply)
      },
      { 
        name: 'Click Rate', 
        value: getRate(currentData.click, currentData.sent),
        ...calculateChange(
            currentData.sent > 0 ? (currentData.click / currentData.sent) : 0,
            prevData.sent > 0 ? (prevData.click / prevData.sent) : 0
        )
      }
    ];

    const topCampaigns = campaigns.map(c => ({
      id: c.id,
      name: c.name,
      rate: getRate(c.open_count, c.sent_count),
      volume: c.sent_count.toLocaleString(),
      replies: c.reply_count.toLocaleString()
    }));

    // Generate activity data for the chart (last X days)
    const dailyActivity = currentPeriodStats.map(s => ({
      date: s.date,
      sent: s.sent_count || 0,
      open: s.open_count || 0
    })).reverse(); // Oldest to newest

    return NextResponse.json({ stats, topCampaigns, dailyActivity });

  } catch (err: any) {
    console.error("Analytics API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
