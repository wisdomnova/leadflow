import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const token = searchParams.get("token");

  if (!slug || !token) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const adminClient = getAdminClient();
    const { data: org, error } = await adminClient
      .from("organizations")
      .select("name, auto_join_enabled")
      .eq("slug", slug)
      .eq("join_token", token)
      .single();

    if (error || !org) {
      return NextResponse.json({ error: "Organization not found or token invalid" }, { status: 404 });
    }

    return NextResponse.json({
      name: org.name,
      autoJoinEnabled: org.auto_join_enabled
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
