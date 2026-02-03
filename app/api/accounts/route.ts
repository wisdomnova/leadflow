import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await context.supabase
    .from("email_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, provider, config } = await req.json();

    if (!email || !provider) {
      return NextResponse.json({ error: "Email and provider are required" }, { status: 400 });
    }

    const { data, error } = await context.supabase
      .from("email_accounts")
      .insert({
        org_id: context.orgId,
        email,
        provider,
        config: config || {},
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
