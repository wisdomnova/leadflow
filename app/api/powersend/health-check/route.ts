import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

/**
 * POST /api/powersend/health-check
 * 
 * Runs a health check on all active/warming smart servers for an org.
 * Calculates reputation based on actual send metrics from the last 24h.
 * 
 * Can be triggered:
 * 1. Manually from the PowerSend dashboard (Refresh button)
 * 2. Automatically by the Inngest cron every 15 minutes
 */
export async function POST(req: Request) {
  const supabase = getAdminClient();

  try {
    const body = await req.json().catch(() => ({}));
    const { orgId, serverId } = body;

    // Build query — either one server or all servers for an org
    let query = supabase
      .from('smart_servers')
      .select('*')
      .in('status', ['active', 'warming']);

    if (serverId) {
      query = query.eq('id', serverId);
    } else if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data: servers, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    if (!servers || servers.length === 0) {
      return NextResponse.json({ message: 'No servers to check', results: [] });
    }

    const results = [];

    for (const server of servers as any[]) {
      // Calculate metrics from actual send data in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Get send stats from activity_log for this server's sends
      const { count: totalSent } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('metadata->>powersend_node_id', server.id)
        .gte('created_at', twentyFourHoursAgo);

      const { count: bounceCount } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('metadata->>powersend_node_id', server.id)
        .eq('action_type', 'email_bounced')
        .gte('created_at', twentyFourHoursAgo);

      const { count: complaintCount } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('metadata->>powersend_node_id', server.id)
        .eq('action_type', 'email_complaint')
        .gte('created_at', twentyFourHoursAgo);

      const sent = totalSent || 0;
      const bounces = bounceCount || 0;
      const complaints = complaintCount || 0;

      // Calculate rates (avoid division by zero)
      const bounceRate = sent > 0 ? (bounces / sent) * 100 : 0;
      const complaintRate = sent > 0 ? (complaints / sent) * 100 : 0;
      const deliveryRate = sent > 0 ? ((sent - bounces) / sent) * 100 : 100;

      // Update reputation via the RPC
      const { data: newScore } = await (supabase as any).rpc('update_server_reputation', {
        server_id_param: server.id,
        new_bounce_rate: parseFloat(bounceRate.toFixed(2)),
        new_complaint_rate: parseFloat(complaintRate.toFixed(2)),
        new_delivery_rate: parseFloat(deliveryRate.toFixed(2)),
        check_source: 'system'
      });

      results.push({
        serverId: server.id,
        name: server.name,
        previousScore: server.reputation_score,
        newScore: newScore,
        metrics: {
          totalSent: sent,
          bounces,
          complaints,
          bounceRate: parseFloat(bounceRate.toFixed(2)),
          complaintRate: parseFloat(complaintRate.toFixed(2)),
          deliveryRate: parseFloat(deliveryRate.toFixed(2)),
        }
      });
    }

    // After updating all scores, enforce the reputation guard
    const { data: guardActions } = await (supabase as any).rpc('enforce_reputation_guard', {
      low_threshold: 70,
      restore_threshold: 85
    });

    return NextResponse.json({
      checked: results.length,
      results,
      guardActions: guardActions || [],
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
