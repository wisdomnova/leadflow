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

    if (sub.tier === 'starter') {
      return NextResponse.json({ servers: [], stats: { totalNodes: 0, activeNodes: 0, avgReputation: 100, totalSends: 0 }, restricted: true });
    }

    // Fetch smart servers
    const { data: servers, error: serversError } = await supabase
      .from('smart_servers')
      .select('*')
      .order('created_at', { ascending: false });

    if (serversError) throw serversError;

    // Fetch some stats (count unique nodes, avg reputation, etc.)
    const stats = {
      totalNodes: servers?.length || 0,
      activeNodes: servers?.filter(s => s.status === 'active').length || 0,
      avgReputation: servers?.length 
        ? Math.round(servers.reduce((acc, s) => acc + (s.reputation_score || 0), 0) / servers.length) 
        : 100,
      totalSends: servers?.reduce((acc, s) => acc + (s.total_sends || 0), 0) || 0,
    };

    return NextResponse.json({ servers, stats });
  } catch (error: any) {
    console.error('Error fetching powersend data:', error);
    return new NextResponse(error.message, { status: 500 });
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

    // Gating
    if (sub.tier === 'starter') {
       return new NextResponse('PowerSend is not available on the Starter plan. Please upgrade to Pro.', { status: 403 });
    }

    // Check limits
    const { count } = await supabase
      .from('smart_servers')
      .select('*', { count: 'exact', head: true });
    
    const limits = sub.limits || { powersend: 0 };
    if (count && count >= limits.powersend) {
      return new NextResponse(`You have reached the maximum number of Smart Servers for your plan (${limits.powersend}).`, { status: 403 });
    }

    const body = await req.json();

    const { data: server, error } = await supabase
      .from('smart_servers')
      .insert([
        {
          ...body,
          org_id: orgId,
          provider: 'mailreef', // Only Mailreef supported now
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
    return new NextResponse(error.message, { status: 500 });
  }
}
