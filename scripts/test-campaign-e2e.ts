/**
 * End-to-End Campaign Test Script
 * 
 * Tests the full flow: Create leads → Create campaign → Launch → Inngest picks up → Email sent
 * Uses PowerSend (Smart Server) as the sending method.
 * 
 * Run: npx tsx scripts/test-campaign-e2e.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env manually
const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx);
  let value = trimmed.slice(idx + 1);
  // Strip surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = value;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tryleadflow.ai';
const JWT_SECRET = process.env.JWT_SECRET!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Test config
const TEST_USER_ID = '1aa80319-7d69-40dc-ad23-4332fb1f9dbb';
const TEST_ORG_ID = '323203b7-9c2a-43b4-9dfd-9ca56e27e88e';
const TEST_SERVER_ID = 'd40f15af-8100-4dfe-8246-1adabd6a6634';
const TEST_EMAILS = ['wisdomdivine3d@gmail.com', 'sparktechnologies2021@gmail.com'];

// Track created records for cleanup
const createdLeadIds: string[] = [];
let createdCampaignId: string | null = null;

async function createJWT(): Promise<string> {
  const { SignJWT } = await import('jose');
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT({
    userId: TEST_USER_ID,
    orgId: TEST_ORG_ID,
    email: 'sparktechnologies2021@gmail.com',
    role: 'authenticated',
    app_role: 'admin',
    org_id: TEST_ORG_ID,
    type: 'session',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('leadflow')
    .setAudience('leadflow-app')
    .setExpirationTime('1h')
    .sign(secret);
}

async function step(name: string, fn: () => Promise<any>): Promise<any> {
  process.stdout.write(`\n⏳ ${name}...`);
  try {
    const result = await fn();
    console.log(` ✅`);
    return result;
  } catch (err: any) {
    console.log(` ❌ ${err.message}`);
    throw err;
  }
}

async function createTestLeads() {
  const leads = TEST_EMAILS.map(email => ({
    email,
    first_name: email.includes('wisdom') ? 'Wisdom' : 'Spark',
    last_name: 'Test',
    company: 'E2E Test Corp',
    org_id: TEST_ORG_ID,
    source: 'e2e_test',
    tags: ['e2e-test'],
  }));

  const { data, error } = await supabase
    .from('leads')
    .upsert(leads, { onConflict: 'email,org_id' })
    .select('id, email');

  if (error) throw new Error(`Failed to create leads: ${error.message}`);
  
  for (const lead of data || []) {
    createdLeadIds.push(lead.id);
    console.log(`    Lead: ${lead.email} (${lead.id})`);
  }
  
  return data;
}

async function createAndLaunchCampaign(leadIds: string[], token: string) {
  const campaignPayload = {
    name: 'E2E Test Campaign - DELETE ME',
    sender_id: null,
    sender_ids: [],
    lead_ids: leadIds,
    steps: [
      {
        id: 1,
        type: 'Initial Email',
        wait: 0,
        subject: 'E2E Test — {{first_name}}, this is a test email',
        body: 'Hi {{first_name}},\n\nThis is an automated end-to-end test of the LeadFlow campaign engine.\n\nPowered by PowerSend Smart Server infrastructure.\n\nPlease ignore this email — it will be cleaned up shortly.\n\nBest,\nLeadFlow E2E Test'
      }
    ],
    status: 'running',
    use_powersend: true,
    powersend_server_ids: [TEST_SERVER_ID],
    config: {
      smart_sending: false
    }
  };

  const res = await fetch(`${APP_URL}/api/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session_token=${token}`,
    },
    body: JSON.stringify(campaignPayload),
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(`Campaign creation failed (${res.status}): ${JSON.stringify(data)}`);
  }

  createdCampaignId = data.campaign?.id || data.id;
  console.log(`    Campaign ID: ${createdCampaignId}`);
  console.log(`    Status: ${data.campaign?.status || data.status}`);
  return data;
}

async function monitorCampaign(campaignId: string, maxWaitSecs = 120) {
  const startTime = Date.now();
  let lastSentCount = 0;

  while ((Date.now() - startTime) / 1000 < maxWaitSecs) {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('status, sent_count, open_count, reply_count, bounce_count, total_leads')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      console.log('    Campaign not found!');
      break;
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`    [${elapsed}s] Status: ${campaign.status} | Sent: ${campaign.sent_count}/${campaign.total_leads} | Bounced: ${campaign.bounce_count}`);

    if (campaign.sent_count >= TEST_EMAILS.length) {
      console.log('    🎉 All emails sent!');
      return campaign;
    }

    if (campaign.sent_count > lastSentCount) {
      lastSentCount = campaign.sent_count;
    }

    // Check activity log for errors
    const { data: activities } = await supabase
      .from('activity_log')
      .select('action_type, description, created_at')
      .eq('org_id', TEST_ORG_ID)
      .in('action_type', ['email_sent', 'email_failed', 'campaign_started'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (activities && activities.length > 0) {
      const recent = activities.filter(a => 
        new Date(a.created_at).getTime() > startTime
      );
      for (const act of recent) {
        console.log(`    📋 ${act.action_type}: ${act.description}`);
      }
    }

    // Wait 10 seconds before checking again
    await new Promise(r => setTimeout(r, 10000));
  }

  console.log('    ⏰ Monitoring timed out');
  
  // Check for any errors in the campaign recipients
  const { data: recipients } = await supabase
    .from('campaign_recipients')
    .select('lead_id, status, current_step, last_sent_at')
    .eq('campaign_id', campaignId);

  console.log('\n    📊 Recipient statuses:');
  for (const r of recipients || []) {
    console.log(`      Lead ${r.lead_id}: status=${r.status}, step=${r.current_step}, lastSent=${r.last_sent_at}`);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test records...');
  
  if (createdCampaignId) {
    // Delete campaign recipients first
    await supabase.from('campaign_recipients').delete().eq('campaign_id', createdCampaignId);
    console.log('    Deleted campaign recipients');
    
    // Delete the campaign
    await supabase.from('campaigns').delete().eq('id', createdCampaignId);
    console.log(`    Deleted campaign: ${createdCampaignId}`);
  }

  // Delete activity log entries from test
  await supabase.from('activity_log')
    .delete()
    .eq('org_id', TEST_ORG_ID)
    .in('action_type', ['email_sent', 'email_failed', 'campaign_started', 'campaign_created'])
    .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
  console.log('    Deleted recent activity log entries');

  // Delete test leads
  if (createdLeadIds.length > 0) {
    await supabase.from('leads').delete().in('id', createdLeadIds);
    console.log(`    Deleted ${createdLeadIds.length} test leads`);
  }

  // Reset server usage counter
  await supabase.from('smart_servers')
    .update({ current_usage: 0 })
    .eq('id', TEST_SERVER_ID);
  console.log('    Reset server usage counter');

  console.log('✅ Cleanup complete');
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  LeadFlow E2E Campaign Test');
  console.log('═══════════════════════════════════════════');
  console.log(`  App URL: ${APP_URL}`);
  console.log(`  Org ID: ${TEST_ORG_ID}`);
  console.log(`  PowerSend Server: ${TEST_SERVER_ID}`);
  console.log(`  Test Emails: ${TEST_EMAILS.join(', ')}`);

  try {
    // 1. Generate auth token
    const token = await step('Generating auth token', createJWT);

    // 2. Create test leads
    const leads = await step('Creating test leads', createTestLeads);
    const leadIds = leads.map((l: any) => l.id);

    // 3. Create and launch campaign
    await step('Creating campaign (PowerSend enabled)', () => createAndLaunchCampaign(leadIds, token));

    // 4. Monitor execution
    if (createdCampaignId) {
      console.log('\n📡 Monitoring campaign execution (waiting for Inngest)...');
      await monitorCampaign(createdCampaignId, 120);
    }

  } catch (err: any) {
    console.error('\n💥 Test failed:', err.message);
  }

  // 5. Cleanup
  const shouldCleanup = process.argv.includes('--no-cleanup') ? false : true;
  if (shouldCleanup) {
    await cleanup();
  } else {
    console.log('\n⚠️  Skipping cleanup (--no-cleanup flag). Run cleanup manually later.');
    console.log(`    Campaign ID: ${createdCampaignId}`);
    console.log(`    Lead IDs: ${createdLeadIds.join(', ')}`);
  }
}

main().catch(console.error);
