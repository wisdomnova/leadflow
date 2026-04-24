#!/usr/bin/env python3
"""Quick diagnosis - GET only, no HEAD."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'

def q(path):
    r = subprocess.run(['curl', '-s', '--max-time', '10', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
        capture_output=True, text=True)
    return json.loads(r.stdout) if r.stdout.strip() else []

# Active + never sent
unsent = q(f'campaign_recipients?campaign_id=eq.{cid}&status=eq.active&last_sent_at=is.null&select=id,current_step,dispatched_at&limit=10')
print(f"Active + never sent: {len(unsent)} (showing up to 10)")
for r in unsent[:5]:
    print(f"  id={r['id'][:16]}... step={r['current_step']} dispatched={r.get('dispatched_at','null')}")

# Servers
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4','rofsell'),('1dac6ece-a3be-401a-840a-34072d90be2c','Territorial')]:
    d = q(f'smart_servers?id=eq.{sid}&select=name,status,daily_limit,current_usage,warmup_day,warmup_daily_sends')[0]
    at_limit = d['current_usage'] >= d['daily_limit']
    print(f"{name}: status={d['status']} day={d['warmup_day']} limit={d['daily_limit']} usage={d['current_usage']} warmup={d['warmup_daily_sends']} {'AT LIMIT' if at_limit else ''}")
