#!/usr/bin/env python3
"""Fix test: check schema, retry event send."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
event_key = re.search(r'INNGEST_EVENT_KEY="([^"]+)"', text).group(1)

cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'
oid = '64209895-565d-4974-9d41-3f39d1a1b467'

# 1) Get actual campaign_recipients columns via a simple query
print("1) Campaign recipients column check:")
r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&limit=1',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    recs = json.loads(r.stdout)
    if isinstance(recs, list) and len(recs) > 0:
        print(f"   Columns: {list(recs[0].keys())}")
        print(f"   Sample: {json.dumps(recs[0], indent=2)}")
    elif isinstance(recs, dict) and 'code' in recs:
        print(f"   Error: {recs.get('message')}")
    else:
        print(f"   {r.stdout[:300]}")
except:
    print(f"   {r.stdout[:300]}")

# 2) Get first lead_id without sent_count filter
print("\n2) First recipient:")
r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&status=eq.active&select=lead_id&limit=1',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, list) and len(data) > 0:
        lead = data[0]['lead_id']
        print(f"   Lead ID: {lead}")
        
        # 3) Send test event via Inngest
        event_data = {
            "name": "campaign/email.process",
            "data": {
                "campaignId": cid,
                "leadId": lead,
                "stepIdx": 0,
                "orgId": oid
            }
        }
        print(f"\n3) Sending test event to Inngest...")
        print(f"   URL: https://inn.gs/e/{event_key[:10]}...")
        r2 = subprocess.run(['curl', '-sv', '-X', 'POST',
            f'https://inn.gs/e/{event_key}',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps(event_data)
        ], capture_output=True, text=True)
        print(f"   stdout: {r2.stdout[:500]}")
        print(f"   stderr (last 500): {r2.stderr[-500:]}")
    else:
        print(f"   Error: {r.stdout[:300]}")
except Exception as e:
    print(f"   Error: {e}")
    print(f"   {r.stdout[:300]}")

# 4) Check if there's a different event ingestion URL
print("\n4) Inngest keys:")
print(f"   Event key starts with: {event_key[:20]}...")
# Try the alternative events API
print("\n5) Try alternative event API:")
event_data = {
    "name": "test/ping",
    "data": {"test": True}
}
r3 = subprocess.run(['curl', '-s', '-X', 'POST',
    f'https://inn.gs/e/{event_key}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps(event_data)
], capture_output=True, text=True)
print(f"   inn.gs response: {r3.stdout[:200]}")

r4 = subprocess.run(['curl', '-s', '-X', 'POST',
    f'https://api.inngest.com/e/{event_key}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps(event_data)
], capture_output=True, text=True)
print(f"   api.inngest.com response: {r4.stdout[:200]}")
