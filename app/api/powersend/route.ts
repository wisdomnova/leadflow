import { NextResponse } from 'next/server';
import { getSessionContext } from "@/lib/auth-utils";

export async function GET() {
  const context = await getSessionContext();

  try {
    if (!context) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { supabase, orgId } = context;

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
    const body = await req.json();

    const { data: server, error } = await supabase
      .from('smart_servers')
      .insert([
        {
          ...body,
          org_id: orgId,
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
