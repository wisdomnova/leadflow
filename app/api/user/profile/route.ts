import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserJWT } from "@/lib/jwt";
import { getAdminClient } from "@/lib/supabase";

export async function GET() {
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

    const supabase = getAdminClient();

    // Fetch user and organization info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(`
        *,
        organizations (
          name,
          plan,
          subscription_status,
          trial_ends_at
        )
      `)
      .eq("id", payload.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch some stats for the profile
    const { count: campaignsCount } = await supabase
      .from("campaigns")
      .select("*", { count: 'exact', head: true })
      .eq("org_id", payload.orgId);

    const { count: leadsCount } = await supabase
      .from("leads")
      .select("*", { count: 'exact', head: true })
      .eq("org_id", payload.orgId);

    // Fetch Analytics for live goals
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { data: analyticsData } = await supabase
      .from("analytics_daily")
      .select("sent_count, reply_count")
      .eq("org_id", payload.orgId)
      .gte("date", firstDayOfMonth.toISOString().split('T')[0]);

    const totalSentThisMonth = analyticsData?.reduce((acc, curr) => acc + (curr.sent_count || 0), 0) || 0;
    const totalRepliesThisMonth = analyticsData?.reduce((acc, curr) => acc + (curr.reply_count || 0), 0) || 0;
    
    // Average response rate
    const actualResponseRate = totalSentThisMonth > 0 ? (totalRepliesThisMonth / totalSentThisMonth) * 100 : 0;

    // Attainment calculations
    // If target is 1000 emails and sent 850, monthlyTargetAttainment is 85%
    // If goal is 10% response rate and actual is 9.2%, responseRateAttainment is 92%
    const monthlyTargetAttainment = user.monthly_target_goal > 0 
      ? Math.min(Math.round((totalSentThisMonth / user.monthly_target_goal) * 100), 100)
      : 0;

    const responseRateAttainment = user.response_rate_goal > 0
      ? Math.min(Math.round((actualResponseRate / user.response_rate_goal) * 100), 100)
      : 0;

    // Fetch total replies from all time for the stats card
    const { data: campaignStats } = await supabase
      .from("campaigns")
      .select("reply_count")
      .eq("org_id", payload.orgId);
    
    const totalRepliesAllTime = campaignStats?.reduce((acc, curr) => acc + (curr.reply_count || 0), 0) || 0;

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

    const { data: updatedUser, error: updateError } = await supabase
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
