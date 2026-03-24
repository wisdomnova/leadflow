import { ImapFlow } from 'imapflow';
import { getAdminClient } from '@/lib/supabase';
import { simpleParser } from 'mailparser';
import { createNotification } from '../notifications';
import { inngest } from './inngest';
import { refreshGoogleAccessToken } from './email-sender';

/** Decode HTML entities in Gmail API snippets (server-safe, no DOM) */
function decodeSnippet(text: string): string {
  if (!text) return '';
  const decoded = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Strip the quoted reply thread for a clean preview
  const quoteIdx = decoded.search(/\bOn [\s\S]{5,80}?wrote:/);
  return (quoteIdx > 0 ? decoded.slice(0, quoteIdx).trim() : decoded.trim()) || decoded.trim();
}

// ─── Gmail REST API Inbox Sync ───────────────────────────────────────────────
// Uses gmail.readonly scope (which we already have) instead of IMAP.
// Google IMAP requires the https://mail.google.com/ scope which we don't request.
async function syncGoogleInbox(accountId: string, account: any) {
  const supabase = getAdminClient();
  const config = account.config || {};

  if (!config.refresh_token) {
    console.error(`[Gmail Sync] No refresh_token for account ${accountId}. Skipping.`);
    return;
  }

  // 1. Get a fresh access token
  console.log(`[Gmail Sync] Refreshing token for account ${accountId}...`);
  const { access_token } = await refreshGoogleAccessToken(config.refresh_token);
  console.log(`[Gmail Sync] Token refreshed. Fetching inbox...`);

  // 2. Determine the time window — use last_sync_at or fall back to last 24 hours
  const lastSyncAt = account.last_sync_at;
  const sinceDate = lastSyncAt
    ? new Date(lastSyncAt)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);
  // Gmail uses epoch seconds for after: query
  const afterEpoch = Math.floor(sinceDate.getTime() / 1000);

  // 3. List messages received after our last sync
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox+after:${afterEpoch}&maxResults=50`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const listData = await listRes.json();

  if (!listRes.ok) {
    console.error(`[Gmail Sync] List failed for account ${accountId}`);
    return;
  }

  const messageIds: string[] = (listData.messages || []).map((m: any) => m.id);
  if (messageIds.length === 0) {
    console.log(`[Gmail Sync] No new messages for account ${accountId}`);
    // Still update the sync timestamp
    await (supabase as any).from("email_accounts").update({
      last_sync_at: new Date().toISOString()
    } as any).eq("id", accountId);
    return;
  }

  console.log(`[Gmail Sync] Found ${messageIds.length} messages for account ${accountId}`);

  // 4. Fetch each message and process it
  for (const msgId of messageIds) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Message-ID&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      const msgData = await msgRes.json();
      if (!msgRes.ok) continue;

      // Extract headers
      const headers = (msgData.payload?.headers || []) as { name: string; value: string }[];
      const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const fromRaw = getHeader('From');
      const subject = getHeader('Subject');
      const messageIdHeader = getHeader('Message-ID');
      const dateHeader = getHeader('Date');

      // Parse email address from "Name <email>" format
      const emailMatch = fromRaw.match(/<([^>]+)>/) || [null, fromRaw];
      const fromEmail = (emailMatch[1] || fromRaw).toLowerCase().trim();
      const fromName = fromRaw.replace(/<[^>]+>/, '').replace(/"/g, '').trim();

      // Extract snippet for unibox display
      const snippet = msgData.snippet || '';

      // Skip emails FROM our own account (sent by us) — but only for
      // reply detection. We still store them in unibox for conversation view.
      const isSelfEmail = fromEmail === account.email.toLowerCase();

      // ── Reply Detection ──────────────────────────────────────────────
      // Check campaign recipients that were sent emails (active OR completed).
      // Leads reply AFTER all sequence steps finish, so 'completed' must be included.
      let recipients: any[] | null = null;
      if (!isSelfEmail) {
        const { data } = await supabase
          .from("campaign_recipients")
          .select("id, campaign_id, lead_id, leads!inner(email)")
          .eq("leads.email", fromEmail)
          .in("status", ["active", "completed"]);
        recipients = data;
      }

      if (recipients && recipients.length > 0) {
        for (const recipient of recipients) {
          // Mark as replied
          await (supabase as any).from("campaign_recipients").update({
            status: 'replied',
            replied_at: new Date().toISOString()
          } as any).eq("id", (recipient as any).id);

          // Log activity
          await (supabase as any).from("activity_log").insert([{
            org_id: account.org_id,
            action_type: "email.reply",
            description: `Lead replied: ${fromEmail}`,
            metadata: {
              campaign_id: (recipient as any).campaign_id,
              lead_id: (recipient as any).lead_id,
              subject
            }
          }] as any);

          // Increment campaign reply_count
          await (supabase as any).rpc('increment_campaign_stat', {
            campaign_id_param: (recipient as any).campaign_id,
            column_param: 'reply_count'
          });

          // Update lead state for Unibox
          await (supabase as any).from("leads").update({
            last_message_received_at: dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString(),
            status: 'replied'
          } as any).eq("id", (recipient as any).lead_id);

          // Create Notification
          await createNotification({
            orgId: account.org_id,
            title: "New Reply Received",
            description: `${fromEmail} replied to your campaign. Click to view in Unibox.`,
            type: "success",
            category: "email_events",
            link: "/dashboard/unibox"
          });
        }
      }

      // ── Warmup Detection ─────────────────────────────────────────────
      const { data: isWarmup } = await (supabase as any).rpc('is_warmup_sender', { sender_email: fromEmail });
      if (isWarmup) {
        await inngest.send({
          name: "warmup/message.received",
          data: {
            accountId,
            senderEmail: fromEmail,
            subject,
            bodyText: snippet,
            messageId: messageIdHeader
          }
        });
        await (supabase as any).rpc('increment_warmup_stat', {
          account_id_param: accountId,
          date_param: new Date().toISOString().split('T')[0],
          column_param: 'inbox_count'
        });
      } else if (!recipients || recipients.length === 0) {
        // Update lead last_message_received_at even if not a campaign match
        await (supabase as any).from("leads").update({
          last_message_received_at: dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString()
        } as any).eq("email", fromEmail).eq("org_id", account.org_id);
      }

      // ── Store in unibox_messages (only for campaign leads) ───────────
      // Skip random inbound emails (Supabase alerts, newsletters, etc.)
      // Only store messages from senders that are campaign recipients.
      if (messageIdHeader && !isSelfEmail) {
        const { data: campaignLead } = await (supabase as any)
          .from("campaign_recipients")
          .select("lead_id, leads!inner(id, email)")
          .eq("leads.email", fromEmail)
          .eq("leads.org_id", account.org_id)
          .limit(1)
          .maybeSingle();

        if (campaignLead) {
          await (supabase as any).from("unibox_messages").upsert([{
            account_id: accountId,
            org_id: account.org_id,
            lead_id: (campaignLead as any).lead_id,
            message_id: messageIdHeader,
            from_email: fromEmail,
            subject: subject || "(No Subject)",
            snippet: decodeSnippet(snippet).substring(0, 200),
            received_at: dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString(),
            is_read: false,
            direction: 'inbound',
            sender_name: fromName
          }], { onConflict: 'message_id' }) as any;

          // Trigger AI classification for this reply (non-blocking via Inngest)
          await inngest.send({
            name: "unibox/reply.classify",
            data: {
              leadId: (campaignLead as any).lead_id,
              orgId: account.org_id,
              snippet: decodeSnippet(snippet).substring(0, 500),
              subject: subject || "",
              leadName: fromName || "",
            }
          });
        }
        // else: sender is not a campaign lead — skip storing
      }
    } catch (msgErr) {
      console.error(`[Gmail Sync] Error processing message ${msgId}:`, msgErr);
      continue; // Don't let one bad message stop the sync
    }
  }

  // 5. Update last sync timestamp
  await (supabase as any).from("email_accounts").update({
    last_sync_at: new Date().toISOString()
  } as any).eq("id", accountId);

  console.log(`[Gmail Sync] Completed for ${account.email}. Processed ${messageIds.length} messages.`);
}

// ─── Main Sync Entry Point ───────────────────────────────────────────────────
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

  // Google accounts → Gmail REST API (works with gmail.readonly scope)
  // All others → IMAP (Outlook, custom SMTP, etc.)
  if ((account as any).provider === 'google') {
    await syncGoogleInbox(accountId, account as any);
    return;
  }

  // ─── IMAP Path (Outlook / Custom SMTP) ─────────────────────────────────────
  const config = (account as any).config || {};
  let imapHost = config.imapHost;
  let imapPort = parseInt(config.imapPort || '993');

  if (!imapHost) {
    if ((account as any).provider === 'outlook') {
      imapHost = 'outlook.office365.com';
      imapPort = 993;
    }
  }

  if (!imapHost) {
    throw new Error("IMAP not configured for this account");
  }

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: {
      user: config.imapUser || (account as any).email,
      pass: config.imapPass || config.smtpPass || config.pass,
      accessToken: config.access_token
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
        // 1. Check campaign recipients (active OR completed) from this sender
        const { data: recipients } = await supabase
          .from("campaign_recipients")
          .select("id, campaign_id, lead_id, leads!inner(email)")
          .eq("leads.email", fromEmail)
          .in("status", ["active", "completed"]);

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

          // Trigger AI classification for campaign leads (non-blocking via Inngest)
          if ((lead as any)?.id && recipients && recipients.length > 0) {
            await inngest.send({
              name: "unibox/reply.classify",
              data: {
                leadId: (lead as any).id,
                orgId: (account as any).org_id,
                snippet: (parsed.text || "").substring(0, 500),
                subject: parsed.subject || "",
                leadName: parsed.from?.value[0]?.name || "",
              }
            });
          }
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

// ─── PowerSend Mailbox Sync ──────────────────────────────────────────────────
// Syncs a single PowerSend server_mailbox via IMAP for reply detection + Unibox.
export async function syncPowerSendMailbox(mailboxId: string) {
  const supabase = getAdminClient();
  const { data: mailbox } = await (supabase as any)
    .from("server_mailboxes")
    .select("*, smart_servers(org_id)")
    .eq("id", mailboxId)
    .single();

  if (!mailbox) {
    console.error(`[PowerSend Sync] Mailbox ${mailboxId} not found`);
    return;
  }

  const orgId = mailbox.org_id || mailbox.smart_servers?.org_id;
  if (!orgId) {
    console.error(`[PowerSend Sync] No org_id for mailbox ${mailboxId}`);
    return;
  }

  const imapHost = mailbox.imap_host;
  const imapPort = parseInt(mailbox.imap_port || '993');

  if (!imapHost) {
    console.log(`[PowerSend Sync] No IMAP configured for mailbox ${mailbox.email}. Skipping.`);
    return;
  }

  console.log(`[PowerSend Sync] Connecting to ${imapHost}:${imapPort} for ${mailbox.email}...`);

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: {
      user: mailbox.imap_username || mailbox.email,
      pass: mailbox.imap_password || mailbox.smtp_password,
    },
    logger: false,
    greetingTimeout: 30000,
    connectionTimeout: 30000,
  });

  try {
    await client.connect();
  } catch (err) {
    console.error(`[PowerSend Sync] IMAP connection failed for ${mailbox.email}:`, err);
    return;
  }

  const lastUid = mailbox.last_sync_uid || 0;
  let maxUid = lastUid;

  let lock;
  try {
    lock = await client.getMailboxLock('INBOX');
  } catch (err) {
    console.error(`[PowerSend Sync] IMAP Lock error for ${mailbox.email}:`, err);
    await client.logout();
    return;
  }

  try {
    let fetchRange: string;
    if (lastUid === 0) {
      // First sync — last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const innerLock = await client.getMailboxLock('INBOX');
      try {
        const uids = await client.search({ since: yesterday });
        if (uids && Array.isArray(uids) && uids.length > 0) {
          fetchRange = uids.join(',');
        } else {
          console.log(`[PowerSend Sync] No messages for ${mailbox.email}`);
          return;
        }
      } finally {
        innerLock.release();
      }
    } else {
      fetchRange = `${lastUid + 1}:*`;
    }

    for await (let msg of client.fetch(fetchRange, { envelope: true, source: true }, { uid: true })) {
      if (msg.uid > maxUid) maxUid = msg.uid;
      if (!msg.source) continue;

      const parsed = await simpleParser(msg.source);
      const fromEmail = parsed.from?.value[0]?.address?.toLowerCase();
      if (!fromEmail) continue;

      const isSelfEmail = fromEmail === mailbox.email.toLowerCase();

      // ── Reply Detection ────────────────────────────────────────────────
      if (!isSelfEmail) {
        const { data: recipients } = await supabase
          .from("campaign_recipients")
          .select("id, campaign_id, lead_id, leads!inner(email)")
          .eq("leads.email", fromEmail)
          .in("status", ["active", "completed"]);

        if (recipients && recipients.length > 0) {
          for (const recipient of recipients) {
            await (supabase as any).from("campaign_recipients").update({
              status: 'replied',
              replied_at: new Date().toISOString()
            } as any).eq("id", (recipient as any).id);

            await (supabase as any).from("activity_log").insert([{
              org_id: orgId,
              action_type: "email.reply",
              description: `Lead replied: ${fromEmail}`,
              metadata: {
                campaign_id: (recipient as any).campaign_id,
                lead_id: (recipient as any).lead_id,
                subject: parsed.subject,
                via: 'powersend'
              }
            }] as any);

            await (supabase as any).rpc('increment_campaign_stat', {
              campaign_id_param: (recipient as any).campaign_id,
              column_param: 'reply_count'
            });

            await (supabase as any).from("leads").update({
              last_message_received_at: parsed.date || new Date().toISOString(),
              status: 'replied'
            } as any).eq("id", (recipient as any).lead_id);

            await createNotification({
              orgId,
              title: "New Reply Received",
              description: `${fromEmail} replied (via PowerSend). Click to view in Unibox.`,
              type: "success",
              category: "email_events",
              link: "/dashboard/unibox"
            });
          }
        }

        // Warmup detection
        const { data: isWarmup } = await (supabase as any).rpc('is_warmup_sender', { sender_email: fromEmail });
        if (isWarmup) {
          await inngest.send({
            name: "warmup/message.received",
            data: {
              accountId: mailboxId,
              senderEmail: fromEmail,
              subject: parsed.subject,
              bodyText: parsed.text,
              messageId: (msg.envelope as any)?.messageId
            }
          });
          await (supabase as any).rpc('increment_warmup_stat', {
            account_id_param: mailboxId,
            date_param: new Date().toISOString().split('T')[0],
            column_param: 'inbox_count'
          });
        }
      }

      // ── Store in unibox_messages (campaign leads only) ─────────────────
      if (parsed.messageId && !isSelfEmail) {
        const { data: campaignLead } = await (supabase as any)
          .from("campaign_recipients")
          .select("lead_id, leads!inner(id, email)")
          .eq("leads.email", fromEmail)
          .eq("leads.org_id", orgId)
          .limit(1)
          .maybeSingle();

        if (campaignLead) {
          await (supabase as any).from("unibox_messages").upsert([{
            account_id: mailboxId,
            org_id: orgId,
            lead_id: (campaignLead as any).lead_id,
            message_id: parsed.messageId,
            from_email: fromEmail,
            subject: parsed.subject || "(No Subject)",
            snippet: (parsed.text || "").substring(0, 200),
            received_at: parsed.date || new Date().toISOString(),
            is_read: false,
            direction: 'inbound',
            sender_name: parsed.from?.value[0]?.name || ""
          }], { onConflict: 'message_id' }) as any;

          await inngest.send({
            name: "unibox/reply.classify",
            data: {
              leadId: (campaignLead as any).lead_id,
              orgId,
              snippet: (parsed.text || "").substring(0, 500),
              subject: parsed.subject || "",
              leadName: parsed.from?.value[0]?.name || "",
            }
          });
        }
      }
    }

    // Update last sync UID
    if (maxUid > lastUid) {
      await (supabase as any).from("server_mailboxes").update({ last_sync_uid: maxUid } as any).eq("id", mailboxId);
    }
  } finally {
    lock.release();
    await client.logout();
  }

  console.log(`[PowerSend Sync] Completed for ${mailbox.email}.`);
}
