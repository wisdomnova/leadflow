import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserJWT } from "@/lib/jwt";
import { getAdminClient } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const minimal = searchParams.get('minimal') === 'true';

    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyUserJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const supabase = getAdminClient();

    // If minimal requested, only fetch user and org info (for header/dropdown)
    if (minimal) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select(`
          full_name,
          email,
          avatar_url,
          organizations (
            name,
            plan,
            plan_tier
          )
        `)
        .eq("id", payload.userId)
        .single();
      
      if (userError || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      return NextResponse.json({ user });
    }

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0];

    // Fetch everything in parallel
    const [
      { data: user, error: userError },
      { count: campaignsCount },
      { count: leadsCount },
      { data: analyticsData },
      { data: campaignStats }
    ] = await Promise.all([
      (supabase as any)
        .from("users")
        .select(`
          *,
          organizations (
            name,
            plan,
            plan_tier,
            subscription_status,
            trial_ends_at
          )
        `)
        .eq("id", payload.userId)
        .single(),
      (supabase as any)
        .from("campaigns")
        .select("*", { count: 'exact', head: true })
        .eq("org_id", payload.orgId),
      (supabase as any)
        .from("leads")
        .select("*", { count: 'exact', head: true })
        .eq("org_id", payload.orgId),
      (supabase as any)
        .from("analytics_daily")
        .select("sent_count, reply_count")
        .eq("org_id", payload.orgId)
        .gte("date", firstDayOfMonthStr),
      (supabase as any)
        .from("campaigns")
        .select("reply_count")
        .eq("org_id", payload.orgId)
    ]);

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalSentThisMonth = (analyticsData || [])?.reduce((acc: number, curr: any) => acc + (curr.sent_count || 0), 0) || 0;
    const totalRepliesThisMonth = (analyticsData || [])?.reduce((acc: number, curr: any) => acc + (curr.reply_count || 0), 0) || 0;
    
    // Average response rate
    const actualResponseRate = totalSentThisMonth > 0 ? (totalRepliesThisMonth / totalSentThisMonth) * 100 : 0;

    // Attainment calculations
    const monthlyTargetAttainment = (user as any).monthly_target_goal > 0 
      ? Math.min(Math.round((totalSentThisMonth / (user as any).monthly_target_goal) * 100), 100)
      : 0;

    const responseRateAttainment = (user as any).response_rate_goal > 0
      ? Math.min(Math.round((actualResponseRate / (user as any).response_rate_goal) * 100), 100)
      : 0;

    const totalRepliesAllTime = (campaignStats || [])?.reduce((acc: number, curr: any) => acc + (curr.reply_count || 0), 0) || 0;

    return NextResponse.json({
      user,
      stats: {
        campaigns: campaignsCount || 0,
        activeLeads: leadsCount || 0,
        replies: totalRepliesAllTime,
        attainment: {
          monthly: monthlyTargetAttainment,
          response: responseRateAttainment,
          actualSent: totalSentThisMonth,
          actualResponseRate: actualResponseRate.toFixed(1)
        }
      }
    });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyUserJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      fullName, 
      jobTitle, 
      location, 
      bio, 
      twitterUrl, 
      linkedinUrl, 
      websiteUrl,
      avatarUrl,
      bannerUrl,
      monthlyTargetGoal,
      responseRateGoal,
      timezone,
      notificationPrefs
    } = body;

    const supabase = getAdminClient();

    const { data: updatedUser, error: updateError } = await (supabase as any)
      .from("users")
      .update({
        full_name: fullName,
        job_title: jobTitle,
        location,
        bio,
        twitter_url: twitterUrl,
        linkedin_url: linkedinUrl,
        website_url: websiteUrl,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        monthly_target_goal: monthlyTargetGoal,
        response_rate_goal: responseRateGoal,
        timezone,
        notification_prefs: notificationPrefs,
        updated_at: new Date().toISOString()
      })
      .eq("id", payload.userId)
      .select()
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Profile POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
