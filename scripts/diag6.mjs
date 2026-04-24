import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://eqksgmbcyvfllcaeqgbj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa3NnbWJjeXZmbGxjYWVxZ2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg1MTQ2MCwiZXhwIjoyMDg1NDI3NDYwfQ.fwK_E8MU6JkVaJJRYN3WBu0dAQTaXKr2r76MnAxr_aI'
);

const CID = '9d7ae459-72cf-4a5c-8390-4a1242ff3405';
const ORG = '64209895-565d-4974-9d41-3f39d1a1b467';

async function main() {
  // 1. Check for ANY activity_log entries for this campaign recently
  console.log('=== Recent activity_log for this campaign ===');
  const { data: activities } = await sb.from('activity_log')
    .select('action_type, description, created_at')
    .eq('org_id', ORG)
    .order('created_at', { ascending: false })
    .limit(20);
  for (const a of activities || []) {
    console.log(`  [${a.created_at}] ${a.action_type}: ${a.description?.slice(0, 100)}`);
  }

  // 2. Check subscription state  
  console.log('\n=== Subscription check ===');
  const { data: org } = await sb.from('organizations')
    .select('subscription_status, plan_tier, ai_usage_current')
    .eq('id', ORG).single();
  console.log(JSON.stringify(org));

  // 3. Monthly email volume vs limits
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  const { data: usage } = await sb.from('analytics_daily')
    .select('sent_count, date')
    .eq('org_id', ORG)
    .gte('date', firstOfMonth.toISOString().split('T')[0]);
  const monthlyVolume = (usage || []).reduce((acc, curr) => acc + (curr.sent_count || 0), 0);
  console.log(`Monthly volume: ${monthlyVolume}`);
  console.log('Daily usage:', JSON.stringify(usage));

  // 4. Test the RPCs that emailProcessor uses
  console.log('\n=== Test get_next_powersend_node ===');
  const serverIds = ['1dac6ece-a3be-401a-840a-34072d90be2c', '7a0741c6-4678-4863-9a1e-26c888e5fae4'];
  const { data: node, error: nodeErr } = await sb
    .rpc('get_next_powersend_node', { org_id_param: ORG, server_ids_param: serverIds })
    .single();
  if (nodeErr) console.log('ERROR:', nodeErr.message);
  else console.log(`Node: ${node?.name} (${node?.id?.slice(0,8)}) usage: ${node?.current_usage}/${node?.daily_limit}`);

  if (node) {
    console.log('\n=== Test get_next_pool_mailbox ===');
    const { data: mb, error: mbErr } = await sb
      .rpc('get_next_pool_mailbox', { server_id_param: node.id })
      .single();
    if (mbErr) console.log('ERROR:', mbErr.message);
    else console.log(`Mailbox: ${mb?.email} (smtp: ${mb?.smtp_host}:${mb?.smtp_port})`);

    // 5. Try a real SMTP connection test
    if (mb) {
      console.log('\n=== SMTP connection test ===');
      const nodemailer = await import('nodemailer');
      try {
        const transport = nodemailer.default.createTransport({
          host: mb.smtp_host,
          port: mb.smtp_port || 465,
          secure: (mb.smtp_port || 465) === 465,
          auth: { user: mb.smtp_username, pass: mb.smtp_password },
          connectionTimeout: 10000,
          socketTimeout: 10000,
        });
        const verified = await transport.verify();
        console.log('SMTP verify result:', verified);
        transport.close();
      } catch (err) {
        console.log('SMTP connection FAILED:', err.message);
      }
    }
  }

  // 6. Check increment_campaign_stat RPC exists
  console.log('\n=== Test increment_campaign_stat ===');
  try {
    // Just test the RPC exists (will increment by 0 effectively)
    const { error } = await sb.rpc('increment_campaign_stat', {
      campaign_id_param: CID,
      column_param: 'sent_count'
    });
    if (error) console.log('RPC ERROR:', error.message);
    else console.log('RPC works (note: this incremented sent_count by 1, may need to decrement)');
  } catch (err) {
    console.log('RPC call failed:', err.message);
  }

  // 7. Check for leads with issues for this campaign
  console.log('\n=== Sample lead check ===');
  const { data: sampleRecip } = await sb.from('campaign_recipients')
    .select('lead_id')
    .eq('campaign_id', CID)
    .eq('status', 'active')
    .is('last_sent_at', null)
    .limit(1);
  if (sampleRecip?.[0]) {
    const { data: lead } = await sb.from('leads')
      .select('id, email, first_name, company, org_id')
      .eq('id', sampleRecip[0].lead_id)
      .single();
    console.log('Sample lead:', JSON.stringify(lead));
    if (!lead) console.log('>>> LEAD NOT FOUND — leads may have been deleted!');
  }
}

main().catch(console.error);
