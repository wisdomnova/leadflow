import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://eqksgmbcyvfllcaeqgbj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa3NnbWJjeXZmbGxjYWVxZ2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTQ2MCwiZXhwIjoyMDg1NDI3NDYwfQ.fwK_E8MU6JkVaJJRYN3WBu0dAQTaXKr2r76MnAxr_aI'
);

const CID = '9d7ae459-72cf-4a5c-8390-4a1242ff3405';

async function main() {
  // Reset dispatched_at on ALL unsent recipients so sweep can re-dispatch with fresh events
  const { error, count } = await sb.from('campaign_recipients')
    .update({ dispatched_at: null })
    .eq('campaign_id', CID)
    .eq('status', 'active')
    .is('last_sent_at', null)
    .not('dispatched_at', 'is', null)
    .select('id', { count: 'exact' });

  if (error) {
    console.error('Error:', error.message);
    return;
  }
  console.log(`Reset dispatched_at for ${count} dispatched-but-unsent recipients`);

  // Verify
  const { count: ready } = await sb.from('campaign_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', CID)
    .eq('status', 'active')
    .is('last_sent_at', null)
    .is('dispatched_at', null);
  console.log(`Total ready for fresh sweep dispatch: ${ready}`);
}

main().catch(console.error);
