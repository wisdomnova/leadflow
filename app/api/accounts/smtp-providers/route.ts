import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { getAdminClient } from "@/lib/supabase";

/**
 * GET /api/accounts/smtp-providers
 * List all SMTP provider presets for the org.
 * 
 * POST /api/accounts/smtp-providers
 * Create a new SMTP provider preset.
 */
export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = getAdminClient();
  const { data, error } = await adminSupabase
    .from("smtp_providers")
    .select("*")
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, providerType, smtpHost, smtpPort, smtpSecurity, imapHost, imapPort, imapSecurity, isDefault } = body;

    if (!name || !smtpHost || !imapHost) {
      return NextResponse.json({ error: "Name, SMTP host, and IMAP host are required" }, { status: 400 });
    }

    const adminSupabase = getAdminClient();

    // If setting as default, unset other defaults
    if (isDefault) {
      await (adminSupabase as any)
        .from("smtp_providers")
        .update({ is_default: false })
        .eq("org_id", context.orgId)
        .eq("is_default", true);
    }

    const { data, error } = await adminSupabase
      .from("smtp_providers")
      .insert([{
        org_id: context.orgId,
        name,
        provider_type: providerType || 'custom',
        smtp_host: smtpHost,
        smtp_port: smtpPort || 465,
        smtp_security: smtpSecurity || 'ssl',
        imap_host: imapHost,
        imap_port: imapPort || 993,
        imap_security: imapSecurity || 'ssl',
        is_default: isDefault || false,
      }] as any)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `A provider named "${name}" already exists` }, { status: 409 });
      }
      return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 });
    }

    const adminSupabase = getAdminClient();

    // Unlink any accounts using this provider (they'll keep their inline config)
    await (adminSupabase as any)
      .from("email_accounts")
      .update({ smtp_provider_id: null })
      .eq("smtp_provider_id", id)
      .eq("org_id", context.orgId);

    const { error } = await adminSupabase
      .from("smtp_providers")
      .delete()
      .eq("id", id)
      .eq("org_id", context.orgId);

    if (error) {
      return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
