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
    return new NextResponse(error.message, { status: 500 });
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

    const { data: server, error } = await (adminClient as any)
      .from('smart_servers')
      .update(body)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(server);
  } catch (error: any) {
    console.error('Error updating smart server:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
