import { inngest } from "../services/inngest";
import { getAdminClient } from "../supabase";
import { sendOutreachEmail } from "../services/email-sender";
import { logLeadActivity } from "../activity-utils";
import { syncAccountInbox, syncPowerSendMailbox } from "../services/unibox";
import { createNotification } from "../notifications";
import { calculateOptimalSendTime, getInngestDelay } from "../smart-scheduling";
import { checkSubscription } from "../subscription-check";
import { classifyReply } from "../services/ai";

/**
 * Unibox Sync Engine
 * Periodically syncs all active email accounts to detect replies
 */
export const uniboxSyncScheduler = inngest.createFunction(
  { id: "unibox-sync-scheduler" },
  { cron: "*/15 * * * *" }, // Run every 15 minutes
  async ({ step }) => {
    const supabase = getAdminClient();
    
    // Use admin client to skip RLS for system task
    const { data: accounts } = await supabase
      .from("email_accounts")
      .select("id")
      .eq("status", "active");

    // Also sync PowerSend server mailboxes that have IMAP configured
    const { data: psMailboxes } = await (supabase as any)
      .from("server_mailboxes")
      .select("id")
      .in("status", ["active", "warming"])
      .not("imap_host", "is", null);

    const events: any[] = [];

    if (accounts && accounts.length > 0) {
      for (const acc of accounts as any[]) {
        events.push({ name: "unibox/account.sync", data: { accountId: acc.id } });
      }
    }

    if (psMailboxes && psMailboxes.length > 0) {
      for (const mb of psMailboxes as any[]) {
        events.push({ name: "unibox/powersend.sync", data: { mailboxId: mb.id } });
      }
    }

    if (events.length === 0) return { message: "No accounts to sync" };

    await step.sendEvent("fan-out-sync", events);
    
    return { accounts: accounts?.length || 0, powersendMailboxes: psMailboxes?.length || 0 };
  }
);

export const accountSyncProcessor = inngest.createFunction(
  { id: "account-sync-processor", concurrency: 5 },
  { event: "unibox/account.sync" },
  async ({ event, step }) => {
    const { accountId } = event.data;
    
    await step.run("sync-imap", async () => {
      await syncAccountInbox(accountId);
      return { success: true };
    });
  }
);

export const powersendSyncProcessor = inngest.createFunction(
  { id: "powersend-sync-processor", concurrency: 5 },
  { event: "unibox/powersend.sync" },
  async ({ event, step }) => {
    const { mailboxId } = event.data;
    
    await step.run("sync-powersend-mailbox", async () => {
      await syncPowerSendMailbox(mailboxId);
      return { success: true };
    });
  }
);

/**
 * 1. Campaign Launcher
 * Triggered when a campaign starts. 
 * Finds all leads for the organization and queues them for Step 1.
 */
export const campaignLauncher = inngest.createFunction(
  { id: "campaign-launcher" },
  { event: "campaign/launch" },
  async ({ event, step }) => {
    const { campaignId, orgId, listId } = event.data;
    const supabase = getAdminClient();

    // 1. Get leads for this campaign — read lead_ids from the campaign row (reliable, no event size limits)
    // We split into multiple Inngest steps to avoid step execution timeout on large lead sets
    const campaignData = await step.run("fetch-campaign-data", async () => {
      const { data: campaign } = await (supabase as any)
        .from("campaigns")
        .select("lead_ids, list_id")
        .eq("id", campaignId)
        .single();
      return {
        storedLeadIds: (campaign as any)?.lead_ids || [],
        resolvedListId: (campaign as any)?.list_id || listId,
      };
    });

    const { storedLeadIds, resolvedListId } = campaignData;

    let leads: { id: string; email: string }[] = [];

    if (storedLeadIds.length > 0) {
      // Fetch leads in chunked steps to avoid timeout — each step handles up to 500 IDs
      const STEP_CHUNK = 500;
      const IN_BATCH = 200; // ~200 UUIDs per .in() query is safe for URL length
      for (let chunk = 0; chunk < storedLeadIds.length; chunk += STEP_CHUNK) {
        const chunkIds = storedLeadIds.slice(chunk, chunk + STEP_CHUNK);
        const chunkLeads = await step.run(`fetch-leads-${chunk}`, async () => {
          const results: any[] = [];
          for (let i = 0; i < chunkIds.length; i += IN_BATCH) {
            const batch = chunkIds.slice(i, i + IN_BATCH);
            const { data: batchData, error } = await supabase
              .from("leads")
              .select("id, email")
              .in("id", batch);
            if (error) {
              console.error(`[campaign-launcher] Batch ${chunk + i} fetch error:`, error.message);
              continue;
            }
            if (batchData) results.push(...batchData);
          }
          return results;
        });
        leads.push(...chunkLeads);
      }
    } else if (resolvedListId) {
      leads = await step.run("fetch-leads-from-list", async () => {
        const { data: listLeads } = await (supabase as any)
          .rpc("get_leads_in_list", { p_list_id: resolvedListId });
        return listLeads || [];
      });
    } else {
      leads = await step.run("fetch-leads-fallback", async () => {
        const allLeads: any[] = [];
        let from = 0;
        const PAGE = 1000;
        while (true) {
          const { data, error } = await supabase
            .from("leads")
            .select("id, email")
            .eq("org_id", orgId)
            .eq("status", "new")
            .range(from, from + PAGE - 1);
          if (error) { console.error(`[campaign-launcher] Fallback fetch error:`, error.message); break; }
          if (!data || data.length === 0) break;
          allLeads.push(...data);
          if (data.length < PAGE) break;
          from += PAGE;
        }
        return allLeads;
      });
    }

    if (leads.length === 0) return { message: "No leads found" };

    // 2. Initialize campaign_recipients for each lead (batched for scale)
    // Use INSERT with ON CONFLICT DO NOTHING — never overwrite existing recipients
    // that may already be completed/bounced/replied from a previous run
    const recipients = (leads as any).map((lead: any) => ({
      org_id: orgId,
      campaign_id: campaignId,
      lead_id: lead.id,
      status: 'active',
      current_step: 0,
      next_send_at: new Date().toISOString()
    }));

    await step.run("init-recipients", async () => {
      // Batch upserts in chunks of 200 to prevent payload/timeout issues
      // ignoreDuplicates: true → ON CONFLICT DO NOTHING (preserve existing recipient state)
      const BATCH_SIZE = 200;
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from("campaign_recipients").upsert(batch, {
          onConflict: 'campaign_id,lead_id',
          ignoreDuplicates: true
        });
        if (error) throw new Error(`Failed to initialize recipients batch ${i}: ${error.message}`);
      }
    });

    // 2b. Update total_leads in campaigns table
    await step.run("update-campaign-stats", async () => {
      const { error } = await (supabase as any)
        .from("campaigns")
        .update({ total_leads: leads.length })
        .eq("id", campaignId);
      if (error) throw new Error(`Failed to update campaign stats: ${error.message}`);
    });

    // 3. Kick-start: dispatch the first batch of events via inngest.send()
    //    The campaign sweep cron (every 2 min) will pick up any remaining
    //    unsent recipients automatically — no more 140+step timeouts.
    await step.run("dispatch-initial-batch", async () => {
      const INITIAL_CAP = 500; // Kick-start with first 500
      const toDispatch = leads.slice(0, INITIAL_CAP);
      const EVENT_BATCH = 100;
      for (let i = 0; i < toDispatch.length; i += EVENT_BATCH) {
        const batch = toDispatch.slice(i, i + EVENT_BATCH);
        await inngest.send(
          batch.map((lead: any) => ({
            name: "campaign/email.process" as const,
            data: { campaignId, leadId: lead.id, stepIdx: 0, orgId },
          }))
        );
      }
      return { dispatched: toDispatch.length, total: leads.length };
    });

    // 4. Create Notification
    await step.run("create-launch-notification", async () => {
      await createNotification({
        orgId: orgId,
        title: "Campaign Launched",
        description: `Outreach has started for ${leads.length} leads in your campaign.`,
        type: "info",
        category: "campaign_updates",
        link: "/dashboard/campaigns"
      });
    });

    return { queued: leads.length };
  }
);

/**
 * 2. Email Processor
 * Handles variable replacement, sending via SES, and scheduling follow-ups.
 */
export const emailProcessor = inngest.createFunction(
  { 
    id: "email-processor", 
    concurrency: [{ limit: 20 }],   // 20 concurrent sends — safe with 228 mailboxes across 2 servers
    retries: 8,                      // More retries for transient SMTP errors (421 rate limits)
    throttle: { limit: 200, period: "1m" }, // ~200/min across 228 mailboxes = < 1 send/mailbox/min
  },
  { event: "campaign/email.process" },
  async ({ event, step }) => {
    const { campaignId, leadId, stepIdx, orgId } = event.data;
    const supabase = getAdminClient();

    // 0. Pre-flight checks: campaign must still be running, recipient must be active & unsent
    const preflight = await step.run("preflight-check", async () => {
      const [campRes, recipRes] = await Promise.all([
        supabase.from("campaigns").select("status").eq("id", campaignId).single(),
        supabase.from("campaign_recipients")
          .select("status, last_sent_at, current_step")
          .eq("campaign_id", campaignId)
          .eq("lead_id", leadId)
          .single(),
      ]);

      const campStatus = (campRes.data as any)?.status;
      const recip = recipRes.data as any;

      // Campaign no longer running (paused, completed, archived, deleted)
      if (campStatus !== "running") return { skip: true, reason: `campaign_${campStatus}` };

      // Recipient not active (already completed, bounced, replied, unsubscribed)
      if (!recip || recip.status !== "active") return { skip: true, reason: `recipient_${recip?.status || "missing"}` };

      // Dedup guard: if this is step 0 and the recipient already has a last_sent_at, skip
      // (prevents duplicate sends when sweep + launcher both dispatch the same event)
      if (stepIdx === 0 && recip.last_sent_at) return { skip: true, reason: "already_sent_step0" };

      // For follow-up steps, check current_step to avoid re-sending the same step
      if (stepIdx > 0 && recip.current_step >= stepIdx && recip.last_sent_at) {
        return { skip: true, reason: `already_sent_step${stepIdx}` };
      }

      return { skip: false };
    });

    if (preflight.skip) {
      return { skipped: true, reason: (preflight as any).reason };
    }

    // 1. Fetch Campaign, Lead, and Recipient Data
    const data = await step.run("fetch-details", async () => {
      const [campaignRes, leadRes, recipientRes, orgRes] = await Promise.all([
        supabase.from("campaigns").select("*").eq("id", campaignId).single(),
        supabase.from("leads").select("*").eq("id", leadId).single(),
        supabase.from("campaign_recipients").select("*").eq("campaign_id", campaignId).eq("lead_id", leadId).single(),
        supabase.from("organizations").select("*").eq("id", orgId).single()
      ]);
      if (!orgRes.data) throw new Error("Organization not found");

      // 1b. Plan Volume Check
      const sub = await checkSubscription(orgId);
      if (!sub.active) throw new Error("Subscription inactive. Please upgrade to continue sending.");
      
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      const firstOfMonthStr = firstOfMonth.toISOString().split('T')[0];
      
      const { data: usageData } = await supabase
        .from("analytics_daily")
        .select("sent_count")
        .eq("org_id", orgId)
        .gte("date", firstOfMonthStr);

      const monthlyVolume = (usageData as any[])?.reduce((acc: number, curr: any) => acc + (curr.sent_count || 0), 0) || 0;
      
      const limits = sub.limits || { emails: 10000, ai: 500, powersend: 0 };

      if (monthlyVolume >= limits.emails) {
        // Log a warning activity
        await supabase.from("activity_log").insert([{
          org_id: orgId,
          action_type: "plan_limit_reached",
          description: `Monthly email limit reached (${limits.emails}). Campaign paused.`,
          metadata: { limit: limits.emails, current: monthlyVolume }
        }] as any);

        // Pause campaign automatically
        await (supabase as any).from("campaigns").update({ status: "paused" }).eq("id", campaignId);

        throw new Error(`Monthly email limit reached (${limits.emails}). Please upgrade your plan.`);
      }

      // Check for PowerSend (Smart Server rotation)
      const isPowerSend = (campaignRes.data as any)?.use_powersend;
      let account;
      let powersendNodeId: string | null = null;

      if (isPowerSend) {
        // Build server filter: use campaign's selected servers, fall back to org-wide rotation
        const psConfig = (campaignRes.data as any)?.powersend_config || {};
        const psServerIds: string[] = (campaignRes.data as any)?.powersend_server_ids || [];
        // Support legacy single server_id in powersend_config
        const serverFilter = psServerIds.length > 0 
          ? psServerIds 
          : psConfig.server_id ? [psConfig.server_id] : null;

        // Use PowerSend rotation logic — pick best available node (includes warming nodes)
        const { data: node, error: nodeError } = await (supabase as any)
          .rpc('get_next_powersend_node', { 
            org_id_param: orgId,
            server_ids_param: serverFilter 
          })
          .single();
        
        if (node && !nodeError) {
          powersendNodeId = node.id;


          // Try mailbox pool first (new architecture: 1 server = N mailboxes)
          const { data: mailbox, error: mbError } = await (supabase as any)
            .rpc('get_next_pool_mailbox', { server_id_param: node.id })
            .single();

          if (mailbox && !mbError && mailbox.email) {
            // Mailbox pool path — use the pool mailbox's SMTP config
            // IMPORTANT: RPC returns 'mailbox_id' not 'id' — using wrong key causes
            // all mailboxes to share one cached SMTP transporter → 553 relay errors
            const mbId = mailbox.mailbox_id || mailbox.id;
            account = {
              id: mbId,
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

            // Increment mailbox usage counter
            await (supabase as any).rpc('increment_mailbox_usage', { mailbox_id_param: mbId });
          } else {
            // Legacy fallback — use the node's smtp_config JSONB directly
            const smtpConfig = node.smtp_config || {};
            const senderId = (campaignRes.data as any)?.sender_id;
            let fromEmail = smtpConfig.from_email || 'outreach@' + (node.domain_name || 'mail.example.com');
            let fromName = null;
            
            if (senderId) {
              const { data: senderAccount } = await supabase
                .from("email_accounts")
                .select("email, from_name")
                .eq("id", senderId)
                .single();
              if (senderAccount) {
                fromEmail = (senderAccount as any).email;
                fromName = (senderAccount as any).from_name;
              }
            }

            account = {
              id: node.id,
              email: fromEmail,
              from_name: fromName,
              provider: 'custom_smtp',
              config: {
                smtpHost: smtpConfig.host || (node.provider === 'mailreef' ? 'smtp.mailreef.com' : 'smtp.custom.com'),
                smtpPort: smtpConfig.port || '465',
                smtpUser: smtpConfig.username || node.api_key,
                smtpPass: smtpConfig.password || node.api_key,
              }
            };
          }
        } else if (isPowerSend) {
          // All PowerSend servers are over their daily quota — throw a retryable
          // error so Inngest retries this event later (e.g. after midnight reset).
          // Without this, the processor silently returns "missing account" and the
          // email is never sent.
          throw new Error("All PowerSend servers are at daily capacity. Will retry later.");
        }
      }

      // Fallback to traditional sender accounts if not PowerSend or PowerSend failed
      if (!account) {
        const senderIds: string[] = (campaignRes.data as any)?.sender_ids || [];
        const senderId = (campaignRes.data as any)?.sender_id;

        if (senderIds.length > 1) {
          // Multi-sender rotation: pick account round-robin based on leadId hash
          const leadHash = leadId.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
          const rotationIdx = leadHash % senderIds.length;
          const chosenSenderId = senderIds[rotationIdx];
          const { data: rotatedAccount } = await supabase
            .from("email_accounts")
            .select("*")
            .eq("id", chosenSenderId)
            .single();
          account = rotatedAccount;
        } else if (senderIds.length === 1) {
          const { data: specificAccount } = await supabase
            .from("email_accounts")
            .select("*")
            .eq("id", senderIds[0])
            .single();
          account = specificAccount;
        } else if (senderId) {
          // Legacy single sender_id fallback
          const { data: specificAccount } = await supabase
            .from("email_accounts")
            .select("*")
            .eq("id", senderId)
            .single();
          account = specificAccount;
        } else {
          const { data: firstAccount } = await supabase
            .from("email_accounts")
            .select("*")
            .eq("org_id", orgId)
            .eq("status", "active")
            .limit(1)
            .single();
          account = firstAccount;
        }
      }

      return { 
        campaign: (campaignRes as any).data, 
        lead: (leadRes as any).data,
        recipient: (recipientRes as any).data,
        account,
        org: (orgRes as any).data,
        powersendNodeId
      } as any;
    });

    const powersendNodeId = (data as any).powersendNodeId;

    if (!data.campaign || !data.lead || !data.recipient || !data.account || !data.org) return { error: "Missing campaign, lead, recipient, org or sending account" };
    
    // Stop if recipient is not active (e.g., replied, unsubscribed, paused)
    if (((data as any).recipient as any).status !== 'active') {
      return { message: `Recipient status is ${((data as any).recipient as any).status}, stopping sequence.` };
    }

    const currentStep = ((data as any).campaign as any).steps[stepIdx];
    if (!currentStep) return { message: "No more steps" };

    // 2. Variable Replacement & Tracking Injection
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Dynamic Variable Replacement (HTML-escape values to prevent XSS in emails)
    let processedBody = currentStep.body;
    let subject = currentStep.subject;

    // HTML-escape helper to sanitize user-supplied lead data
    const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // Replace variables case-insensitively using lead data keys
    Object.keys(((data as any).lead as any) || {}).forEach((key: any) => {
      const rawValue = ((data as any).lead as any)[key] || '';
      const safeValue = esc(rawValue);
      const regex = new RegExp(`{{${key}}}`, 'gi');
      processedBody = processedBody.replace(regex, safeValue);
      subject = subject.replace(regex, rawValue); // Subject is plain text, no HTML escaping needed
    });

    // Also replace custom_fields if present
    if (((data as any).lead as any).custom_fields && typeof ((data as any).lead as any).custom_fields === 'object') {
      Object.keys(((data as any).lead as any).custom_fields).forEach((key: any) => {
        const rawValue = ((data as any).lead as any).custom_fields[key] || '';
        const safeValue = esc(rawValue);
        const regex = new RegExp(`{{${key}}}`, 'gi');
        processedBody = processedBody.replace(regex, safeValue);
        subject = subject.replace(regex, rawValue);
      });
    }

    // Provide defaults for common missing fields if they weren't matched
    processedBody = processedBody.replace(/{{first_name}}/gi, 'there').replace(/{{company}}/gi, 'your company');
    subject = subject.replace(/{{first_name}}/gi, 'there').replace(/{{company}}/gi, 'your company');

    // Strip any remaining unmatched variables
    processedBody = processedBody.replace(/{{[^}]+}}/g, '');
    subject = subject.replace(/{{[^}]+}}/g, '');

    // Convert newlines to <br> for HTML email since editor is a textarea
    processedBody = processedBody.replace(/\n/g, '<br />');

    // Click Tracking Logic: First convert bare URLs to <a> tags
    const bareUrlRegex = /(?<!href=["'])(https?:\/\/[^\s<]+)/gi;
    processedBody = processedBody.replace(bareUrlRegex, '<a href="$1">$1</a>');

    // Then replace href="url" with tracking links
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
    processedBody = processedBody.replace(linkRegex, (match: string, quote: string, url: string) => {
      // Don't track if it's already a tracking link or an unsubscribe link (if we handle it separately handle it here)
      if (url.startsWith(baseUrl) || url.startsWith('mailto:')) return match;
      
      const trackingUrl = `${baseUrl}/api/track/click/${((data as any).recipient as any).id}?url=${encodeURIComponent(url)}`;
      return match.replace(url, trackingUrl);
    });

    // Add tracking pixel
    const trackingPixel = `<img src="${baseUrl}/api/track/open/${((data as any).recipient as any).id}" width="1" height="1" style="display:none;" />`;
    const finalBody = processedBody + trackingPixel;

    // 3. Send Email
    const sendResult = await step.run("send-email", async () => {
      try {
        // Pull fromName from account or org settings — never hardcode
        const senderName = (data as any).account?.from_name 
          || (data as any).org?.name 
          || (data as any).account?.email?.split('@')[0] 
          || 'Support';

        const result = await sendOutreachEmail({
          to: ((data as any).lead as any).email,
          subject: subject,
          bodyHtml: finalBody,
          fromName: senderName,
          account: data.account
        });
        return { success: true, messageId: result.messageId };
      } catch (err: any) {
        console.error("Email send failure:", err);

        // Determine if this is a permanent (non-retryable) failure
        // Be VERY conservative: only treat as permanent for clear recipient-level issues.
        // Server-side errors (421 rate limits, 553 relay, connection issues) are transient.
        const msg = (err.message || '').toLowerCase();
        const smtpCode = (msg.match(/\b([45]\d{2})\b/) || [])[1] || '';

        // 4xx SMTP codes are ALWAYS transient (rate limits, temp failures, greylisting)
        const is4xx = smtpCode.startsWith('4');
        
        // 5xx is permanent ONLY for specific recipient-level codes:
        //   550 = mailbox not found, 551 = user not local, 552 = exceeded storage
        //   553 = bad destination mailbox syntax (but also relay rejection — be careful)
        //   554 = transaction failed
        // However, 553 "sender address rejected" is server config, not recipient issue
        const isPermanent = !is4xx && (
          msg.includes('no refresh_token') || 
          msg.includes('bad credentials') ||
          msg.includes('mailbox unavailable') ||
          msg.includes('user unknown') ||
          msg.includes('does not exist') ||
          msg.includes('invalid recipient') ||
          msg.includes('invalid address') ||
          /\b5\.1\.[1-4]\b/.test(msg)  // RFC enhanced status: 5.1.1-5.1.4 = bad recipient
        );

        if (isPermanent) {
          // Return failure result — do NOT throw, to avoid Inngest retry
          // which would re-increment bounce_count on each retry attempt
          return { success: false, permanent: true, error: err.message };
        }
        
        // Transient error: re-throw to trigger Inngest retry
        throw err;
      }
    });

    // Handle permanent send failure (bounce) in a separate step
    if (!sendResult.success && (sendResult as any).permanent) {
      await step.run("handle-bounce", async () => {
        // Log failure (lead_id goes in metadata — activity_log has no lead_id column)
        await (supabase as any).from("activity_log").insert([{
          org_id: orgId,
          action_type: "email_failed",
          description: `Failed to send email to ${((data as any).lead as any).email}: ${(sendResult as any).error}`,
          metadata: { campaign_id: campaignId, lead_id: leadId, error: (sendResult as any).error }
        }] as any);

        // Increment bounce_count exactly once (this step won't retry on success)
        await (supabase as any).rpc('increment_campaign_stat', {
          campaign_id_param: campaignId,
          column_param: 'bounce_count'
        });

        // Mark recipient as bounced
        await (supabase as any).from("campaign_recipients").update({ status: 'bounced' }).eq("campaign_id", campaignId).eq("lead_id", leadId);

        // Check if all recipients are done → auto-complete the campaign
        const { count: activeCount } = await (supabase as any)
          .from("campaign_recipients")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaignId)
          .eq("status", "active");
        
        if (activeCount === 0) {
          // Use a CAS-style update: only complete if still 'running' (prevents duplicate completions)
          const { data: updated } = await (supabase as any)
            .from("campaigns")
            .update({ status: "completed" })
            .eq("id", campaignId)
            .eq("status", "running")
            .select("id")
            .maybeSingle();
          
          // Only log if we actually flipped the status (first one wins)
          if (updated) {
            await (supabase as any).from("activity_log").insert([{
              org_id: orgId,
              action_type: "campaign_completed",
              description: "Campaign has finished sending to all recipients.",
              metadata: { campaign_id: campaignId }
            }]);
          }
        }
      });

      return; // Don't proceed to update-status or schedule next step
    }

    // 4. Update Stats & Schedule Next Step
    await step.run("update-status", async () => {
      // Update recipient record
      await (supabase as any).from("campaign_recipients").update({
        last_sent_at: new Date().toISOString(),
        current_step: stepIdx
      }).eq("campaign_id", campaignId).eq("lead_id", leadId);

      // Increment global campaign sent_count using optimized RPC
      await (supabase as any).rpc('increment_campaign_stat', { 
        campaign_id_param: campaignId, 
        column_param: 'sent_count' 
      });

      // Update AI Usage count if smart sending is active for this campaign
      if (((data as any).campaign as any).config?.smart_sending) {
        await (supabase as any)
          .from('organizations')
          .update({ ai_usage_current: (data.org.ai_usage_current || 0) + 1 })
          .eq('id', orgId);
      }

      // Log activity
      await logLeadActivity({
        supabase,
        leadId,
        orgId,
        type: "email_sent",
        description: `Sent email: ${subject}`,
        metadata: {
          campaign_id: campaignId,
          step_idx: stepIdx,
          subject: subject,
          ...(powersendNodeId ? { powersend_node_id: powersendNodeId } : {})
        }
      });

      // Track PowerSend node usage for rotation fairness
      if (powersendNodeId) {
        await (supabase as any).rpc('increment_server_usage', { server_id_param: powersendNodeId });
      }
    });

    const nextStepIdx = stepIdx + 1;
    const nextStep = ((data as any).campaign as any).steps[nextStepIdx];

    if (nextStep) {
      const isSmartEnabled = ((data as any).campaign as any).config?.smart_sending;
      const sub = await checkSubscription(orgId); // Use local sub check for precision
      
      let delayValue = `${nextStep.wait}d`;

      if (isSmartEnabled && sub.active) {
        // Enforce plan limits: Starter has a limit, Pro/Enterprise are unlimited
        const isWithinLimits = !(sub.usage?.isOver || false);
        
        if (isWithinLimits) {
          const optimalTime = calculateOptimalSendTime(
            (data as any).lead.timezone, 
            nextStep.wait, 
            (data as any).lead.job_title
          );
          delayValue = getInngestDelay(optimalTime);
        }
      }

      // Sleep for the calculated delay BEFORE sending the next event
      await step.sleep("wait-for-next-step", delayValue);

      await step.sendEvent("schedule-next", {
        name: "campaign/email.process",
        data: {
          campaignId,
          leadId,
          stepIdx: nextStepIdx,
          orgId
        }
      });
    } else {
      await step.run("mark-completed", async () => {
        await (supabase as any).from("campaign_recipients").update({ status: 'completed' }).eq("campaign_id", campaignId).eq("lead_id", leadId);
      });

      // Check if all recipients are done (completed/bounced/replied/unsubscribed) → auto-complete the campaign
      await step.run("check-campaign-completion", async () => {
        const { count } = await (supabase as any)
          .from("campaign_recipients")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaignId)
          .eq("status", "active");
        
        if (count === 0) {
          // CAS-style: only complete if still 'running' (prevents duplicate completions from concurrent processors)
          const { data: updated } = await (supabase as any)
            .from("campaigns")
            .update({ status: "completed" })
            .eq("id", campaignId)
            .eq("status", "running")
            .select("id")
            .maybeSingle();
          
          if (updated) {
            await (supabase as any).from("activity_log").insert([{
              org_id: orgId,
              action_type: "campaign_completed",
              description: "Campaign has finished sending to all recipients.",
              metadata: { campaign_id: campaignId }
            }]);
          }
        }
      });
    }

    return { success: true, messageId: (sendResult as any).messageId };
  }
);

/**
 * 3. Log Retention Policy
 * Periodically deletes activity logs older than 90 days
 */
export const activityRetentionTask = inngest.createFunction(
  { id: "activity-retention-cleanup" },
  { cron: "0 0 * * *" }, // Run every night at midnight
  async ({ step }) => {
    const supabase = getAdminClient();
    
    // Reset PowerSend daily usage counters
    await step.run("reset-powersend-usage", async () => {
      await supabase.rpc('reset_daily_server_usage');
    });

    const count = await step.run("delete-old-logs", async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { count, error } = await supabase
        .from("activity_log")
        .delete({ count: 'exact' })
        .lt("created_at", ninetyDaysAgo.toISOString());
        
      if (error) throw error;
      return count || 0;
    });
    
    return { deleted: count };
  }
);

/**
 * 4. Warmup Engine
 * Manages the "Secret Club" sending and reputation building.
 */
export const warmupScheduler = inngest.createFunction(
  { id: "warmup-scheduler" },
  { cron: "0 * * * *" }, // Run every hour
  async ({ step }) => {
    const supabase = getAdminClient();
    
    // Find all accounts that have warmup enabled
    const { data: accounts } = await supabase
      .from("email_accounts")
      .select("id, email, warmup_daily_limit, warmup_status")
      .eq("warmup_enabled", true)
      .eq("warmup_status", "Warming");

    if (!accounts || accounts.length === 0) return { message: "No accounts warming" };

    const events = (accounts as any).map((acc: any) => ({
      name: "warmup/account.process",
      data: { accountId: acc.id }
    }));

    await step.sendEvent("fan-out-warmup", events);
    
    return { count: accounts.length };
  }
);

/**
 * 4b. PowerSend Reputation Monitor
 * Runs every 15 minutes to health-check all active smart server nodes.
 * Calculates reputation from delivery metrics and enforces the Reputation Guard
 * (auto-demoting nodes below 70% to warming, restoring those above 85%).
 */
export const powersendReputationMonitor = inngest.createFunction(
  { id: "powersend-reputation-monitor" },
  { cron: "*/15 * * * *" },
  async ({ step }) => {
    const supabase = getAdminClient();

    // 1. Fetch all active/warming nodes across all orgs
    const servers = await step.run("fetch-active-nodes", async () => {
      const { data, error } = await supabase
        .from("smart_servers")
        .select("id, org_id, name, status, reputation_score")
        .in("status", ["active", "warming"]);
      if (error) throw error;
      return data || [];
    });

    if (servers.length === 0) return { message: "No active nodes to monitor" };

    // 2. Calculate metrics and update reputation for each node
    const results = await step.run("update-reputations", async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const checkResults: any[] = [];

      for (const server of servers as any[]) {
        // Count sends, bounces, complaints for this node in last 24h
        const [sentRes, bounceRes, complaintRes] = await Promise.all([
          supabase.from("activity_log").select("*", { count: "exact", head: true })
            .eq("metadata->>powersend_node_id", server.id)
            .gte("created_at", twentyFourHoursAgo),
          supabase.from("activity_log").select("*", { count: "exact", head: true })
            .eq("metadata->>powersend_node_id", server.id)
            .eq("action_type", "email_bounced")
            .gte("created_at", twentyFourHoursAgo),
          supabase.from("activity_log").select("*", { count: "exact", head: true })
            .eq("metadata->>powersend_node_id", server.id)
            .eq("action_type", "email_complaint")
            .gte("created_at", twentyFourHoursAgo),
        ]);

        const sent = sentRes.count || 0;
        const bounces = bounceRes.count || 0;
        const complaints = complaintRes.count || 0;

        const bounceRate = sent > 0 ? (bounces / sent) * 100 : 0;
        const complaintRate = sent > 0 ? (complaints / sent) * 100 : 0;
        const deliveryRate = sent > 0 ? ((sent - bounces) / sent) * 100 : 100;

        const { data: newScore } = await (supabase as any).rpc("update_server_reputation", {
          server_id_param: server.id,
          new_bounce_rate: parseFloat(bounceRate.toFixed(2)),
          new_complaint_rate: parseFloat(complaintRate.toFixed(2)),
          new_delivery_rate: parseFloat(deliveryRate.toFixed(2)),
          check_source: "system"
        });

        checkResults.push({
          serverId: server.id,
          name: server.name,
          oldScore: server.reputation_score,
          newScore,
          sent, bounces, complaints,
        });
      }

      return checkResults;
    });

    // 3. Enforce the reputation guard (auto-warmup / restore)
    const guardActions = await step.run("enforce-reputation-guard", async () => {
      const { data, error } = await (supabase as any).rpc("enforce_reputation_guard", {
        low_threshold: 70,
        restore_threshold: 85,
      });
      if (error) throw error;
      return data || [];
    });

    // 3b. Safety guard: re-correct any user-initiated warmup nodes wrongly restored
    const warmupCorrections = await step.run("protect-warmup-nodes", async () => {
      // Find nodes where user explicitly enabled warmup but guard restored them to active
      const { data: wronglyRestored } = await supabase
        .from("smart_servers")
        .select("id, warmup_day")
        .eq("warmup_enabled", true)
        .eq("status", "active");

      if (wronglyRestored && wronglyRestored.length > 0) {
        for (const node of wronglyRestored as any[]) {
          // Get the correct warmup daily limit for this node's current day
          const { data: limit } = await (supabase as any).rpc("get_powersend_warmup_limit", {
            server_id_param: node.id,
          });

          await (supabase as any)
            .from("smart_servers")
            .update({
              status: "warming",
              daily_limit: limit || 10,
              updated_at: new Date().toISOString(),
            })
            .eq("id", node.id);
        }
        return { corrected: wronglyRestored.length };
      }
      return { corrected: 0 };
    });

    // 4. Notify orgs if any nodes were demoted
    if (guardActions && (guardActions as any[]).length > 0) {
      await step.run("notify-demotions", async () => {
        for (const action of guardActions as any[]) {
          if (action.action === "demoted") {
            // Look up the org for this server
            const { data: server } = await supabase
              .from("smart_servers")
              .select("org_id, name")
              .eq("id", action.server_id)
              .single();

            if (server) {
              await createNotification({
                orgId: (server as any).org_id,
                title: "Reputation Guard Triggered",
                description: `Node "${(server as any).name}" dropped to ${action.reputation}% reputation and has been moved to Auto-Warmup mode. Daily limit reduced to protect your deliverability.`,
                type: "warning",
                category: "system" as any,
                link: "/dashboard/powersend",
              });
            }
          }
        }
      });
    }

    return {
      checked: results.length,
      guardActions: (guardActions as any[])?.length || 0,
      warmupNodesCorrected: (warmupCorrections as any)?.corrected || 0,
    };
  }
);

/**
 * 4c. PowerSend Warmup Scheduler
 * Runs every hour — finds all nodes in warmup mode and fans out to send
 * warmup emails through their SMTP, spreading sends across the day.
 */
export const powersendWarmupScheduler = inngest.createFunction(
  { id: "powersend-warmup-scheduler" },
  { cron: "0 * * * *" }, // Every hour
  async ({ step }) => {
    const supabase = getAdminClient();

    const servers = await step.run("fetch-warming-nodes", async () => {
      const { data, error } = await supabase
        .from("smart_servers")
        .select("id, name, org_id, daily_limit, warmup_daily_sends, warmup_day")
        .eq("warmup_enabled", true)
        .eq("status", "warming");
      if (error) throw error;
      return data || [];
    });

    if (servers.length === 0) return { message: "No nodes warming up" };

    const events = (servers as any[]).map((s) => ({
      name: "powersend-warmup/node.process",
      data: { serverId: s.id, orgId: s.org_id },
    }));

    await step.sendEvent("fan-out-warmup-sends", events);
    return { count: servers.length };
  }
);

/**
 * 4d. PowerSend Warmup Processor
 * Sends warmup emails through a specific node's SMTP config to build IP rep.
 * Sends to warmup seeds, similar to the email account warmup system.
 */
export const powersendWarmupProcessor = inngest.createFunction(
  { id: "powersend-warmup-processor", concurrency: 3 },
  { event: "powersend-warmup/node.process" },
  async ({ event, step }) => {
    const { serverId, orgId } = event.data;
    const supabase = getAdminClient();

    const data = await step.run("fetch-warmup-context", async () => {
      const { data: server } = await supabase
        .from("smart_servers")
        .select("*")
        .eq("id", serverId)
        .single();
      return server;
    });

    if (!data || !(data as any).warmup_enabled) return { skipped: true };

    const server = data as any;
    const currentHour = new Date().getUTCHours();
    // Spread daily_limit evenly across 24 hours (warmup sends to seeds, not prospects)
    const sendsPerHour = Math.max(1, Math.ceil(server.daily_limit / 24));
    const targetSentByNow = sendsPerHour * (currentHour + 1);
    const remaining = Math.min(targetSentByNow, server.daily_limit) - (server.warmup_daily_sends || 0);

    if (remaining <= 0 || (server.warmup_daily_sends || 0) >= server.daily_limit) {
      return { message: "Quota reached for this hour or day", node: server.name };
    }

    // Send warmup emails — match the hourly target to stay on pace for the daily limit
    const toSend = Math.min(remaining, sendsPerHour);
 
    await step.run("send-warmup-emails", async () => {
      // Fetch pool mailboxes for this server (new architecture)
      const { data: poolMailboxes } = await supabase
        .from("server_mailboxes")
        .select("*")
        .eq("server_id", serverId)
        .in("status", ["active", "warming"])
        .order("last_sent_at", { ascending: true, nullsFirst: true });

      const hasPool = poolMailboxes && poolMailboxes.length > 0;

      for (let i = 0; i < toSend; i++) {
        try {
          // Get random seed
          const { data: seeds } = await (supabase as any).rpc("get_random_seed");
          const seed = Array.isArray(seeds) ? seeds[0]?.email : seeds?.email;
          if (!seed) continue;

          // Get random content
          const [subjectRes, bodyRes] = await Promise.all([
            (supabase as any).rpc("get_random_warmup_content", { req_category: "subject", num_results: 1 }),
            (supabase as any).rpc("get_random_warmup_content", { req_category: "body", num_results: 1 }),
          ]);

          const subject = subjectRes.data?.[0]?.content || "Quick update";
          const body = bodyRes.data?.[0]?.content || "Just checking in — any updates on your end?";

          let syntheticAccount: any;

          if (hasPool) {
            // Rotate through pool mailboxes round-robin
            const mb = poolMailboxes[i % poolMailboxes.length] as any;
            const host = mb.smtp_host || server.default_smtp_host;
            const port = mb.smtp_port || server.default_smtp_port || 465;
            syntheticAccount = {
              id: mb.id,
              email: mb.email,
              provider: "custom_smtp",
              config: {
                smtpHost: host,
                smtpPort: String(port),
                smtpUser: mb.smtp_username || mb.email,
                smtpPass: mb.smtp_password,
              },
            };

            // Increment mailbox usage
            await (supabase as any).rpc("increment_mailbox_usage", { mailbox_id_param: mb.id });
          } else {
            // Legacy fallback — use the node's smtp_config JSONB
            const smtpConfig = server.smtp_config || {};
            syntheticAccount = {
              id: serverId,
              email: smtpConfig.from_email || `warmup@${server.domain_name}`,
              provider: "custom_smtp",
              config: {
                smtpHost: smtpConfig.host,
                smtpPort: String(smtpConfig.port || "465"),
                smtpUser: smtpConfig.username,
                smtpPass: smtpConfig.password,
              },
            };
          }

          await sendOutreachEmail({
            to: seed,
            subject,
            bodyHtml: `<p>${body}</p>`,
            fromName: server.name.split(" ")[0],
            account: syntheticAccount,
          });

          // Track the send
          await (supabase as any).rpc("increment_powersend_warmup_send", {
            server_id_param: serverId,
          });
        } catch (err: any) {
          console.error(`PowerSend warmup send failed for node ${server.name}:`, err);
        }
      }
    });

    return { success: true, node: server.name, sent: toSend };
  }
);

/**
 * 4e. PowerSend Warmup Daily Ramp-Up
 * Runs at midnight to advance warmup day, increase limits, and graduate
 * nodes that have completed the ~28-day warmup schedule.
 */
export const powersendWarmupRampUp = inngest.createFunction(
  { id: "powersend-warmup-rampup" },
  { cron: "0 0 * * *" }, // Midnight
  async ({ step }) => {
    const supabase = getAdminClient();

    // 1. Advance all warming nodes to next day + adjust limits
    const results = await step.run("advance-warmup-schedule", async () => {
      const { data, error } = await (supabase as any).rpc("advance_powersend_warmup");
      if (error) throw error;
      return data || [];
    });

    // 2. Reset daily warmup send counters
    await step.run("reset-warmup-sends", async () => {
      await (supabase as any).rpc("reset_powersend_warmup_sends");
    });

    // 3. Notify on completions
    const completions = (results as any[]).filter((r: any) => r.out_completed);
    if (completions.length > 0) {
      await step.run("notify-completions", async () => {
        for (const c of completions) {
          const { data: server } = await supabase
            .from("smart_servers")
            .select("org_id, name")
            .eq("id", c.out_server_id)
            .single();

          if (server) {
            await createNotification({
              orgId: (server as any).org_id,
              title: "Node Warmup Complete",
              description: `"${(server as any).name}" has completed its ${c.out_new_day}-day IP warmup and is now active at full capacity.`,
              type: "success",
              category: "system" as any,
              link: "/dashboard/powersend",
            });
          }
        }
      });
    }

    return {
      advanced: (results as any[]).length,
      completed: completions.length,
    };
  }
);

/**
 * 5. Warmup Auto-Rampup
 * Runs daily at midnight to increase sending limits for healthy accounts.
 */
export const warmupRampUpScheduler = inngest.createFunction(
  { id: "warmup-rampup-scheduler" },
  { cron: "0 0 * * *" }, // Run at midnight every day
  async ({ step }) => {
    const supabase = getAdminClient();
    
    const results = await step.run("increment-limits", async () => {
      // Logic: If account is 'Warming' and had good health yesterday, increase limit by ramp_up amount
      // We cap at 100 emails/day to be safe across most ESPs (Gmail/Outlook).
      const { data, error } = await supabase.rpc('bulk_ramp_up_warmup');
      if (error) throw error;
      return data;
    });

    return { updated: results };
  }
);

/**
 * 6. Lead Enrichment & Timezone Detection
 * Triggered when leads are created to identify optimal sending windows
 */
export const leadEnrichmentProcessor = inngest.createFunction(
  { id: "lead-enrichment-processor" },
  { event: "lead/created" },
  async ({ event, step }) => {
    const { leadId, orgId } = event.data;
    const supabase = getAdminClient();

    await step.run("enrich-lead-data", async () => {
      const { data: lead } = await (supabase as any).from("leads").select("*").eq("id", leadId).single();
      if (!lead || (lead as any).timezone) return;

      // Production Logic:
      // In a real system, you would call a service like IP-API, Clearbit, or Apollo here.
      // For now, we perform heuristic enrichment based on company domain or provided city.
      
      let inferredTz = "UTC";
      
      if ((lead as any).company?.toLowerCase().includes("tech") || (lead as any).city?.toLowerCase() === "san francisco") {
        inferredTz = "America/Los_Angeles";
      } else if ((lead as any).country === "UK" || (lead as any).city?.toLowerCase() === "london") {
        inferredTz = "Europe/London";
      } else if ((lead as any).city?.toLowerCase() === "new york") {
        inferredTz = "America/New_York";
      } else {
        // Fallback: Default to organization's timezone if available
        const { data: org } = await (supabase as any).from("organizations").select("timezone").eq("id", orgId).single();
        inferredTz = (org as any)?.timezone || "America/New_York";
      }

      await (supabase as any).from("leads").update({ timezone: inferredTz } as any).eq("id", leadId);
    });
  }
);

export const warmupAccountProcessor = inngest.createFunction(
  { id: "warmup-account-processor", concurrency: 2 },
  { event: "warmup/account.process" },
  async ({ event, step }) => {
    const { accountId } = event.data;
    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch Account and Today's Stats
    const data = await step.run("fetch-warmup-context", async () => {
      const { data: account } = await (supabase as any).from("email_accounts").select("*").eq("id", accountId).single();
      const { data: stats } = await (supabase as any).from("warmup_stats").select("*").eq("account_id", accountId).eq("date", today).single();
      
      // If no stats yet for today, create them
      if (!stats && account) {
        const { data: newStats } = await (supabase as any).from("warmup_stats").insert([{
          account_id: accountId,
          org_id: (account as any).org_id,
          date: today,
          sent_count: 0,
          inbox_count: 0
        }] as any).select().single();
        return { account, stats: newStats };
      }

      return { account, stats };
    });

    if (!data.account || !data.stats) return { error: "Missing account or stats context" };

    // 2. Decide if we should send an email this hour
    // Logic: Spread daily_limit over 24 hours. 
    // If we've sent less than (limit / 24 * current_hour), send another.
    const currentHour = new Date().getHours();
    const targetSentByNow = Math.ceil(((data.account as any).warmup_daily_limit / 24) * (currentHour + 1));
    const remainingToTarget = targetSentByNow - ((data.stats as any).sent_count || 0);

    if (remainingToTarget <= 0 || ((data.stats as any).sent_count || 0) >= (data.account as any).warmup_daily_limit) {
      return { message: "Quota reached for this hour or day", stats: data.stats };
    }

    // 3. Perform a Warmup Action
    await step.run("execute-warmup-send", async () => {
      // Fetch a random seed from the database using an optimized RPC
      const { data: seeds, error: seedError } = await (supabase as any).rpc('get_random_seed');

      if (seedError || !seeds || (seeds as any).length === 0) {
        // Fallback to a small list if DB is empty during migration
        const fallbackSeeds = ["seed-alpha@leadflow-warmup.com", "seed-beta@leadflow-warmup.com"];
        const randomSeed = fallbackSeeds[Math.floor(Math.random() * fallbackSeeds.length)];
        
        // If we have an error and it's not just "empty", log it
        if (seedError && (seeds as any)?.length === 0) {
           console.error("Seed selection error:", seedError);
        }
        
        return { seed: randomSeed }; // Still proceed with fallback to avoid breaking warmup
      }

      const randomSeed = Array.isArray(seeds) ? (seeds as any)[0].email : (seeds as any).email;

      // 1. Fetch dynamic content from database
      const [subjectRes, bodyRes] = await Promise.all([
        (supabase as any).rpc('get_random_warmup_content', { req_category: 'subject', num_results: 1 }),
        (supabase as any).rpc('get_random_warmup_content', { req_category: 'body', num_results: 1 })
      ]);

      let subject = subjectRes.data?.[0]?.content || "Quick update";
      let body = bodyRes.data?.[0]?.content || "Just checking in on the progress.";

      try {
        await sendOutreachEmail({
          to: randomSeed,
          subject: subject,
          bodyHtml: `<p>${body}</p>`,
          fromName: (data.account as any).email.split('@')[0],
          account: data.account
        });

        // Update stats
        await (supabase as any).rpc('increment_warmup_stat', { 
            account_id_param: accountId, 
            date_param: today,
            column_param: 'sent_count' 
        });
        
        // Note: We no longer auto-increment inbox_count here. 
        // Real inbox health is now verified by the Unibox Sync Engine in unibox.ts
        // which detects when emails successfully arrive in our seed/user cluster.

      } catch (err: any) {
        console.error("Warmup send failed:", err);
      }
    });

    return { success: true };
  }
);

/**
 * 6. Warmup Reply Engine (Response Loop)
 * Automatically replies to received warmup emails to build conversation threads.
 */
export const warmupReplyProcessor = inngest.createFunction(
  { id: "warmup-reply-processor", concurrency: 3 },
  { event: "warmup/message.received" },
  async ({ event, step }) => {
    const { accountId, senderEmail, subject, messageId } = event.data;
    const supabase = getAdminClient();

    // 1. Human Delay (Wait 10-45 minutes before replying)
    await step.sleep("human-wait", `${Math.floor(Math.random() * 35) + 10}m`);

    // 2. Fetch Account Details
    const account = await step.run("fetch-account", async () => {
      const { data } = await (supabase as any).from("email_accounts").select("*").eq("id", accountId).single();
      return data;
    });

    if (!account) return { error: "Account not found" };

    // 3. Select a Random "Positive Sentiment" Reply
    const replyBody = await step.run("get-reply-content", async () => {
      const { data } = await (supabase as any).rpc('get_random_warmup_content', { 
        req_category: 'reply', 
        num_results: 1 
      });
      return data?.[0]?.content || "Thanks for the update! Glad to see things are moving forward.";
    });

    // 4. Send the Reply
    await step.run("send-reply", async () => {
      await sendOutreachEmail({
        to: senderEmail,
        subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
        bodyHtml: `<p>${replyBody}</p>`,
        fromName: (account as any).email.split('@')[0],
        account: account,
        // In a real system, you'd add In-Reply-To and References headers here
      });

      // Update stats for the sender's account (since they received a reply, their reputation goes up)
      await (supabase as any).rpc('increment_warmup_stat', { 
          account_id_param: accountId, 
          date_param: new Date().toISOString().split('T')[0],
          column_param: 'replies_count' 
      });
    });

    return { success: true };
  }
);

/**
 * ========================================
 * 6. PLAN DOWNGRADE APPLIER
 * ========================================
 * Runs daily at 1:00 AM UTC.
 * Finds organizations with a pending_plan_tier where plan_change_at <= now,
 * applies the downgrade, and clears the pending fields.
 */
export const planDowngradeApplier = inngest.createFunction(
  { id: "plan-downgrade-applier" },
  { cron: "0 1 * * *" }, // Run daily at 1:00 AM UTC
  async ({ step }) => {
    const supabase = getAdminClient();

    const orgsToDowngrade = await step.run("find-pending-downgrades", async () => {
      const { data } = await (supabase as any)
        .from('organizations')
        .select('id, plan_tier, pending_plan_tier, plan_change_at')
        .not('pending_plan_tier', 'is', null)
        .lte('plan_change_at', new Date().toISOString());
      return data || [];
    });

    if (orgsToDowngrade.length === 0) {
      return { applied: 0 };
    }

    let applied = 0;
    for (const org of orgsToDowngrade) {
      await step.run(`apply-downgrade-${org.id}`, async () => {
        await (supabase as any)
          .from('organizations')
          .update({
            plan_tier: org.pending_plan_tier,
            plan: org.pending_plan_tier,
            pending_plan_tier: null,
            plan_change_at: null
          })
          .eq('id', org.id);

        const planName = org.pending_plan_tier.charAt(0).toUpperCase() + org.pending_plan_tier.slice(1);
        await createNotification({
          orgId: org.id,
          title: "Plan Change Applied",
          description: `Your plan has been changed to ${planName}. Your new limits are now in effect.`,
          type: "info",
          category: "billing_alerts",
          link: "/dashboard/billing"
        });
      });
      applied++;
    }

    return { applied };
  }
);

// ─── Reply AI Classification ─────────────────────────────────────────────────
// Triggered when a new inbound reply is stored in unibox_messages.
// Classifies the reply using GPT-4o-mini and updates the lead status.
export const replyClassifier = inngest.createFunction(
  { id: "reply-classifier", concurrency: 10 },
  { event: "unibox/reply.classify" },
  async ({ event, step }) => {
    const { leadId, orgId, snippet, subject, leadName } = event.data;

    const result = await step.run("classify-reply", async () => {
      return classifyReply({
        replyText: snippet || "",
        originalSubject: subject,
        leadName,
      });
    });

    await step.run("update-lead-status", async () => {
      const supabase = getAdminClient();

      // Map classification to sentiment
      const sentimentMap: Record<string, string> = {
        "Interested": "Positive",
        "Closed Won": "Positive",
        "Not Interested": "Negative",
        "Out of Office": "Neutral",
        "Follow-up": "Neutral",
      };

      await (supabase as any).from("leads").update({
        status: result.classification,
        sentiment: sentimentMap[result.classification] || "Neutral",
      }).eq("id", leadId).eq("org_id", orgId);

      // Log the classification activity
      await (supabase as any).from("activity_log").insert([{
        org_id: orgId,
        action_type: "ai.reply_classified",
        description: `AI classified reply as "${result.classification}" (${Math.round(result.confidence * 100)}% confidence)`,
        metadata: {
          lead_id: leadId,
          classification: result.classification,
          confidence: result.confidence,
          reasoning: result.reasoning,
        }
      }] as any);
    });

    return result;
  }
);

// ─── Campaign Sweep (Self-Healing Dispatcher) ────────────────────────────────
// Runs every 2 minutes. Finds running campaigns with unsent recipients and
// dispatches email.process events for them. This is the safety net that makes
// the pipeline bulletproof: even if the launcher times out or events are lost,
// the sweep will pick them up within 2 minutes.
export const campaignSweep = inngest.createFunction(
  { id: "campaign-sweep" },
  { cron: "*/2 * * * *" },
  async ({ step }) => {
    const supabase = getAdminClient();

    // 1. Find all running campaigns
    const campaigns = await step.run("find-running-campaigns", async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, org_id, total_leads, sent_count")
        .eq("status", "running");
      if (error) throw error;
      return data || [];
    });

    if (campaigns.length === 0) return { message: "No running campaigns" };

    let totalDispatched = 0;

    // 2. For each campaign, find unsent recipients and dispatch events
    for (const campaign of campaigns as any[]) {
      const dispatched = await step.run(`sweep-${campaign.id}`, async () => {
        // Fetch active recipients that have never been sent to (the stuck ones)
        // Cap at 500 per sweep to avoid overloading Inngest event queue
        const SWEEP_CAP = 2000;
        const { data: stuck, error } = await supabase
          .from("campaign_recipients")
          .select("lead_id, current_step")
          .eq("campaign_id", campaign.id)
          .eq("status", "active")
          .is("last_sent_at", null)
          .limit(SWEEP_CAP);

        if (error || !stuck || stuck.length === 0) return 0;

        // Dispatch in batches of 100
        const BATCH = 100;
        for (let i = 0; i < stuck.length; i += BATCH) {
          const batch = stuck.slice(i, i + BATCH);
          await inngest.send(
            batch.map((r: any) => ({
              name: "campaign/email.process" as const,
              data: {
                campaignId: campaign.id,
                leadId: r.lead_id,
                stepIdx: r.current_step || 0,
                orgId: campaign.org_id,
              },
            }))
          );
        }

        return stuck.length;
      });

      totalDispatched += dispatched;
    }

    return { campaigns: campaigns.length, dispatched: totalDispatched };
  }
);

// ─── Campaign Health Monitor ─────────────────────────────────────────────────
// Runs every 10 minutes. Detects campaigns that have been "running" for over
// 24 hours with no progress (sent_count unchanged). Auto-pauses truly stuck
// campaigns and notifies the org to prevent silent failures.
export const campaignHealthMonitor = inngest.createFunction(
  { id: "campaign-health-monitor" },
  { cron: "*/10 * * * *" },
  async ({ step }) => {
    const supabase = getAdminClient();

    // Find campaigns running for >24h where all recipients are either done or stuck
    const staleCheck = await step.run("check-stale-campaigns", async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Get all running campaigns started more than 24h ago
      const { data: oldRunning } = await supabase
        .from("campaigns")
        .select("id, org_id, name, total_leads, sent_count, created_at")
        .eq("status", "running")
        .lt("created_at", twentyFourHoursAgo);

      if (!oldRunning || oldRunning.length === 0) return [];

      const stale: any[] = [];
      for (const c of oldRunning as any[]) {
        // Check if there are any active recipients left
        const { count: activeCount } = await supabase
          .from("campaign_recipients")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", c.id)
          .eq("status", "active");

        if (activeCount === 0) {
          // All recipients are done but campaign wasn't marked complete — fix it
          stale.push({ ...c, action: "complete", activeRemaining: 0 });
        }
      }

      return stale;
    });

    // Auto-complete campaigns with 0 active recipients
    for (const campaign of staleCheck as any[]) {
      if (campaign.action === "complete") {
        await step.run(`auto-complete-${campaign.id}`, async () => {
          const { data: updated } = await (supabase as any)
            .from("campaigns")
            .update({ status: "completed" })
            .eq("id", campaign.id)
            .eq("status", "running")
            .select("id")
            .maybeSingle();

          if (updated) {
            await createNotification({
              orgId: campaign.org_id,
              title: "Campaign Completed",
              description: `"${campaign.name}" has been auto-completed (${campaign.sent_count}/${campaign.total_leads} sent).`,
              type: "info",
              category: "campaign_updates",
              link: "/dashboard/campaigns",
            });
          }
        });
      }
    }

    return { checked: staleCheck.length };
  }
);
