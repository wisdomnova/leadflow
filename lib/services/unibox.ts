import { ImapFlow } from 'imapflow';
import { getAdminClient } from '@/lib/supabase';
import { simpleParser } from 'mailparser';
import { createNotification } from '../notifications';

export async function syncAccountInbox(accountId: string) {
  const supabase = getAdminClient();
  const { data: account } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (!account || !account.imap_host) {
    throw new Error("IMAP not configured for this account");
  }

  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port || 993,
    secure: true,
    auth: {
      user: account.email,
      pass: account.app_password,
      accessToken: account.access_token // Support for OAuth tokens
    },
    logger: false
  });

  await client.connect();
  let lock = await client.getMailboxLock('INBOX');

  try {
    const lastUid = account.last_sync_uid || 0;
    let maxUid = lastUid;
    
    // Fetch only messages with UID greater than last known UID
    const fetchRange = `${lastUid + 1}:*`;
    
    for await (let msg of client.fetch(fetchRange, { envelope: true, source: true }, { uid: true })) {
      if (msg.uid > maxUid) maxUid = msg.uid;
      
      if (!msg.source) continue;
      const parsed = await simpleParser(msg.source);
      const fromEmail = parsed.from?.value[0]?.address?.toLowerCase();
      
      if (fromEmail) {
        // 1. Check for ANY active campaign recipients from this sender
        const { data: recipients } = await supabase
          .from("campaign_recipients")
          .select("id, campaign_id, lead_id, leads!inner(email)")
          .eq("leads.email", fromEmail)
          .eq("status", "active");

        if (recipients && recipients.length > 0) {
          for (const recipient of recipients) {
            // 2. Mark as replied
            await supabase.from("campaign_recipients").update({
              status: 'replied',
              replied_at: new Date().toISOString()
            }).eq("id", recipient.id);

            // 3. Log activity
            await supabase.from("activity_log").insert({
              org_id: account.org_id,
              action_type: "email.reply",
              description: `Lead replied: ${fromEmail}`,
              metadata: {
                campaign_id: recipient.campaign_id,
                lead_id: recipient.lead_id,
                subject: parsed.subject
              }
            });

            // 4. Increment campaign reply_count
            await supabase.rpc('increment_campaign_stat', { 
              campaign_id_param: recipient.campaign_id, 
              column_param: 'reply_count' 
            });

            // 5. Update lead state for Unibox
            await supabase.from("leads").update({
              last_message_received_at: parsed.date || new Date().toISOString(),
              status: 'replied' // Default to replied, but maybe we could do AI sentiment later
            }).eq("id", recipient.lead_id);

            // 6. Create Notification
            await createNotification({
              orgId: account.org_id,
              title: "New Reply Received",
              description: `${fromEmail} replied to your campaign. Click to view in Unibox.`,
              type: "success",
              category: "email_events",
              link: "/dashboard/unibox"
            });
          }
        } else {
            // Even if not a campaign recipient, we might have a lead with this email
            await supabase.from("leads").update({
                last_message_received_at: parsed.date || new Date().toISOString()
            }).eq("email", fromEmail).eq("org_id", account.org_id);
        }

        // Store in unibox_messages
        if (parsed.messageId) {
          await supabase.from("unibox_messages").upsert({
            account_id: accountId,
            org_id: account.org_id,
            message_id: parsed.messageId,
            from_email: fromEmail,
            subject: parsed.subject || "(No Subject)",
            snippet: parsed.text?.substring(0, 200) || "",
            received_at: parsed.date || new Date().toISOString(),
            is_read: false,
            direction: 'inbound',
            sender_name: parsed.from?.value[0]?.name || ""
          }, { onConflict: 'message_id' });
        }
      }
    }

    // Update last sync UID once at the end
    if (maxUid > lastUid) {
      await supabase.from("email_accounts").update({ last_sync_uid: maxUid }).eq("id", accountId);
    }
  } finally {
    lock.release();
    await client.logout();
  }
}
