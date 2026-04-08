import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { sendOutreachEmail } from "@/lib/services/email-sender";
import { checkSubscription } from "@/lib/subscription-check";

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await checkSubscription(context.orgId);
  if (!sub.active) {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  try {
    const { leadId, email, subject: inSubject, text } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    // Resolve lead if leadId is a valid UUID (not an email string used as fallback id)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId || '');
    let lead: any = null;

    if (isUUID && leadId) {
      const { data } = await context.supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .eq("org_id", context.orgId)
        .single();
      lead = data;
    }

    // Get sending account: try to find the mailbox that originally contacted this lead
    // (PowerSend uses server_mailboxes, not email_accounts), then fall back to any active account
    let account: any = null;

    if (isUUID && leadId) {
      // Look up the mailbox that synced this lead's conversation
      const { data: inboundMsg } = await (context.supabase as any)
        .from("unibox_messages")
        .select("mailbox_id, account_id")
        .eq("lead_id", leadId)
        .not("mailbox_id", "is", null)
        .order("received_at", { ascending: false })
        .limit(1)
        .single();

      if (inboundMsg?.mailbox_id) {
        // Resolve the server_mailbox SMTP credentials
        const { data: mailbox } = await (context.supabase as any)
          .from("server_mailboxes")
          .select("id, email, display_name, smtp_host, smtp_port, smtp_username, smtp_password, status")
          .eq("id", inboundMsg.mailbox_id)
          .single();

        if (mailbox && mailbox.smtp_host && mailbox.smtp_password) {
          account = {
            id: mailbox.id,
            email: mailbox.email,
            from_name: mailbox.display_name || mailbox.email.split('@')[0],
            provider: 'custom_smtp',
            config: {
              smtpHost: mailbox.smtp_host,
              smtpPort: String(mailbox.smtp_port || '465'),
              smtpUser: mailbox.smtp_username,
              smtpPass: mailbox.smtp_password,
            }
          };
        }
      }

      // Fallback: try email_accounts if a linked account_id exists
      if (!account && inboundMsg?.account_id) {
        const { data: linked } = await context.supabase
          .from("email_accounts")
          .select("*")
          .eq("id", inboundMsg.account_id)
          .eq("status", "active")
          .single();
        account = linked;
      }
    }

    // Final fallback: any active email_account for the org
    if (!account) {
      const { data: fallbackAccount } = await context.supabase
        .from("email_accounts")
        .select("*")
        .eq("org_id", context.orgId)
        .eq("status", "active")
        .limit(1)
        .single();

      // If still nothing, try any active server_mailbox for the org
      if (!fallbackAccount) {
        const { data: fallbackMailbox } = await (context.supabase as any)
          .from("server_mailboxes")
          .select("id, email, display_name, smtp_host, smtp_port, smtp_username, smtp_password")
          .eq("org_id", context.orgId)
          .in("status", ["active", "warming"])
          .limit(1)
          .single();

        if (fallbackMailbox && fallbackMailbox.smtp_host && fallbackMailbox.smtp_password) {
          account = {
            id: fallbackMailbox.id,
            email: fallbackMailbox.email,
            from_name: fallbackMailbox.display_name || fallbackMailbox.email.split('@')[0],
            provider: 'custom_smtp',
            config: {
              smtpHost: fallbackMailbox.smtp_host,
              smtpPort: String(fallbackMailbox.smtp_port || '465'),
              smtpUser: fallbackMailbox.smtp_username,
              smtpPass: fallbackMailbox.smtp_password,
            }
          };
        }
      } else {
        account = fallbackAccount;
      }

      if (!account) {
        return NextResponse.json({ error: "No active email account found" }, { status: 400 });
      }
    }

    // Build subject line — strip existing Re: prefixes to avoid "Re: Re: Re: ..."
    const bareSubject = (inSubject || '').replace(/^(Re:\s*)+/i, '').trim();
    const subject = `Re: ${bareSubject || lead?.company || 'Our conversation'}`;

    // Send the email
    const response = await sendOutreachEmail({
      to: email,
      subject,
      bodyHtml: text.replace(/\n/g, '<br>'),
      account
    });

    if (!response.success) {
      throw new Error("Failed to send email");
    }

    // Store sent message in unibox_messages
    const isMailbox = account.provider === 'custom_smtp' && !account.org_id; // server_mailbox objects lack org_id
    await (context.supabase as any).from("unibox_messages").insert([{
      org_id: context.orgId,
      account_id: isMailbox ? null : account.id,
      mailbox_id: isMailbox ? account.id : null,
      lead_id: isUUID ? leadId : null,
      message_id: response.messageId || `sent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from_email: account.email,
      subject,
      snippet: text.substring(0, 200),
      direction: 'outbound',
      is_read: true,
      received_at: new Date().toISOString()
    }] as any);

    // Update lead last_contacted_at if linked
    if (isUUID && leadId) {
      await context.supabase.from("leads").update({
        last_contacted_at: new Date().toISOString()
      }).eq("id", leadId);
    }

    return NextResponse.json({ success: true, messageId: response.messageId });
  } catch (err: any) {
    console.error("Reply error:", err);
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}
