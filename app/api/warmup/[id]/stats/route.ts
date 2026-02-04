import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 1. Fetch historical stats for the account (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: history, error: historyError } = await context.supabase
      .from("warmup_stats")
      .select("date, sent_count, inbox_count, spam_count, health_score")
      .eq("account_id", id)
      .gte("date", dateStr)
      .order("date", { ascending: true });

    if (historyError) throw historyError;

    // 2. Calculate summary
    const totalSent = history?.reduce((sum, s) => sum + (s.sent_count || 0), 0) || 0;
    const totalInbox = history?.reduce((sum, s) => sum + (s.inbox_count || 0), 0) || 0;
    const totalSpam = history?.reduce((sum, s) => sum + (s.spam_count || 0), 0) || 0;
    const avgHealth = history?.length > 0
      ? Math.round(history.reduce((sum, s) => sum + (s.health_score || 0), 0) / history.length)
      : 0;

    // Format dates for the chart (e.g., "Oct 24")
    const formattedHistory = (history || []).map(h => ({
      ...h,
      date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    return NextResponse.json({
      history: formattedHistory,
      summary: {
        totalSent,
        totalInbox,
        totalSpam,
        avgHealth
      }
    });

  } catch (error: any) {
    console.error("Error fetching account warmup stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
