import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await context.supabase
    .from("crm_integrations")
    .select("*")
    .eq("org_id", context.orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function DELETE(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Integration ID is required" }, { status: 400 });
  }

  const { error } = await context.supabase
    .from("crm_integrations")
    .delete()
    .eq("id", id)
    .eq("org_id", context.orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
