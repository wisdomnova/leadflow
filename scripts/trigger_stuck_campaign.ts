// One-time script to trigger stuck campaign recipients.
// After deployment, the campaign-sweep cron handles this automatically.
// Usage: npx tsx scripts/trigger_stuck_campaign.ts

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '..', '.env') });

import { createClient } from '@supabase/supabase-js';
import { Inngest } from 'inngest';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const inngest = new Inngest({ id: 'leadflow-app' });

async function main() {
  // 1. Find the Recruite Usa campaign
  console.log('Looking for Recruite Usa campaign...');
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, org_id, name, status, total_leads, sent_count')
    .ilike('name', '%recruite%');

  if (!campaigns?.length) {
    console.log('No campaign found');
    return;
  }

  const campaign = campaigns[0];
  console.log(`Found: ${campaign.name}  id=${campaign.id}  status=${campaign.status}  sent=${campaign.sent_count}/${campaign.total_leads}`);

  const cid = campaign.id;
  const oid = campaign.org_id;

  // 2. Fetch all unsent active recipients in pages
  console.log('Fetching unsent active recipients...');
  const allStuck: any[] = [];
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('campaign_recipients')
      .select('lead_id, current_step')
      .eq('campaign_id', cid)
      .eq('status', 'active')
      .is('last_sent_at', null)
      .range(from, from + PAGE - 1);

    if (error) { console.error('Fetch error:', error.message); break; }
    if (!data?.length) break;
    allStuck.push(...data);
    console.log(`  Fetched ${allStuck.length} so far...`);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`Total unsent recipients: ${allStuck.length}`);
  if (allStuck.length === 0) {
    console.log('Nothing to dispatch.');
    return;
  }

  // 3. Dispatch events in batches of 100
  const BATCH = 100;
  let dispatched = 0;

  for (let i = 0; i < allStuck.length; i += BATCH) {
    const batch = allStuck.slice(i, i + BATCH);
    const events = batch.map((r: any) => ({
      name: 'campaign/email.process' as const,
      data: {
        campaignId: cid,
        leadId: r.lead_id,
        stepIdx: r.current_step || 0,
        orgId: oid,
      },
    }));

    try {
      await inngest.send(events);
      dispatched += batch.length;
      console.log(`  Dispatched ${dispatched}/${allStuck.length}`);
    } catch (err: any) {
      console.error(`  ERROR batch ${i}:`, err.message);
    }

    // Small delay between batches
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone! Dispatched ${dispatched} events.`);
}

main().catch(console.error);
