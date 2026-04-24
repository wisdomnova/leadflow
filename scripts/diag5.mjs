import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://eqksgmbcyvfllcaeqgbj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa3NnbWJjeXZmbGxjYWVxZ2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTQ2MCwiZXhwIjoyMDg1NDI3NDYwfQ.fwK_E8MU6JkVaJJRYN3WBu0dAQTaXKr2r76MnAxr_aI'
);

const CID = '9d7ae459-72cf-4a5c-8390-4a1242ff3405';

async function main() {
  // 1. Campaign stats
  const { data: camp } = await sb.from('campaigns')
    .select('sent_count, total_leads, status')
    .eq('id', CID).single();
  console.log('=== Campaign ===');
  console.log(`Status: ${camp?.status} | Sent: ${camp?.sent_count}/${camp?.total_leads}`);

  // 2. Recipient breakdown
  const { count: active } = await sb.from('campaign_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', CID).eq('status', 'active');

  const { count: neverSent } = await sb.from('campaign_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', CID).eq('status', 'active').is('last_sent_at', null);

  const { count: neverDispatched } = await sb.from('campaign_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', CID).eq('status', 'active')
    .is('last_sent_at', null).is('dispatched_at', null);

  const { count: dispatchedNotSent } = await sb.from('campaign_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', CID).eq('status', 'active')
    .is('last_sent_at', null).not('dispatched_at', 'is', null);

  console.log(`\n=== Recipients ===`);
  console.log(`Active: ${active}`);
  console.log(`Never sent: ${neverSent}`);
  console.log(`  Never dispatched: ${neverDispatched}`);
  console.log(`  Dispatched but not sent: ${dispatchedNotSent}`);

  // 3. Recent dispatch activity
  const { data: recentDisp } = await sb.from('campaign_recipients')
    .select('dispatched_at')
    .eq('campaign_id', CID)
    .not('dispatched_at', 'is', null)
    .order('dispatched_at', { ascending: false })
    .limit(5);
  console.log('\n=== Most recent dispatches ===');
  for (const r of recentDisp || []) console.log('  ', r.dispatched_at);

  // 4. Recent sends
  const { data: recentSent } = await sb.from('campaign_recipients')
    .select('last_sent_at, lead_id')
    .eq('campaign_id', CID)
    .not('last_sent_at', 'is', null)
    .order('last_sent_at', { ascending: false })
    .limit(5);
  console.log('\n=== Most recent sends ===');
  for (const r of recentSent || []) console.log(`  ${r.last_sent_at}`);

  // 5. Server capacity
  const { data: servers } = await sb.from('smart_servers')
    .select('name, current_usage, daily_limit')
    .in('id', ['1dac6ece-a3be-401a-840a-34072d90be2c', '7a0741c6-4678-4863-9a1e-26c888e5fae4']);
  console.log('\n=== Server capacity ===');
  for (const s of servers || []) {
    console.log(`  ${s.name}: ${s.current_usage}/${s.daily_limit}`);
  }

  // 6. Check how many were dispatched in last 30 min vs last 2 hours
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  
  const { count: last30 } = await sb.from('campaign_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', CID)
    .gte('dispatched_at', thirtyMinAgo);
  
  const { count: last2h } = await sb.from('campaign_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', CID)
    .gte('dispatched_at', twoHoursAgo);

  console.log(`\n=== Dispatch activity ===`);
  console.log(`Last 30 min: ${last30}`);
  console.log(`Last 2 hours: ${last2h}`);

  // 7. Check sweep eligibility with NEW 2-hour window
  const { count: sweepEligible } = await sb.from('campaign_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', CID)
    .eq('status', 'active')
    .is('last_sent_at', null)
    .or(`dispatched_at.is.null,dispatched_at.lt.${twoHoursAgo}`);
  console.log(`\nSweep-eligible (never sent + dispatch > 2hrs ago or null): ${sweepEligible}`);
}

main().catch(console.error);
