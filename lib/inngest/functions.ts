import { inngest } from "../services/inngest";
import { getAdminClient } from "../supabase";
import { sendOutreachEmail } from "../services/email-sender";
import { logLeadActivity } from "../activity-utils";
import { syncAccountInbox } from "../services/unibox";
import { createNotification } from "../notifications";
import { calculateOptimalSendTime, getInngestDelay } from "../smart-scheduling";
import { checkSubscription } from "../subscription-check";

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

    if (!accounts || accounts.length === 0) return { message: "No accounts to sync" };

    const events = (accounts as any).map((acc: any) => ({
      name: "unibox/account.sync",
      data: { accountId: acc.id }
    }));

    await step.sendEvent("fan-out-sync", events);
    
    return { count: accounts.length };
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

/**
 * 1. Campaign Launcher
 * Triggered when a campaign starts. 
 * Finds all leads for the organization and queues them for Step 1.
 */
export const campaignLauncher = inngest.createFunction(
  { id: "campaign-launcher" },
  { event: "campaign/launch" },
  async ({ event, step }) => {
    const { campaignId, orgId, leadIds } = event.data;
    const supabase = getAdminClient();

    // 1. Get leads for this campaign
    const leads = await step.run("fetch-leads", async () => {
      // If specific leadIds provided, use them. Otherwise, fetch all 'new' leads (legacy behavior)
      if (leadIds && leadIds.length > 0) {
        // Supabase .in() has a practical limit ~1000 items — batch for safety
        const allLeads: any[] = [];
        const IN_BATCH = 500;
        for (let i = 0; i < leadIds.length; i += IN_BATCH) {
          const batch = leadIds.slice(i, i + IN_BATCH);
          const { data: batchData } = await supabase
            .from("leads")
            .select("id, email")
            .in("id", batch);
          if (batchData) allLeads.push(...batchData);
        }
        return allLeads;
      } else {
        const { data } = await supabase
          .from("leads")
          .select("id, email")
          .eq("org_id", orgId)
          .eq("status", "new");
        return data || [];
      }
    });

    if (leads.length === 0) return { message: "No leads found" };

    // 2. Initialize campaign_recipients for each lead (batched for scale)
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
      const BATCH_SIZE = 200;
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from("campaign_recipients").upsert(batch, { onConflict: 'campaign_id,lead_id' });
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

    // 3. Trigger first email for each lead (batched — Inngest limits events per sendEvent call)
    const allEvents = (leads as any).map((lead: any) => ({
      name: "campaign/email.process",
      data: {
        campaignId,
        leadId: lead.id,
        stepIdx: 0,
        orgId
      }
    }));

    const EVENT_BATCH_SIZE = 100;
    for (let i = 0; i < allEvents.length; i += EVENT_BATCH_SIZE) {
      const batch = allEvents.slice(i, i + EVENT_BATCH_SIZE);
      await step.sendEvent(`queue-batch-${i}`, batch);
    }

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
  { id: "email-processor", concurrency: 10 },
  { event: "campaign/email.process" },
  async ({ event, step }) => {
    const { campaignId, leadId, stepIdx, orgId } = event.data;
    const supabase = getAdminClient();

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
        // Use PowerSend rotation logic — pick best available node
        const { data: node, error: nodeError } = await (supabase as any)
          .rpc('get_next_powersend_node', { org_id_param: orgId })
          .single();
        
        if (node && !nodeError) {
          powersendNodeId = node.id;
          const smtpConfig = node.smtp_config || {};
          
          // Construct a virtual sender account from the node's SMTP config
          // The sender_id email account is still used for the "From" address
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
      }

      // Fallback to traditional sender accounts if not PowerSend or PowerSend failed
      if (!account) {
        const senderId = (campaignRes.data as any)?.sender_id;
        if (senderId) {
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
    
    // Dynamic Variable Replacement
    let processedBody = currentStep.body;
    let subject = currentStep.subject;

    // Replace variables case-insensitively using lead data keys
    Object.keys(((data as any).lead as any) || {}).forEach((key: any) => {
      const value = ((data as any).lead as any)[key] || '';
      const regex = new RegExp(`{{${key}}}`, 'gi');
      processedBody = processedBody.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    // Provide defaults for common missing fields if they weren't matched
    processedBody = processedBody.replace(/{{first_name}}/gi, 'there').replace(/{{company}}/gi, 'your company');
    subject = subject.replace(/{{first_name}}/gi, 'there').replace(/{{company}}/gi, 'your company');

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
        // Log failure to database
        await (supabase as any).from("activity_log").insert([{
          org_id: orgId,
          lead_id: leadId,
          action_type: "email_failed",
          description: `Failed to send email to ${((data as any).lead as any).email}: ${err.message}`,
          metadata: { campaign_id: campaignId, error: err.message }
        }] as any);

        // Increment bounce_count for permanent-looking failures
        const msg = (err.message || '').toLowerCase();
        const isPermanent = msg.includes('invalid') || msg.includes('not found') || msg.includes('rejected') || msg.includes('no refresh_token') || msg.includes('bad credentials');
        if (isPermanent) {
          await (supabase as any).rpc('increment_campaign_stat', {
            campaign_id_param: campaignId,
            column_param: 'bounce_count'
          });
          // Mark recipient as bounced so we don't retry forever
          await (supabase as any).from("campaign_recipients").update({ status: 'bounced' }).eq("campaign_id", campaignId).eq("lead_id", leadId);
        }
        
        // Re-throw to trigger Inngest retry if it's a transient error
        throw err;
      }
    });

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
    }

    return { success: true, messageId: sendResult.messageId };
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
