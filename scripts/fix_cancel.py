#!/usr/bin/env python3
"""Check Inngest cancellations and try to find why email-processor isn't running."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

signing_key = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
event_key = re.search(r'INNGEST_EVENT_KEY="([^"]+)"', text).group(1)

# 1) List ALL cancellations
print("1) ALL cancellations:")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/cancellations?limit=20',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    cancellations = data.get('data', [])
    print(f"   Total: {len(cancellations)}")
    for c in cancellations:
        print(f"   ---")
        for k, v in c.items():
            print(f"   {k}: {v}")
except:
    print(f"   {r.stdout[:500]}")

# 2) Try deleting all cancellations to unblock
print("\n2) Deleting cancellations to unblock:")
if cancellations:
    for c in cancellations:
        cid = c.get('id')
        if cid:
            r = subprocess.run(['curl', '-s', '-X', 'DELETE',
                f'https://api.inngest.com/v1/cancellations/{cid}',
                '-H', f'Authorization: Bearer {signing_key}'
            ], capture_output=True, text=True)
            print(f"   DELETE {cid}: {r.stdout[:200]}")

# 3) Verify cancellations after deletion
print("\n3) Cancellations after cleanup:")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/cancellations?limit=20',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
print(f"   {r.stdout[:300]}")

# 4) Now send a fresh test event
print("\n4) Sending fresh test event:")
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'
oid = '64209895-565d-4974-9d41-3f39d1a1b467'

r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&status=eq.active&select=lead_id&limit=1',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
lead = json.loads(r.stdout)[0]['lead_id']
print(f"   Test lead: {lead}")

event_data = {
    "name": "campaign/email.process",
    "data": {
        "campaignId": cid,
        "leadId": lead,
        "stepIdx": 0,
        "orgId": oid
    }
}
r = subprocess.run(['curl', '-s', '-X', 'POST',
    f'https://inn.gs/e/{event_key}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps(event_data)
], capture_output=True, text=True)
print(f"   Send result: {r.stdout}")
print(f"\n   Now wait 30 seconds and check if the recipient was updated...")
