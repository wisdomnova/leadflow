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
        .select("*, email_accounts!inner(*)")
        .eq("id", leadId)
        .single();
      lead = data;
    }

    // Get sending account: from lead's linked account, or org's first active account
    let account = lead?.email_accounts;
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

    // Build subject line
    const subject = inSubject
      ? `Re: ${inSubject}`
      : `Re: ${lead?.company || 'Our conversation'}`;

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
