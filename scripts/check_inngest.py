#!/usr/bin/env python3
"""Check Inngest function registration and event routing."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

signing_key = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
event_key = re.search(r'INNGEST_EVENT_KEY="([^"]+)"', text).group(1)

# 1) Get apps
print("1) APPS:")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/apps',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
print(f"   {r.stdout[:1000]}")

# 2) Try to get functions via each possible API path
print("\n2) FUNCTIONS (various paths):")
for path in ['v1/functions', 'v0/functions']:
    r = subprocess.run(['curl', '-s',
        f'https://api.inngest.com/{path}',
        '-H', f'Authorization: Bearer {signing_key}'
    ], capture_output=True, text=True)
    print(f"   {path}: {r.stdout[:500]}")

# 3) Check the serve endpoint directly  
print("\n3) SERVE ENDPOINT:")
r = subprocess.run(['curl', '-s',
    'https://tryleadflow.ai/api/inngest'
], capture_output=True, text=True)
print(f"   {r.stdout}")

# 4) Check PUT response (sync)
print("\n4) PUT (sync) to serve endpoint:")
r = subprocess.run(['curl', '-s', '-X', 'PUT',
    'https://tryleadflow.ai/api/inngest',
    '-H', 'Content-Type: application/json'
], capture_output=True, text=True)
print(f"   {r.stdout[:500]}")

# 5) More targeted: get events with function_ids
print("\n5) EVENTS with function info:")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/events?name=campaign/email.process&limit=1',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    for e in data.get('data', []):
        print(f"   Full event: {json.dumps(e, indent=2)}")
except:
    print(f"   {r.stdout[:500]}")

# 6) Check if there's an app mismatch
print("\n6) APPS (detailed):")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/apps',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    apps = data.get('data', [])
    for app in apps:
        print(f"   ---")
        print(f"   id: {app.get('id')}")
        print(f"   external_id: {app.get('external_id')}")
        print(f"   name: {app.get('name')}")
        print(f"   url: {app.get('url')}")
        print(f"   connected_at: {app.get('connected_at')}")
        print(f"   last_synced_at: {app.get('last_synced_at')}")
        print(f"   status: {app.get('status')}")
        print(f"   framework: {app.get('framework')}")
        
        # Get functions for this app
        app_id = app.get('id')
        if app_id:
            r2 = subprocess.run(['curl', '-s',
                f'https://api.inngest.com/v1/apps/{app_id}/functions',
                '-H', f'Authorization: Bearer {signing_key}'
            ], capture_output=True, text=True)
            try:
                fns = json.loads(r2.stdout)
                fn_list = fns.get('data', fns) if isinstance(fns, dict) else fns
                if isinstance(fn_list, list):
                    print(f"   functions: {len(fn_list)}")
                    for fn in fn_list[:5]:
                        print(f"     - {fn.get('slug', fn.get('name', fn.get('id', '?')))}")
                else:
                    print(f"   functions: {r2.stdout[:200]}")
            except:
                print(f"   functions: {r2.stdout[:200]}")
except:
    print(f"   {r.stdout[:500]}")

# 7) Check Inngest event types registered
print("\n7) EVENT TYPES:")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/event-types?limit=5',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    for et in data.get('data', [])[:10]:
        print(f"   {et.get('name', 'unknown')}")
except:
    print(f"   {r.stdout[:300]}")
