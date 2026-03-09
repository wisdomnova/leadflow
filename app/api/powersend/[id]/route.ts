import { NextResponse } from 'next/server';
import { getSessionContext } from "@/lib/auth-utils";
import { getAdminClient } from "@/lib/supabase";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getSessionContext();

  try {
    if (!context) {
      return new NextResponse('Unauthorized', { status: 401 }); 
    }

    const { orgId } = context;
    const { id } = await params;
    const adminClient = getAdminClient();

    const { error } = await adminClient
      .from('smart_servers')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting smart server:', error);
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getSessionContext();

  try {
    if (!context) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { orgId } = context;
    const { id } = await params;
    const body = await req.json();
    const adminClient = getAdminClient();

    // Whitelist allowed fields to prevent mass-assignment
    const ALLOWED_FIELDS = ['name', 'status', 'daily_limit', 'warmup_config', 'reputation_score'];
    const sanitizedBody: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) sanitizedBody[key] = body[key];
    }
    if (Object.keys(sanitizedBody).length === 0) {
      return new NextResponse('No valid fields to update', { status: 400 });
    }

    const { data: server, error } = await (adminClient as any)
      .from('smart_servers')
      .update(sanitizedBody)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(server);
  } catch (error: any) {
    console.error('Error updating smart server:', error);
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}
