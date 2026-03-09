import { NextResponse } from 'next/server';
import { getSessionContext } from "@/lib/auth-utils";
import { checkSubscription } from "@/lib/subscription-check";

export async function GET() {
  const context = await getSessionContext();

  try {
    if (!context) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { supabase, orgId } = context;
    const sub = await checkSubscription(orgId);

    if (!sub.active) {
      return new NextResponse('Subscription inactive', { status: 403 });
    }

    if (sub.tier !== 'enterprise') {
      return NextResponse.json({ servers: [], stats: { totalNodes: 0, activeNodes: 0, avgReputation: 100, totalSends: 0 }, restricted: true });
    }

    // Fetch smart servers
    // Use admin client for reliable reads (avoids custom JWT + RLS edge cases)
    const { getAdminClient } = await import('@/lib/supabase');
    const adminClient = getAdminClient();

    const { data: servers, error: serversError } = await (adminClient as any)
      .from('smart_servers')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (serversError) throw serversError;

    // Fetch some stats (count unique nodes, avg reputation, etc.)
    const serverList = (servers || []) as any[];
    const stats = {
      totalNodes: serverList.length,
      activeNodes: serverList.filter((s: any) => s.status === 'active').length,
      avgReputation: serverList.length 
        ? Math.round(serverList.reduce((acc: number, s: any) => acc + (s.reputation_score || 0), 0) / serverList.length) 
        : 100,
      totalSends: serverList.reduce((acc: number, s: any) => acc + (s.total_sends || 0), 0),
    };

    return NextResponse.json({ servers: serverList, stats });
  } catch (error: any) {
    console.error('Error fetching powersend data:', error);
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const context = await getSessionContext();

  try {
    if (!context) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { supabase, orgId } = context;
    const sub = await checkSubscription(orgId);

    // Gating — PowerSend is Enterprise-only
    if (sub.tier !== 'enterprise') {
       return new NextResponse('PowerSend is only available on the Enterprise plan. Please upgrade to continue.', { status: 403 });
    }

    // Check limits (scoped to this org)
    const { count } = await supabase
      .from('smart_servers')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);
    
    const limits = sub.limits || { powersend: 0 };
    if (count && count >= limits.powersend) {
      return new NextResponse(`You have reached the maximum number of Smart Servers for your plan (${limits.powersend}).`, { status: 403 });
    }

    const body = await req.json();

    // Use admin client for insert to avoid RLS issues with custom JWT
    const { getAdminClient } = await import('@/lib/supabase');
    const adminClient = getAdminClient();

    const { data: server, error } = await (adminClient as any)
      .from('smart_servers')
      .insert([
        {
          name: body.name,
          domain_name: body.domain_name || null,
          ip_address: body.ip_address || null,
          daily_limit: body.daily_limit || 500,
          api_key: body.api_key || null,
          default_smtp_host: body.default_smtp_host || null,
          default_smtp_port: body.default_smtp_port ? parseInt(body.default_smtp_port) : null,
          default_imap_host: body.default_imap_host || null,
          default_imap_port: body.default_imap_port ? parseInt(body.default_imap_port) : null,
          smtp_config: body.smtp_config || {},
          org_id: orgId,
          provider: body.provider || 'custom',
          status: 'active',
          reputation_score: 100,
          current_usage: 0
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(server);
  } catch (error: any) {
    console.error('Error adding smart server:', error);
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}
