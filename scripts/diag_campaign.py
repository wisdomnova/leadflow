import os, json
from supabase import create_client

url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co'
key = ''
with open(os.path.join(os.path.dirname(__file__), '..', '.env')) as f:
    for line in f:
        if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
            key = line.split('=',1)[1].strip()
            break

sb = create_client(url, key)
org = '64209895-565d-4974-9d41-3f39d1a1b467'

# Get campaigns for this org
camps = sb.table('campaigns').select('id, name, status, total_leads, sent_count, bounce_count, config, use_powersend, powersend_server_ids, sender_id, sender_ids, created_at').eq('org_id', org).execute()

for c in camps.data:
    print(f"Campaign: {c['name']}")
    print(f"  ID: {c['id']}")
    print(f"  Status: {c['status']}")
    print(f"  Total leads: {c['total_leads']}")
    print(f"  Sent: {c['sent_count']}")
    print(f"  Bounced: {c['bounce_count']}")
    print(f"  Config: {json.dumps(c.get('config'))}")
    print(f"  use_powersend: {c.get('use_powersend')}")
    print(f"  powersend_server_ids: {c.get('powersend_server_ids')}")
    print(f"  sender_id: {c.get('sender_id')}")
    print(f"  sender_ids: {c.get('sender_ids')}")
    print(f"  Created: {c.get('created_at')}")

    cid = c['id']
    # Check recipients
    total_r = sb.table('campaign_recipients').select('id', count='exact', head=True).eq('campaign_id', cid).execute()
    active_r = sb.table('campaign_recipients').select('id', count='exact', head=True).eq('campaign_id', cid).eq('status', 'active').execute()
    null_sent = sb.table('campaign_recipients').select('id', count='exact', head=True).eq('campaign_id', cid).eq('status', 'active').is_('last_sent_at', 'null').execute()
    
    print(f"  Total recipients: {total_r.count}")
    print(f"  Active recipients: {active_r.count}")
    print(f"  Active + never sent: {null_sent.count}")
    print()

# Check activity_log for recent events
print("=== Recent Activity (last 20) ===")
acts = sb.table('activity_log').select('action_type, description, created_at').eq('org_id', org).order('created_at', desc=True).limit(20).execute()
for a in acts.data:
    print(f"  [{a['created_at']}] {a['action_type']}: {a['description'][:100]}")

# Check PowerSend servers
print("\n=== PowerSend Servers ===")
servers = sb.table('powersend_servers').select('id, name, domain_name, status').eq('org_id', org).execute()
for s in servers.data:
    print(f"  {s['name']} ({s['domain_name']}) - status: {s['status']}")

# Check if get_next_powersend_node RPC works
print("\n=== Test get_next_powersend_node RPC ===")
ps_ids = []
for c in camps.data:
    if c.get('powersend_server_ids'):
        ps_ids = c['powersend_server_ids']
        break
if ps_ids:
    try:
        result = sb.rpc('get_next_powersend_node', {'org_id_param': org, 'server_ids_param': ps_ids}).execute()
        print(f"  Result: {json.dumps(result.data)}")
    except Exception as e:
        print(f"  ERROR: {e}")
else:
    print("  No powersend_server_ids found")
