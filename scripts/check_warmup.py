#!/usr/bin/env python3
"""Check server warmup config and email accounts."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'

for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4', 'rofsell'), ('1dac6ece-a3be-401a-840a-34072d90be2c', 'Territorial')]:
    r = subprocess.run(['curl', '-s',
        f'{url}/smart_servers?id=eq.{sid}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
    ], capture_output=True, text=True)
    data = json.loads(r.stdout)
    if data and isinstance(data, list) and len(data) > 0:
        s = data[0]
        print(f'{name}:')
        for k, v in s.items():
            if k in ['smtp_config']:
                print(f'  {k}: {json.dumps(v)[:100]}')
            else:
                print(f'  {k}: {v}')
        print()

print('Email accounts (for account-sync-processor 100% failure):')
r = subprocess.run(['curl', '-s',
    f'{url}/email_accounts?select=id,email,status,provider,org_id&limit=10',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
data = json.loads(r.stdout)
if isinstance(data, list):
    print(f'  Count: {len(data)}')
    for d in data:
        print(f'  {json.dumps(d)}')
else:
    print(f'  {r.stdout[:200]}')
