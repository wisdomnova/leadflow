#!/usr/bin/env python3
"""Check if test event was processed after removing cancellations."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'
lead_id = '097d95ed-56b7-4fff-b969-ca26b8e3a58e'

# Check test recipient
r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&lead_id=eq.{lead_id}',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
rec = json.loads(r.stdout)[0]
print(f'Test recipient:')
print(f'  last_sent_at: {rec["last_sent_at"]}')
print(f'  current_step: {rec["current_step"]}')
print(f'  dispatched_at: {rec["dispatched_at"]}')
print(f'  status: {rec["status"]}')

# Check campaign sent_count
r2 = subprocess.run(['curl', '-s',
    f'{url}/campaigns?id=eq.{cid}&select=sent_count',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
c = json.loads(r2.stdout)[0]
print(f'\nCampaign sent_count: {c["sent_count"]}')

# Check server usage
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4', 'rofsell'), ('1dac6ece-a3be-401a-840a-34072d90be2c', 'Territorial')]:
    r3 = subprocess.run(['curl', '-s',
        f'{url}/smart_servers?id=eq.{sid}&select=current_usage,daily_limit',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
    ], capture_output=True, text=True)
    s = json.loads(r3.stdout)[0]
    print(f'{name}: {s["current_usage"]}/{s["daily_limit"]}')

# Check recent activity
r4 = subprocess.run(['curl', '-s',
    f'{url}/activity_log?select=action_type,description,created_at&order=created_at.desc&limit=5',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
acts = json.loads(r4.stdout)
print(f'\nRecent activity:')
for a in acts:
    print(f'  {a["created_at"]}: {a["action_type"]} - {a["description"][:80]}')

# Count recipients with last_sent_at not null
r5 = subprocess.run(['curl', '-s', '-I',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&last_sent_at=not.is.null&select=id',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Prefer: count=exact'
], capture_output=True, text=True)
for line in r5.stdout.split('\n'):
    if 'content-range' in line.lower():
        print(f'\nRecipients with last_sent_at: {line.strip().split("/")[-1]}')
