#!/usr/bin/env python3
"""Quick verification of DB state."""
import re, subprocess, json
with open('/Users/user/leadflow/.env') as f:
    text = f.read()
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'

def api(path):
    r = subprocess.run(['curl', '-s', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
        capture_output=True, text=True)
    return json.loads(r.stdout)

cols = 'name,status,warmup_enabled,warmup_day,daily_limit,current_usage,warmup_daily_sends,warmup_completed_at'
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4','rofsell'),('1dac6ece-a3be-401a-840a-34072d90be2c','Territorial')]:
    d = api(f'smart_servers?id=eq.{sid}&select={cols}')[0]
    ok = 'OK' if d['status']=='warming' and d['warmup_enabled']==True and d['daily_limit']==10 else 'WRONG'
    print(f"  {name}: {ok} | status={d['status']} warmup={d['warmup_enabled']} day={d['warmup_day']} limit={d['daily_limit']} usage={d['current_usage']} warmup_sends={d['warmup_daily_sends']} completed={d['warmup_completed_at']}")

camp = api('campaigns?id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&select=name,status,sent_count')[0]
print(f"  Campaign: {camp['name']} status={camp['status']} sent={camp['sent_count']}")
