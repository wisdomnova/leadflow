import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: account, error: fetchError } = await context.supabase
      .from("email_accounts")
      .select("*")
      .eq("id", id)
      .eq("org_id", context.orgId)
      .single();

    if (fetchError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const config = account.config;
    let smtpSuccess = false;
    let imapSuccess = false;
    let errorMsg = "";

    // Test connectivity based on provider
    if (account.provider === 'google' || account.provider === 'outlook') {
      if (config.access_token && config.refresh_token) {
        smtpSuccess = true;
        imapSuccess = true;
      } else {
        errorMsg = "OAuth tokens missing. Please reconnect your account.";
      }
    } else if (account.provider === 'aws_ses') {
      smtpSuccess = true;
      imapSuccess = true; // SES is send-only, mark IMAP as success
    } else if (account.provider === 'custom_smtp') {
      // 1. Test SMTP
      try {
        const transporter = nodemailer.createTransport({
          host: config.smtpHost,
          port: parseInt(config.smtpPort),
          secure: config.smtpPort === '465',
          auth: {
            user: config.smtpUser || account.email,
            pass: config.smtpPass,
          },
          connectionTimeout: 10000,
        });
        await transporter.verify();
        smtpSuccess = true;
      } catch (err: any) {
        errorMsg += `SMTP: ${err.message}. `;
      }

      // 2. Test IMAP
      try {
        if (config.imapHost) {
          const client = new ImapFlow({
            host: config.imapHost,
            port: parseInt(config.imapPort),
            secure: config.imapPort === '993',
            auth: {
              user: config.imapUser || account.email,
              pass: config.imapPass,
            },
            logger: false,
          });
          await client.connect();
          await client.logout();
          imapSuccess = true;
        } else {
          imapSuccess = true; // Skip if no IMAP host provided
        }
      } catch (err: any) {
        errorMsg += `IMAP: ${err.message}. `;
      }
    }

    const overallSuccess = smtpSuccess && imapSuccess;

    // 3. Update Status
    await context.supabase
      .from("email_accounts")
      .update({ 
        status: overallSuccess ? 'active' : 'error',
        last_sync_at: new Date().toISOString()
      })
      .eq("id", id);

    return NextResponse.json({
      success: overallSuccess,
      smtp: smtpSuccess,
      imap: imapSuccess,
      error: errorMsg || null
    });

  } catch (err) {
    console.error("Account test error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
