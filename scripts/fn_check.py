#!/usr/bin/env python3
"""Check Inngest function details and old campaign."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'

# 1. Check what campaigns exist
print("=== ALL CAMPAIGNS ===")
r = subprocess.run(['curl', '-s',
    f'{url}/campaigns?select=id,name,status,org_id,sent_count&order=created_at.desc&limit=10',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
    capture_output=True, text=True)
camps = json.loads(r.stdout)
for c in camps:
    print(f"  {c['name']}: id={c['id'][:12]}... status={c['status']} org={c['org_id'][:12]}... sent={c['sent_count']}")

# 2. Check the mystery campaign c7a43dd6
print("\n=== MYSTERY CAMPAIGN c7a43dd6 ===")
r = subprocess.run(['curl', '-s',
    f'{url}/campaigns?id=eq.c7a43dd6-b673-438b-9561-2da6046fd96f&select=name,status,org_id,sent_count',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
    capture_output=True, text=True)
print(f"  {r.stdout.strip()}")

# 3. Check Inngest function list
print("\n=== INNGEST FUNCTIONS ===")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/apps/leadflow-app/functions',
    '-H', f'Authorization: Bearer {sk}'],
    capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, list):
        for fn in data[:25]:
            print(f"  {fn.get('slug', fn.get('name', fn.get('id', '?')))}")
    elif isinstance(data, dict) and 'data' in data:
        for fn in data['data'][:25]:
            name = fn.get('name', fn.get('slug', fn.get('id', '?')))
            triggers = fn.get('triggers', [])
            print(f"  {name}: triggers={triggers}")
    else:
        print(f"  Raw: {r.stdout[:500]}")
except:
    print(f"  Raw: {r.stdout[:500]}")

# 4. Check if the serve endpoint is returning updated functions
print("\n=== SERVE ENDPOINT (production) ===")
r = subprocess.run(['curl', '-s', 'https://tryleadflow.ai/api/inngest',
    '-H', 'Content-Type: application/json'],
    capture_output=True, text=True)
print(f"  {r.stdout[:300]}")

# 5. Try the function runs endpoint directly
print("\n=== RECENT EMAIL-PROCESSOR RUNS (via runs API) ===")
# Try different run query endpoints
for endpoint in [
    'runs?function_id=leadflow-app-email-processor&limit=3',
    'functions/leadflow-app-email-processor/runs?limit=3',
]:
    r = subprocess.run(['curl', '-s',
        f'https://api.inngest.com/v1/{endpoint}',
        '-H', f'Authorization: Bearer {sk}'],
        capture_output=True, text=True)
    print(f"  {endpoint}: {r.stdout[:300]}")
