import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { status } = await req.json();

  const { error } = await context.supabase
    .from("campaigns")
    .update({ status })
    .eq("id", id)
    .eq("org_id", context.orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await context.supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("org_id", context.orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
