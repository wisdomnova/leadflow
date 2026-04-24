#!/usr/bin/env python3
"""Check Inngest endpoint, function execution, activity logs."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
signing_key = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
rpc = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1/rpc'

oid = '64209895-565d-4974-9d41-3f39d1a1b467'
cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'

# 1) Check Inngest serve endpoint
print("1) Inngest serve endpoint check:")
r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
    'https://tryleadflow.ai/api/inngest',
    '-H', 'Accept: application/json'
], capture_output=True, text=True)
print(f"   GET /api/inngest: HTTP {r.stdout}")

# GET on the inngest endpoint returns the function list
r2 = subprocess.run(['curl', '-s',
    'https://tryleadflow.ai/api/inngest',
    '-H', 'Accept: application/json'
], capture_output=True, text=True)
print(f"   Response (first 500): {r2.stdout[:500]}")

# 2) Check activity_log for ANY entries in this org
print("\n2) Activity log entries (any, this org):")
r = subprocess.run(['curl', '-s',
    f'{url}/activity_log?org_id=eq.{oid}&select=id,action_type,description,created_at&order=created_at.desc&limit=5',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, list):
        print(f"   Count: {len(data)}")
        for d in data:
            print(f"   {json.dumps(d)}")
    else:
        print(f"   {r.stdout[:300]}")
except:
    print(f"   {r.stdout[:300]}")

# 3) Check activity_log for ALL orgs (maybe wrong org)
print("\n3) Activity log entries (all orgs, recent):")
r = subprocess.run(['curl', '-s',
    f'{url}/activity_log?select=id,org_id,action_type,description,created_at&order=created_at.desc&limit=10',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, list):
        print(f"   Total: {len(data)}")
        for d in data:
            print(f"   {json.dumps(d)}")
    else:
        print(f"   {r.stdout[:300]}")
except:
    print(f"   {r.stdout[:300]}")

# 4) Inngest API - get functions list  
print("\n4) Inngest API - list functions:")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/functions',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, dict) and 'data' in data:
        fns = data['data']
        print(f"   Total functions: {len(fns)}")
        for fn in fns[:5]:
            print(f"   - {fn.get('slug', fn.get('name', 'unknown'))}: {fn.get('id', 'no-id')}")
        if len(fns) > 5:
            print(f"   ... and {len(fns) - 5} more")
    else:
        print(f"   {r.stdout[:500]}")
except:
    print(f"   {r.stdout[:500]}")

# 5) Inngest API - get runs for email-processor
print("\n5) Inngest API - email-processor runs:")
# Need function ID - try to find it
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/functions',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    fns = data.get('data', [])
    ep_fn = None
    for fn in fns:
        slug = fn.get('slug', '') 
        name = fn.get('name', '')
        if 'email-processor' in slug.lower() or 'email-processor' in name.lower():
            ep_fn = fn
            break
    if ep_fn:
        fn_id = ep_fn.get('id')
        print(f"   Found: {ep_fn.get('slug')} id={fn_id}")
        
        # Get runs
        r2 = subprocess.run(['curl', '-s',
            f'https://api.inngest.com/v1/functions/{fn_id}/runs?limit=5',
            '-H', f'Authorization: Bearer {signing_key}'
        ], capture_output=True, text=True)
        print(f"   Runs: {r2.stdout[:500]}")
    else:
        print(f"   email-processor not found in function list")
        for fn in fns:
            print(f"   Available: {fn.get('slug', fn.get('name', 'n/a'))}")
except Exception as e:
    print(f"   Error: {e}")

# 6) Check notifications table for errors
print("\n6) Notifications (recent):")
r = subprocess.run(['curl', '-s',
    f'{url}/notifications?org_id=eq.{oid}&select=id,title,description,created_at&order=created_at.desc&limit=5',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, list):
        for d in data:
            print(f"   {json.dumps(d)}")
    else:
        print(f"   {r.stdout[:300]}")
except:
    print(f"   {r.stdout[:300]}")
