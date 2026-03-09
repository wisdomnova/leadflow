import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

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
    .from("sending_domains")
    .delete()
    .eq("id", id)
    .eq("org_id", context.orgId);

  if (error) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
