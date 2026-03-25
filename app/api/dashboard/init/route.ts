import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { getAdminClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const orgId = context.orgId;
  const userId = context.userId;

    // Parse days param (default 7)
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const isAllTime = daysParam === 'all';
    const days = isAllTime ? 3650 : Math.min(Math.max(parseInt(daysParam || '7', 10) || 7, 1), 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    try {
      // 1. Fetch EVERYTHING in parallel
      const [
        statsCampaigns,
        activeCount,
        recentCampaigns,
        dailyStats,
        userProfile,
        recentActivities,
        emailAccounts,
        orgSubscription,
        globalStats
      ] = await Promise.all([
        // Stats
        supabase.from("campaigns").select("sent_count, open_count, reply_count, total_leads").eq("org_id", orgId),
        supabase.from("campaigns").select("id", { count: 'exact', head: true }).eq("org_id", orgId).eq("status", "running"),
        supabase.from("campaigns").select("id, name, status, sent_count, reply_count").eq("org_id", orgId).order("created_at", { ascending: false }).limit(3),
        supabase.from("analytics_daily").select("*").eq("org_id", orgId).gte("date", startDateStr).order("date", { ascending: true }),
        // Profile
        supabase.from("users").select("full_name").eq("id", userId).single(),
        // Activities (filtered to same date range as stats for consistency)
        supabase.from("activity_log").select("*").eq("org_id", orgId).gte("created_at", startDateStr).order("created_at", { ascending: false }).limit(10),
        // Services
        supabase.from("email_accounts").select("id").eq("org_id", orgId),
        supabase.from("organizations").select("subscription_status, trial_ends_at, plan_tier").eq("id", orgId).single(),
        // Global Daily Stats (for All-Time accuracy)
        supabase.from("analytics_daily").select("sent_count, open_count, reply_count").eq("org_id", orgId)
      ]);

      // Process Stats
      const totals = {
        totalSent: 0,
        totalOpened: 0,
        totalReplied: 0,
        totalLeads: 0,
        activeCampaigns: (activeCount as any).count || 0
      };

      if (isAllTime) {
        // Use analytics_daily for all-time totals to include deleted campaigns
        (globalStats.data as any[])?.forEach(d => {
          totals.totalSent += (d.sent_count || 0);
          totals.totalOpened += (d.open_count || 0);
          totals.totalReplied += (d.reply_count || 0);
        });
        // Leads still come from active/existing campaigns
        (statsCampaigns.data as any[])?.forEach(c => {
          totals.totalLeads += (c.total_leads || 0);
        });
      } else {
        // Range-based totals from analytics_daily (active within window)
        (dailyStats.data as any[])?.forEach(d => {
          totals.totalSent += (d.sent_count || 0);
          totals.totalOpened += (d.open_count || 0);
          totals.totalReplied += (d.reply_count || 0);
        });
        // For campaign-specific counts like total leads, we use the existing campaigns
        (statsCampaigns.data as any[])?.forEach(c => {
          totals.totalLeads += (c.total_leads || 0);
        });
      }

    const chartData = (dailyStats.data as any[])?.map(d => ({
      name: d.date 
        ? (days <= 7 
            ? new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }) 
            : new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        : '',
      sent: d.sent_count || 0,
      replies: d.reply_count || 0
    })) || [];

    // Process Services/Subscription
    const subData = (orgSubscription.data as any) || {};
    let effectiveStatus = subData.subscription_status || 'none';
    const trialExpired = subData.trial_ends_at ? new Date(subData.trial_ends_at) < new Date() : false;
    
    if (effectiveStatus === 'trialing') {
      if (trialExpired) {
        effectiveStatus = 'inactive';
      } else {
        effectiveStatus = 'active';
      }
    }

    return NextResponse.json({
      stats: {
        ...totals,
        recentCampaigns: recentCampaigns.data || [],
        chartData
      },
      profile: {
        user: userProfile.data
      },
      activities: recentActivities.data || [],
      services: {
        accountsCount: emailAccounts.data?.length || 0,
        subscription: {
          status: effectiveStatus,
          trial_ends_at: subData.trial_ends_at,
          tier: subData.plan_tier
        }
      }
    });

  } catch (err: any) {
    console.error("Dashboard Init Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
