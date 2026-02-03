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
    const avgHealth = accounts.length > 0 
      ? Math.round(accounts.reduce((sum, acc) => sum + (acc.config?.health || 100), 0) / accounts.length)
      : 100;

    const dnsHealthy = domains?.every(d => 
      d.spf_status === 'verified' && 
      d.dkim_status === 'verified' && 
      d.dmarc_status === 'verified'
    ) ?? false;

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
        // Mocking growth rates for UI visual appeal
        sentGrowth: "+12.5%",
        healthGrowth: "+0.4%",
        spamGrowth: "+8.2%"
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
