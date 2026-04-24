import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://eqksgmbcyvfllcaeqgbj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa3NnbWJjeXZmbGxjYWVxZ2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTQ2MCwiZXhwIjoyMDg1NDI3NDYwfQ.fwK_E8MU6JkVaJJRYN3WBu0dAQTaXKr2r76MnAxr_aI'
);

const CID = '9d7ae459-72cf-4a5c-8390-4a1242ff3405';
const ORG = '64209895-565d-4974-9d41-3f39d1a1b467';
const EVENT_KEY = 'oGs9ukWkZIZXl9EQx2QY8ZDo5pwyDK78pvVXpCK15kvNAdX6G7qMgI9EtyUVVQN6ZJ4fxmMzjabCGDa3W3vQQQ';

async function main() {
  // Pick a fresh unsent recipient
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

  // Send event
  const res = await fetch('https://inn.gs/e/' + EVENT_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'campaign/email.send',
      data: { campaignId: CID, leadId: recip.lead_id, stepIdx: 0, orgId: ORG },
    }),
  });
  const body = await res.json();
  const eventId = body.ids?.[0];
  console.log(`Event sent: ${res.status} | ID: ${eventId}`);

  // Mark dispatched
  await sb.from('campaign_recipients')
    .update({ dispatched_at: new Date().toISOString() })
    .eq('campaign_id', CID)
    .eq('lead_id', recip.lead_id);

  // Check run status every 10 seconds
  const SIGNING_KEY = 'signkey-prod-42960326b3b6336d87ebe3db98436b4811d8b67e6bea5503f13b1c24b3563a93';
  
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 10000));
    
    // Check event runs
    const runsRes = await fetch(`https://api.inngest.com/v1/events/${eventId}/runs`, {
      headers: { 'Authorization': `Bearer ${SIGNING_KEY}` },
    });
    const runs = await runsRes.json();
    
    // Check recipient
    const { data: after } = await sb.from('campaign_recipients')
      .select('last_sent_at, status')
      .eq('campaign_id', CID)
      .eq('lead_id', recip.lead_id)
      .single();
    
    const elapsed = (i + 1) * 10;
    console.log(`[${elapsed}s] Runs: ${runs.data?.length || 0} | Sent: ${after?.last_sent_at ? 'YES' : 'no'} | Status: ${after?.status}`);
    
    if (runs.data?.length > 0) {
      console.log('Run details:', JSON.stringify(runs.data[0], null, 2));
    }
    
    if (after?.last_sent_at) {
      console.log('\nSUCCESS — email sent!');
      break;
    }
  }

  // Final server check
  const { data: servers } = await sb.from('smart_servers')
    .select('name, current_usage, daily_limit')
    .in('id', ['1dac6ece-a3be-401a-840a-34072d90be2c', '7a0741c6-4678-4863-9a1e-26c888e5fae4']);
  console.log('\nServer usage:');
  for (const s of servers || []) console.log(`  ${s.name}: ${s.current_usage}/${s.daily_limit}`);
}

main().catch(console.error);
