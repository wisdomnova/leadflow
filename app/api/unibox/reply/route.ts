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

    // Get sending account: try to find the account that originally sent to this lead,
    // otherwise fall back to the org's first active account
    let account: any = null;

    if (isUUID && leadId) {
      // Look up the campaign_recipient to find which account sent the original email
      const { data: recipient } = await context.supabase
        .from("campaign_recipients")
        .select("account_id")
        .eq("lead_id", leadId)
        .not("account_id", "is", null)
        .limit(1)
        .single();

      if (recipient?.account_id) {
        const { data: senderAccount } = await context.supabase
          .from("email_accounts")
          .select("*")
          .eq("id", recipient.account_id)
          .eq("status", "active")
          .single();
        account = senderAccount;
      }
    }

    if (!account) {
      const { data: fallbackAccount } = await context.supabase
        .from("email_accounts")
        .select("*")
        .eq("org_id", context.orgId)
        .eq("status", "active")
        .limit(1)
        .single();

      if (!fallbackAccount) {
        return NextResponse.json({ error: "No active email account found" }, { status: 400 });
      }
      account = fallbackAccount;
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
    await (context.supabase as any).from("unibox_messages").insert([{
      org_id: context.orgId,
      account_id: account.id,
      lead_id: isUUID ? leadId : null,
      message_id: response.messageId || `sent-${Date.now()}`,
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
