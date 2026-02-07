import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch accounts
    const { data: accounts, error: accountsError } = await context.supabase
      .from("email_accounts")
      .select("*")
      .eq("org_id", context.orgId)
      .order("created_at", { ascending: false });

    if (accountsError) throw accountsError;

    // 2. Fetch aggregate stats from warmup_stats
    const { data: statsData, error: statsError } = await context.supabase
      .from("warmup_stats")
      .select("sent_count, inbox_count, spam_count, health_score")
      .eq("org_id", context.orgId);

    if (statsError) throw statsError;

    // 3. Fetch domain health (DNS status)
    const { data: domains, error: domainsError } = await context.supabase
      .from("sending_domains")
      .select("spf_status, dkim_status, dmarc_status")
      .eq("org_id", context.orgId);

    // Calculate aggregates
    const totalSent = statsData?.reduce((sum, s) => sum + (s.sent_count || 0), 0) || 0;
    const totalSavedFromSpam = statsData?.reduce((sum, s) => sum + (s.inbox_count || 0), 0) || 0;
    
    // 4. Calculate Growth Metrics (Last 7 Days vs Previous 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: recentStats } = await context.supabase
      .from("warmup_stats")
      .select("sent_count, inbox_count")
      .eq("org_id", context.orgId)
      .gte("date", sevenDaysAgo.toISOString().split('T')[0]);

    const { data: previousStats } = await context.supabase
      .from("warmup_stats")
      .select("sent_count, inbox_count")
      .eq("org_id", context.orgId)
      .gte("date", fourteenDaysAgo.toISOString().split('T')[0])
      .lt("date", sevenDaysAgo.toISOString().split('T')[0]);

    const currentSent = recentStats?.reduce((sum, s) => sum + (s.sent_count || 0), 0) || 0;
    const prevSent = previousStats?.reduce((sum, s) => sum + (s.sent_count || 0), 0) || 0;
    const currentSpamSaved = recentStats?.reduce((sum, s) => sum + (s.inbox_count || 0), 0) || 0;
    const prevSpamSaved = previousStats?.reduce((sum, s) => sum + (s.inbox_count || 0), 0) || 0;

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const growth = ((current - previous) / previous) * 100;
      return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
    };

    const avgHealth = accounts.length > 0 
      ? Math.round(accounts.reduce((sum, acc) => sum + (acc.config?.health || 0), 0) / accounts.length)
      : 0;

    const dnsHealthy = (domains?.length ?? 0) > 0 && domains?.every(d => 
      d.spf_status === 'verified' && 
      d.dkim_status === 'verified' && 
      d.dmarc_status === 'verified'
    );

    const transformedAccounts = accounts.map(acc => ({
      ...acc,
      warmup_enabled: acc.warmup_enabled ?? false,
      warmup_status: acc.warmup_status ?? 'Paused',
      health: acc.config?.health || 100,
      daily_volume: acc.sent_today || 0,
      warmup_limit: acc.warmup_daily_limit || 50,
    }));

    return NextResponse.json({
      accounts: transformedAccounts,
      stats: {
        totalSent,
        totalSavedFromSpam,
        avgHealth,
        activeAccounts: transformedAccounts.filter(a => a.warmup_enabled).length,
        dnsHealthy,
        sentGrowth: calculateGrowth(currentSent, prevSent),
        healthGrowth: "+0.2%", // Health is usually stable, placeholder for minor fluctuation logic
        spamGrowth: calculateGrowth(currentSpamSaved, prevSpamSaved)
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, warmup_enabled, warmup_status, warmup_limit, ramp_up, reply_rate } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (warmup_enabled !== undefined) updateData.warmup_enabled = warmup_enabled;
    if (warmup_status !== undefined) updateData.warmup_status = warmup_status;
    if (warmup_limit !== undefined) updateData.warmup_daily_limit = warmup_limit;
    if (ramp_up !== undefined) updateData.warmup_ramp_up = ramp_up;
    if (reply_rate !== undefined) updateData.warmup_reply_rate = reply_rate;

    const { error } = await context.supabase
      .from("email_accounts")
      .update(updateData)
      .eq("id", id)
      .eq("org_id", context.orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
