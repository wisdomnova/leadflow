import { createClient } from '@supabase/supabase-js';


const sb = createClient(
  'https://eqksgmbcyvfllcaeqgbj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa3NnbWJjeXZmbGxjYWVxZ2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTQ2MCwiZXhwIjoyMDg1NDI3NDYwfQ.fwK_E8MU6JkVaJJRYN3WBu0dAQTaXKr2r76MnAxr_aI'
);

const CID = '9d7ae459-72cf-4a5c-8390-4a1242ff3405';
const ORG = '64209895-565d-4974-9d41-3f39d1a1b467';

async function main() {
  // Pick a single unsent recipient
  const { data: recip } = await sb.from('campaign_recipients')
    .select('lead_id')
    .eq('campaign_id', CID)
    .eq('status', 'active')
    .is('last_sent_at', null)
    .is('dispatched_at', null)
    .limit(1)
    .single();
  
  if (!recip) { console.log('No eligible recipients'); return; }
  
  console.log(`Test lead: ${recip.lead_id}`);
  
  // Send a single event via Inngest event API
  const eventKey = 'oGs9ukWkZIZXl9EQx2QY8ZDo5pwyDK78pvVXpCK15kvNAdX6G7qMgI9EtyUVVQN6ZJ4fxmMzjabCGDa3W3vQQQ';
  const res = await fetch('https://inn.gs/e/' + eventKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'campaign/email.send',
      data: {
        campaignId: CID,
        leadId: recip.lead_id,
        stepIdx: 0,
        orgId: ORG,
      },
    }),
  });
  console.log(`Event sent: ${res.status} ${res.statusText}`);
  const body = await res.text();
  console.log('Response:', body);

  // Mark as dispatched
  await sb.from('campaign_recipients')
    .update({ dispatched_at: new Date().toISOString() })
    .eq('campaign_id', CID)
    .eq('lead_id', recip.lead_id);

  // Wait 60 seconds and check if it sent
  console.log('\nWaiting 60 seconds for processing...');
  await new Promise(r => setTimeout(r, 60000));

  const { data: after } = await sb.from('campaign_recipients')
    .select('last_sent_at, dispatched_at, current_step, status')
    .eq('campaign_id', CID)
    .eq('lead_id', recip.lead_id)
    .single();
  console.log('After:', JSON.stringify(after));

  if (after?.last_sent_at) {
    console.log('SUCCESS — email was sent!');
  } else {
    console.log('FAIL — email was NOT sent after 60 seconds');
  }

  // Check server usage
  const { data: servers } = await sb.from('smart_servers')
    .select('name, current_usage, daily_limit')
    .in('id', ['1dac6ece-a3be-401a-840a-34072d90be2c', '7a0741c6-4678-4863-9a1e-26c888e5fae4']);
  console.log('\nServer usage:');
  for (const s of servers || []) console.log(`  ${s.name}: ${s.current_usage}/${s.daily_limit}`);
}

main().catch(console.error);
