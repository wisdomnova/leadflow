import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { getAdminClient } from "@/lib/supabase";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = getAdminClient();
  const { data, error } = await adminSupabase
    .from("email_accounts")
    .select("*")
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch email accounts:", error);
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

    const adminSupabase = getAdminClient();

    // Check if this email already exists for the organization
    const { data: existingAccount } = await adminSupabase
      .from("email_accounts")
      .select("id, email")
      .eq("org_id", context.orgId)
      .eq("email", email)
      .single();

    if (existingAccount) {
      return NextResponse.json({ 
        error: `${email} is already connected to your account. You can connect multiple different email addresses, but each email address can only be added once.` 
      }, { status: 409 });
    }

    const { data, error } = await adminSupabase
      .from("email_accounts")
      .insert([{
        org_id: context.orgId,
        email,
        provider,
        config: config || {},
        status: "active",
      }] as any)
      .select()
      .single();

    if (error) {
      console.error("Failed to create email account:", error);
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: `${email} is already connected to your account. You can connect multiple different email addresses, but each email address can only be added once.` 
        }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Invalid request body:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
