#!/usr/bin/env python3
"""Check function config details."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)

r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/apps/leadflow-app/functions',
    '-H', f'Authorization: Bearer {sk}'], capture_output=True, text=True)

data = json.loads(r.stdout)
fns = data if isinstance(data, list) else data.get('data', [])

for fn in fns:
    name = fn.get('name', '?')
    if 'email-processor' in name or 'campaign-sweep' in name:
        print(f"\n=== {name} ===")
        print(json.dumps(fn, indent=2))
