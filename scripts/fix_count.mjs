import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://eqksgmbcyvfllcaeqgbj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa3NnbWJjeXZmbGxjYWVxZ2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTQ2MCwiZXhwIjoyMDg1NDI3NDYwfQ.fwK_E8MU6JkVaJJRYN3WBu0dAQTaXKr2r76MnAxr_aI'
);

async function main() {
  // Fix accidental increment
  await sb.from('campaigns')
    .update({ sent_count: 989 })
    .eq('id', '9d7ae459-72cf-4a5c-8390-4a1242ff3405');
  console.log('Reset sent_count to 989');
}

main().catch(console.error);
