#!/usr/bin/env python3
"""Check if deployment has completed: verify email-processor trigger event name."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)

r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/apps/leadflow-app/functions',
    '-H', f'Authorization: Bearer {sk}'], capture_output=True, text=True)

try:
    data = json.loads(r.stdout)
    fns = data if isinstance(data, list) else data.get('data', [])
    
    for fn in fns:
        name = fn.get('name', fn.get('slug', '?'))
        if 'email' in name.lower() or 'sweep' in name.lower():
            triggers = fn.get('triggers', [])
            config = fn.get('config', fn.get('concurrency', '?'))
            print(f"  {name}:")
            print(f"    triggers: {json.dumps(triggers)}")
            print(f"    full keys: {list(fn.keys())}")
            if 'concurrency' in fn:
                print(f"    concurrency: {fn['concurrency']}")
            if 'throttle' in fn:
                print(f"    throttle: {fn['throttle']}")
            if 'retries' in fn:
                print(f"    retries: {fn['retries']}")
except Exception as e:
    print(f"Error: {e}")
    print(f"Raw: {r.stdout[:500]}")
