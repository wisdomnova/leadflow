import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
import crypto from "crypto";

/**
 * Verify that an SNS message is authentic by checking its signature.
 * In production, you should fetch and cache the signing certificate.
 */
async function verifySnsMessage(body: any): Promise<boolean> {
  try {
    // Validate the SigningCertURL is from amazonaws.com
    const certUrl = body.SigningCertURL || body.SigningCertUrl;
    if (!certUrl) return false;
    
    const certUrlParsed = new URL(certUrl);
    if (
      certUrlParsed.protocol !== "https:" ||
      !certUrlParsed.hostname.endsWith(".amazonaws.com")
    ) {
      return false;
    }

    // Fetch the certificate
    const certResponse = await fetch(certUrl);
    if (!certResponse.ok) return false;
    const pem = await certResponse.text();

    // Build the string to sign based on message type
    let stringToSign = "";
    if (body.Type === "Notification") {
      stringToSign = `Message\n${body.Message}\nMessageId\n${body.MessageId}\n`;
      if (body.Subject) {
        stringToSign += `Subject\n${body.Subject}\n`;
      }
      stringToSign += `Timestamp\n${body.Timestamp}\nTopicArn\n${body.TopicArn}\nType\n${body.Type}\n`;
    } else if (body.Type === "SubscriptionConfirmation" || body.Type === "UnsubscribeConfirmation") {
      stringToSign = `Message\n${body.Message}\nMessageId\n${body.MessageId}\nSubscribeURL\n${body.SubscribeURL}\nTimestamp\n${body.Timestamp}\nToken\n${body.Token}\nTopicArn\n${body.TopicArn}\nType\n${body.Type}\n`;
    }

    const verify = crypto.createVerify("SHA1withRSA");
    verify.update(stringToSign);
    return verify.verify(pem, body.Signature, "base64");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Verify SNS message authenticity
  const isValid = await verifySnsMessage(body);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  // 1. Handle SNS Subscription Confirmation
  if (body.Type === "SubscriptionConfirmation") {
    // Auto-confirm the subscription
    try {
      await fetch(body.SubscribeURL);
    } catch { /* best-effort */ }
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

      // Resolve the correct org + lead via campaign_recipients using ses_message_id
      const { data: recipient } = await (supabase as any)
        .from("campaign_recipients")
        .select("id, lead_id, org_id")
        .eq("ses_message_id", sesMessageId)
        .single();

      const resolvedOrgId = recipient?.org_id;
      const resolvedLeadId = recipient?.lead_id;

      // Mark lead as bounced (scoped to org)
      if (resolvedLeadId && resolvedOrgId) {
        await (supabase as any)
          .from("leads")
          .update({ status: 'bounced' })
          .eq("id", resolvedLeadId)
          .eq("org_id", resolvedOrgId);

        // Update campaign recipient status
        await (supabase as any)
          .from("campaign_recipients")
          .update({ status: 'bounced' })
          .eq("lead_id", resolvedLeadId)
          .eq("org_id", resolvedOrgId)
          .eq("status", "active");

        // Log activity
        await (supabase as any).from("activity_log").insert({
          org_id: resolvedOrgId,
          action_type: "email.bounce",
          description: `Email bounced (${bounceType}): ${toAddress}`,
          metadata: { ses_message_id: sesMessageId, bounce_info: bounce }
        });

        // Create notification
        await createNotification({
          orgId: resolvedOrgId,
          title: "Email Bounced",
          description: `An email to ${toAddress} bounced (${bounceType}). The lead has been marked as inactive.`,
          type: "warning",
          category: "email_events",
          link: "/dashboard/contacts"
        });
      } else {
        // Fallback: try to match by email but only if single match to avoid cross-tenant
        const { data: leads } = await (supabase as any)
          .from("leads")
          .select("id, org_id")
          .eq("email", toAddress);

        if (leads && leads.length === 1) {
          const lead = leads[0];
          await (supabase as any)
            .from("leads")
            .update({ status: 'bounced' })
            .eq("id", lead.id)
            .eq("org_id", lead.org_id);
        }
      }
    }

    if (eventType === "Complaint") {
      // Resolve the correct org + lead via campaign_recipients
      const { data: recipient } = await (supabase as any)
        .from("campaign_recipients")
        .select("id, lead_id, org_id")
        .eq("ses_message_id", sesMessageId)
        .single();

      const resolvedOrgId = recipient?.org_id;
      const resolvedLeadId = recipient?.lead_id;

      if (resolvedLeadId && resolvedOrgId) {
        // Mark as unsubscribed/complained
        await (supabase as any)
          .from("leads")
          .update({ status: 'complained' })
          .eq("id", resolvedLeadId)
          .eq("org_id", resolvedOrgId);

        // Stop campaigns for this lead
        await (supabase as any)
          .from("campaign_recipients")
          .update({ status: 'complained' })
          .eq("lead_id", resolvedLeadId)
          .eq("org_id", resolvedOrgId)
          .eq("status", "active");

        // Create notification
        await createNotification({
          orgId: resolvedOrgId,
          title: "Spam Complaint Received",
          description: `${toAddress} marked your email as spam. Outreach to this lead has been paused immediately.`,
          type: "error",
          category: "email_events",
          link: "/dashboard/contacts"
        });

        // Log activity
        await (supabase as any).from("activity_log").insert({
          org_id: resolvedOrgId,
          action_type: "email.complaint",
          description: `Spam complaint from: ${toAddress}`,
          metadata: { ses_message_id: sesMessageId }
        });
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
