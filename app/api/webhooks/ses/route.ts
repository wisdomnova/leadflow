import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // 1. Handle SNS Subscription Confirmation
  if (body.Type === "SubscriptionConfirmation") {
    console.log("SNS Subscription Confirmation URL:", body.SubscribeURL);
    // In prod, you'd auto-fetch this URL
    return NextResponse.json({ status: "ok" });
  }

  // 2. Handle Message Notifications
  if (body.Type === "Notification") {
    const message = JSON.parse(body.Message);
    const eventType = message.notificationType; // Bounce, Complaint, or Delivery
    const mail = message.mail;
    
    // We store the recipient ID in the Message-ID or custom headers if possible,
    // but SES usually gives us the original to-address and messageId.
    const toAddress = mail.destination[0];
    const sesMessageId = mail.messageId;

    const supabase = getAdminClient();

    if (eventType === "Bounce") {
      const bounce = message.bounce;
      const bounceType = bounce.bounceType; // Permanent or Transient

      // Mark lead as bounced and stop campaigns
      const { data: lead } = await (supabase as any)
        .from("leads")
        .update({ status: 'bounced' })
        .eq("email", toAddress)
        .select("id, org_id")
        .single();

      if (lead) {
        // Increment bounce stats for all active campaigns this lead was in
        await (supabase as any)
          .from("campaign_recipients")
          .update({ status: 'bounced' })
          .eq("lead_id", (lead as any).id)
          .eq("status", "active");

        // Log activity
        await (supabase as any).from("activity_log").insert({
          org_id: (lead as any).org_id,
          action_type: "email.bounce",
          description: `Email bounced (${bounceType}): ${toAddress}`,
          metadata: { ses_message_id: sesMessageId, bounce_info: bounce }
        });

        // Create notification
        await createNotification({
          orgId: (lead as any).org_id,
          title: "Email Bounced",
          description: `An email to ${toAddress} bounced (${bounceType}). The lead has been marked as inactive.`,
          type: "warning",
          category: "email_events",
          link: "/dashboard/contacts"
        });
      }
    }

    if (eventType === "Complaint") {
      // Mark as unsubscribed/complained & fetch lead info
      const { data: lead } = await (supabase as any)
        .from("leads")
        .update({ status: 'complained' })
        .eq("email", toAddress)
        .select("id, org_id")
        .single();
        
      if (lead) {
        // Stop campaigns for this lead
        await (supabase as any)
          .from("campaign_recipients")
          .update({ status: 'complained' })
          .eq("lead_id", (lead as any).id)
          .eq("status", "active");

        // Create notification
        await createNotification({
          orgId: lead.org_id,
          title: "Spam Complaint Received",
          description: `${toAddress} marked your email as spam. Outreach to this lead has been paused immediately.`,
          type: "error",
          category: "email_events",
          link: "/dashboard/contacts"
        });

        // Log activity
        await (supabase as any).from("activity_log").insert({
          org_id: (lead as any).org_id,
          action_type: "email.complaint",
          description: `Spam complaint from: ${toAddress}`,
          metadata: { ses_message_id: sesMessageId }
        });
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
