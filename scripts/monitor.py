#!/usr/bin/env python3
"""Monitor sends."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'

def q(path):
    r = subprocess.run(['curl', '-s', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
        capture_output=True, text=True)
    return json.loads(r.stdout)

# Activity
logs = q('activity_log?org_id=eq.64209895-565d-4974-9d41-3f39d1a1b467&order=created_at.desc&limit=5&select=action_type,description,created_at')
print("Activity:")
if isinstance(logs, list):
    for l in logs:
        print(f"  {l['action_type']} at {l['created_at'][:19]}: {str(l.get('description',''))[:60]}")
elif isinstance(logs, dict):
    print(f"  {logs.get('message', logs)}")
if not logs:
    print("  (none)")

# Sent recipients
sent = q('campaign_recipients?campaign_id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&last_sent_at=not.is.null&select=id')
print(f"\nRecipients with last_sent_at: {len(sent) if isinstance(sent, list) else sent}")

# Dispatched
disp = q('campaign_recipients?campaign_id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&dispatched_at=not.is.null&select=id')
print(f"Recipients dispatched: {len(disp) if isinstance(disp, list) else disp}")

# Campaign
camp = q('campaigns?id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&select=sent_count')[0]
print(f"Campaign sent_count: {camp['sent_count']}")

# Servers
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4','rofsell'),('1dac6ece-a3be-401a-840a-34072d90be2c','Territorial')]:
    d = q(f'smart_servers?id=eq.{sid}&select=name,current_usage,warmup_daily_sends,daily_limit')[0]
    print(f"  {name}: usage={d['current_usage']}/{d['daily_limit']} warmup_sends={d['warmup_daily_sends']}")
