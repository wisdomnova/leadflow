import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { sendOutreachEmail } from "@/lib/services/email-sender";

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { leadId, text } = await req.json();

    // 1. Get the lead and their campaign/account info
    const { data: lead, error: leadError } = await context.supabase
      .from("leads")
      .select("*, email_accounts!inner(*)")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      // Fallback: if lead not linked to account, find any active account for org
      const { data: fallbackAccount } = await context.supabase
        .from("email_accounts")
        .select("*")
        .eq("org_id", context.orgId)
        .eq("status", "active")
        .limit(1)
        .single();
        
      if (!fallbackAccount) return NextResponse.json({ error: "No active email account found" }, { status: 400 });
      lead.email_accounts = fallbackAccount;
    }

    // 2. Send the email
    const subject = `Re: ${lead.company || 'Our conversation'}`; // Simple logic for now
    const response = await sendOutreachEmail({
      to: lead.email,
      subject: subject,
      bodyHtml: text.replace(/\n/g, '<br>'),
      account: lead.email_accounts
    });

    if (response.success) {
      // 3. Store the sent message in unibox_messages
      await (context.supabase as any).from("unibox_messages").insert([{
        org_id: context.orgId,
        account_id: lead.email_accounts.id,
        lead_id: leadId, // Link to lead
        message_id: response.messageId || `sent-${Date.now()}`,
        from_email: lead.email_accounts.email,
        subject: subject,
        snippet: text.substring(0, 200),
        direction: 'outbound',
        is_read: true,
        received_at: new Date().toISOString()
      }] as any);

      // 4. Update lead last contacted
      await context.supabase.from("leads").update({
        last_contacted_at: new Date().toISOString()
      }).eq("id", leadId);

      return NextResponse.json({ success: true, messageId: response.messageId });
    } else {
      throw new Error("Failed to send email");
    }
  } catch (err: any) {
    console.error("Reply error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
