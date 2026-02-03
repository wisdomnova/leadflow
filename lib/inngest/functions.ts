import { inngest } from "../services/inngest";
import { getAdminClient } from "../supabase";
import { sendOutreachEmail } from "../services/email-sender";
import { logLeadActivity } from "../activity-utils";
import { syncAccountInbox } from "../services/unibox";
import { createNotification } from "../notifications";

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

    const events = accounts.map(acc => ({
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
        const { data } = await supabase
          .from("leads")
          .select("id, email")
          .in("id", leadIds);
        return data || [];
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

    // 2. Initialize campaign_recipients for each lead
    const recipients = leads.map(lead => ({
      org_id: orgId,
      campaign_id: campaignId,
      lead_id: lead.id,
      status: 'active',
      current_step: 0,
      next_send_at: new Date().toISOString()
    }));

    await step.run("init-recipients", async () => {
      await supabase.from("campaign_recipients").upsert(recipients, { onConflict: 'campaign_id,lead_id' });
    });

    // 2b. Update total_leads in campaigns table
    await step.run("update-campaign-stats", async () => {
      await supabase
        .from("campaigns")
        .update({ total_leads: leads.length })
        .eq("id", campaignId);
    });

    // 3. Trigger first email for each lead
    const events = leads.map(lead => ({
      name: "campaign/email.process",
      data: {
        campaignId,
        leadId: lead.id,
        stepIdx: 0,
        orgId
      }
    }));

    await step.sendEvent("queue-first-steps", events);

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
  { id: "email-processor" },
  { event: "campaign/email.process" },
  async ({ event, step }) => {
    const { campaignId, leadId, stepIdx, orgId } = event.data;
    const supabase = getAdminClient();

    // 1. Fetch Campaign, Lead, and Recipient Data
    const data = await step.run("fetch-details", async () => {
      const [campaignRes, leadRes, recipientRes] = await Promise.all([
        supabase.from("campaigns").select("*").eq("id", campaignId).single(),
        supabase.from("leads").select("*").eq("id", leadId).single(),
        supabase.from("campaign_recipients").select("*").eq("campaign_id", campaignId).eq("lead_id", leadId).single()
      ]);

      // Fetch the sender account (use campaign's sender_id or the first active account)
      const senderId = campaignRes.data?.sender_id;
      let account;

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

      return { 
        campaign: campaignRes.data, 
        lead: leadRes.data,
        recipient: recipientRes.data,
        account
      };
    });

    if (!data.campaign || !data.lead || !data.recipient || !data.account) return { error: "Missing campaign, lead, recipient, or sending account" };
    
    // Stop if recipient is not active (e.g., replied, unsubscribed, paused)
    if (data.recipient.status !== 'active') {
      return { message: `Recipient status is ${data.recipient.status}, stopping sequence.` };
    }

    const currentStep = data.campaign.steps[stepIdx];
    if (!currentStep) return { message: "No more steps" };

    // 2. Variable Replacement & Tracking Injection
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Dynamic Variable Replacement
    let processedBody = currentStep.body;
    let subject = currentStep.subject;

    // Replace variables case-insensitively using lead data keys
    Object.keys(data.lead).forEach(key => {
      const value = data.lead[key] || '';
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
      
      const trackingUrl = `${baseUrl}/api/track/click/${data.recipient.id}?url=${encodeURIComponent(url)}`;
      return match.replace(url, trackingUrl);
    });

    // Add tracking pixel
    const trackingPixel = `<img src="${baseUrl}/api/track/open/${data.recipient.id}" width="1" height="1" style="display:none;" />`;
    const finalBody = processedBody + trackingPixel;

    // 3. Send Email
    const sendResult = await step.run("send-email", async () => {
      try {
        const result = await sendOutreachEmail({
          to: data.lead.email,
          subject: subject,
          bodyHtml: finalBody,
          fromName: "LeadFlow Support", // In prod, pull from organization/sender settings
          account: data.account
        });
        return { success: true, messageId: result.messageId };
      } catch (err: any) {
        console.error("Email send failure:", err);
        // Log failure to database
        await supabase.from("activity_log").insert({
          org_id: orgId,
          lead_id: leadId,
          action_type: "email_failed",
          description: `Failed to send email to ${data.lead.email}: ${err.message}`,
          metadata: { campaign_id: campaignId, error: err.message }
        });
        
        // Re-throw to trigger Inngest retry if it's a transient error
        throw err;
      }
    });

    // 4. Update Stats & Schedule Next Step
    await step.run("update-status", async () => {
      // Update recipient record
      await supabase.from("campaign_recipients").update({
        last_sent_at: new Date().toISOString(),
        current_step: stepIdx
      }).eq("campaign_id", campaignId).eq("lead_id", leadId);

      // Increment global campaign sent_count using optimized RPC
      await supabase.rpc('increment_campaign_stat', { 
        campaign_id_param: campaignId, 
        column_param: 'sent_count' 
      });

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
          subject: subject
        }
      });
    });

    const nextStepIdx = stepIdx + 1;
    const nextStep = data.campaign.steps[nextStepIdx];

    if (nextStep) {
      await step.sendEvent("schedule-next", {
        name: "campaign/email.process",
        data: {
          campaignId,
          leadId,
          stepIdx: nextStepIdx,
          orgId
        },
        // IMPORTANT: Schedule the follow up based on the 'wait' property
        delay: `${nextStep.wait}d` 
      });
    } else {
      await step.run("mark-completed", async () => {
        await supabase.from("campaign_recipients").update({ status: 'completed' }).eq("campaign_id", campaignId).eq("lead_id", leadId);
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
