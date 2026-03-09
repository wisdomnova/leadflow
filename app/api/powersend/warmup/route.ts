import { NextResponse } from 'next/server';
import { getSessionContext } from "@/lib/auth-utils";
import { checkSubscription } from "@/lib/subscription-check";
import { getAdminClient } from "@/lib/supabase";

/**
 * GET /api/powersend/warmup
 * Returns warmup status and stats for all nodes belonging to the org.
 */
export async function GET() {
  const context = await getSessionContext();

  try {
    if (!context) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { orgId } = context;
    const sub = await checkSubscription(orgId);
    const adminClient = getAdminClient();

    if (sub.tier !== 'enterprise') {
      return NextResponse.json({ nodes: [], stats: {} }, { status: 200 });
    }

    // Fetch all nodes with warmup data
    const { data: servers, error } = await adminClient
      .from('smart_servers')
      .select('id, name, status, warmup_enabled, warmup_day, warmup_started_at, warmup_completed_at, warmup_target_limit, warmup_daily_sends, daily_limit, reputation_score, ip_address, domain_name')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch recent warmup stats (last 14 days) for warming nodes
    const warmingIds = (servers || [])
      .filter((s: any) => s.warmup_enabled || s.warmup_completed_at)
      .map((s: any) => s.id);

    let warmupStats: any[] = [];
    if (warmingIds.length > 0) {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data: stats } = await adminClient
        .from('powersend_warmup_stats')
        .select('*')
        .in('server_id', warmingIds)
        .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      warmupStats = stats || [];
    }

    // Summary stats
    const warmingCount = (servers || []).filter((s: any) => s.warmup_enabled && s.status === 'warming').length;
    const completedCount = (servers || []).filter((s: any) => s.warmup_completed_at).length;
    const avgDay = warmingCount > 0
      ? Math.round((servers || []).filter((s: any) => s.warmup_enabled && s.status === 'warming').reduce((sum: number, s: any) => sum + (s.warmup_day || 0), 0) / warmingCount)
      : 0;

    return NextResponse.json({
      nodes: servers || [],
      warmupStats,
      summary: {
        warmingCount,
        completedCount,
        avgDay,
        totalNodes: (servers || []).length,
      }
    });
  } catch (error: any) {
    console.error('Error fetching PowerSend warmup data:', error);
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}

/**
 * POST /api/powersend/warmup
 * Start or stop warmup for a specific node.
 * Body: { serverId, action: 'start' | 'stop' | 'restart', targetLimit?: number }
 */
export async function POST(req: Request) {
  const context = await getSessionContext();

  try {
    if (!context) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { orgId } = context;
    const sub = await checkSubscription(orgId);

    if (sub.tier !== 'enterprise') {
      return new NextResponse('PowerSend is Enterprise-only', { status: 403 });
    }

    const { serverId, action, targetLimit } = await req.json();

    if (!serverId || !action) {
      return new NextResponse('Missing serverId or action', { status: 400 });
    }

    const adminClient = getAdminClient();

    // Verify the server belongs to this org
    const { data: server, error: fetchError } = await adminClient
      .from('smart_servers')
      .select('*')
      .eq('id', serverId)
      .eq('org_id', orgId)
      .single();

    if (fetchError || !server) {
      return new NextResponse('Server not found', { status: 404 });
    }

    if (action === 'start' || action === 'restart') {
      // Start warmup: set status to warming, day 1, low daily limit
      const warmupLimit = 10; // Day 1 limit
      const target = targetLimit || (server as any).daily_limit || 500;

      const { data: updated, error: updateError } = await (adminClient as any)
        .from('smart_servers')
        .update({
          warmup_enabled: true,
          warmup_day: 1,
          warmup_started_at: new Date().toISOString(),
          warmup_completed_at: null,
          warmup_target_limit: target,
          warmup_daily_sends: 0,
          daily_limit: warmupLimit,
          status: 'warming',
        })
        .eq('id', serverId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Create first day stats row
      await (adminClient as any)
        .from('powersend_warmup_stats')
        .upsert({
          server_id: serverId,
          org_id: orgId,
          date: new Date().toISOString().split('T')[0],
          warmup_day: 1,
          daily_limit: warmupLimit,
          sent_count: 0,
        } as any, { onConflict: 'server_id,date' });

      return NextResponse.json({ success: true, server: updated, message: 'Warmup started' });

    } else if (action === 'stop') {
      // Stop warmup: restore target limit, set to active
      const target = (server as any).warmup_target_limit || (server as any).daily_limit || 500;

      const { data: updated, error: updateError } = await (adminClient as any)
        .from('smart_servers')
        .update({
          warmup_enabled: false,
          warmup_completed_at: new Date().toISOString(),
          daily_limit: target,
          status: 'active',
          warmup_daily_sends: 0,
        })
        .eq('id', serverId)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({ success: true, server: updated, message: 'Warmup stopped' });

    } else {
      return new NextResponse('Invalid action. Use start, stop, or restart.', { status: 400 });
    }
  } catch (error: any) {
    console.error('Error managing PowerSend warmup:', error);
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}
