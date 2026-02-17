import { ImapFlow } from 'imapflow';
import { getAdminClient } from '@/lib/supabase';
import { simpleParser } from 'mailparser';
import { createNotification } from '../notifications';
import { inngest } from './inngest';
import { refreshGoogleAccessToken } from './email-sender';

export async function syncAccountInbox(accountId: string) {
  const supabase = getAdminClient();
  const { data: account } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (!account) {
    throw new Error("Account not found");
  }

  // Determine IMAP settings based on provider if not explicitly set
  const config = (account as any).config || {};
  let imapHost = config.imapHost;
  let imapPort = parseInt(config.imapPort || '993');

  if (!imapHost) {
    if ((account as any).provider === 'google') {
      imapHost = 'imap.gmail.com';
      imapPort = 993;
    } else if ((account as any).provider === 'outlook') {
      imapHost = 'outlook.office365.com';
      imapPort = 993;
    }
  }

  if (!imapHost) {
    throw new Error("IMAP not configured for this account");
  }

  // For Google accounts, always refresh the access token before connecting.
  // Google OAuth2 access tokens expire after ~1 hour; using a stale token
  // causes silent IMAP auth failures that break reply detection & unibox.
  let accessToken = config.access_token;
  if ((account as any).provider === 'google' && config.refresh_token) {
    try {
      console.log(`[IMAP Sync] Refreshing Google token for ${(account as any).email}...`);
      const { access_token: freshToken } = await refreshGoogleAccessToken(config.refresh_token);
      accessToken = freshToken;
      console.log(`[IMAP Sync] Token refreshed for ${(account as any).email}`);
    } catch (err) {
      console.error(`[IMAP Sync] Token refresh failed for ${(account as any).email}:`, err);
      // Fall back to existing token — it might still be valid
    }
  }

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: {
      user: config.imapUser || (account as any).email,
      pass: config.imapPass || config.smtpPass || config.pass,
      accessToken: accessToken
    },
    logger: false,
    greetingTimeout: 30000,
    connectionTimeout: 30000
  });

  try {
    await client.connect();
  } catch (err) {
    console.error(`IMAP connection failed for account ${accountId}:`, err);
    return; // Exit if connection fails
  }

  const lastUid = (account as any).last_sync_uid || 0;
  let maxUid = lastUid;

  let lock;
  try {
    lock = await client.getMailboxLock('INBOX');
  } catch (err) {
    // If we can't get a lock (e.g. folder doesn't exist or IMAP error), log out and exit gracefully
    console.error(`IMAP Lock error for account ${accountId}:`, err);
    await client.logout();
    return;
  }

  try {
    let fetchRange;
    if (lastUid === 0) {
      // For first sync, just get last 24 hours to avoid timeout
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Select INBOX first to search
      const mailbox = await client.getMailboxLock('INBOX');
      try {
          const uids = await client.search({ since: yesterday });
          if (uids && Array.isArray(uids) && uids.length > 0) {
              fetchRange = uids.join(',');
          } else {
              return; // Nothing to sync
          }
      } finally {
          mailbox.release();
      }
    } else {
      fetchRange = `${lastUid + 1}:*`;
    }
    
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
            await (supabase as any).from("campaign_recipients").update({
              status: 'replied',
              replied_at: new Date().toISOString()
            } as any).eq("id", (recipient as any).id);

            // 3. Log activity
            await (supabase as any).from("activity_log").insert([{
              org_id: (account as any).org_id,
              action_type: "email.reply",
              description: `Lead replied: ${fromEmail}`,
              metadata: {
                campaign_id: (recipient as any).campaign_id,
                lead_id: (recipient as any).lead_id,
                subject: parsed.subject
              }
            }] as any);

            // 4. Increment campaign reply_count
            await (supabase as any).rpc('increment_campaign_stat', { 
              campaign_id_param: (recipient as any).campaign_id, 
              column_param: 'reply_count' 
            });

            // 5. Update lead state for Unibox
            await (supabase as any).from("leads").update({
              last_message_received_at: parsed.date || new Date().toISOString(),
              status: 'replied' // Default to replied, but maybe we could do AI sentiment later
            } as any).eq("id", (recipient as any).lead_id);

            // 6. Create Notification
            await createNotification({
              orgId: (account as any).org_id,
              title: "New Reply Received",
              description: `${fromEmail} replied to your campaign. Click to view in Unibox.`,
              type: "success",
              category: "email_events",
              link: "/dashboard/unibox"
            });
          }
        } 
        
        // 7. NEW: Warmup Detection and Response Loop
        const { data: isWarmup } = await (supabase as any).rpc('is_warmup_sender', { sender_email: fromEmail });
        if (isWarmup) {
          // Trigger a warmup response action
          await inngest.send({
            name: "warmup/message.received",
            data: {
              accountId: accountId,
              senderEmail: fromEmail,
              subject: parsed.subject,
              bodyText: parsed.text,
              messageId: (msg.envelope as any)?.messageId
            }
          });

          // Update warmup health stats: This email arrived in INBOX (reputation booster)
          await (supabase as any).rpc('increment_warmup_stat', { 
              account_id_param: accountId, 
              date_param: new Date().toISOString().split('T')[0],
              column_param: 'inbox_count' 
          });
        }

        else {
            // Even if not a campaign recipient, we might have a lead with this email
            await (supabase as any).from("leads").update({
                last_message_received_at: parsed.date || new Date().toISOString()
            } as any).eq("email", fromEmail).eq("org_id", (account as any).org_id);
        }

        // Store in unibox_messages
        if (parsed.messageId) {
          // Find the lead first to link the message correctly
          const { data: lead } = await (supabase as any)
            .from("leads")
            .select("id")
            .eq("email", fromEmail)
            .eq("org_id", (account as any).org_id)
            .single();

          await (supabase as any).from("unibox_messages").upsert([{
            account_id: accountId,
            org_id: (account as any).org_id,
            lead_id: (lead as any)?.id || null, // Link to lead if exists
            message_id: parsed.messageId,
            from_email: fromEmail,
            subject: parsed.subject || "(No Subject)",
            snippet: parsed.text?.substring(0, 200) || "",
            received_at: parsed.date || new Date().toISOString(),
            is_read: false,
            direction: 'inbound',
            sender_name: parsed.from?.value[0]?.name || ""
          }], { onConflict: 'message_id' }) as any;
        }
      }
    }

    // Update last sync UID once at the end
    if (maxUid > lastUid) {
      await (supabase as any).from("email_accounts").update({ last_sync_uid: maxUid } as any).eq("id", accountId);
    }
  } finally {
    lock.release();
    await client.logout();
  }
}
