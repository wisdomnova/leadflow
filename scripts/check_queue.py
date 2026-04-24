#!/usr/bin/env python3
"""Check Inngest queue state and try to unclog email-processor."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

signing_key = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
event_key = re.search(r'INNGEST_EVENT_KEY="([^"]+)"', text).group(1)

# 1) Check if there are remaining cancellations
print("1) Cancellations:")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/cancellations?limit=20',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    cancellations = data.get('data', [])
    print(f"   Count: {len(cancellations)}")
    for c in cancellations:
        print(f"   {c.get('function_id', '?')} - {c.get('kind', '?')} - before {c.get('started_before', '?')}")
except:
    print(f"   {r.stdout[:300]}")

# 2) Check bulk cancellation status
print("\n2) Checking for any active bulk operations:")
for endpoint in ['v1/bulk-cancellations', 'v1/cancellations/bulk']:
    r = subprocess.run(['curl', '-s',
        f'https://api.inngest.com/{endpoint}',
        '-H', f'Authorization: Bearer {signing_key}'
    ], capture_output=True, text=True)
    print(f"   {endpoint}: {r.stdout[:200]}")

# 3) Check how many email-processor events are in Inngest
print("\n3) campaign/email.process events count:")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/events?name=campaign/email.process&limit=1',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    events = data.get('data', [])
    # Check metadata for pagination info
    meta = data.get('metadata', {})
    print(f"   Events in response: {len(events)}")
    print(f"   Metadata: {json.dumps(meta)}")
except:
    print(f"   {r.stdout[:300]}")

# 4) Send a campaign/email.process event with a UNIQUE identifier
# so we can track it in the dashboard
print("\n4) Sending TAGGED test event:")
import time
tag = f"diag-{int(time.time())}"
event_data = {
    "name": "campaign/email.process",
    "data": {
        "campaignId": "d989f357-39cb-4d99-a3cd-56a36e2562be",
        "leadId": "56aec11d-2b4c-45f5-a068-6b3630dd1805",
        "stepIdx": 0,
        "orgId": "64209895-565d-4974-9d41-3f39d1a1b467",
        "_diag": tag
    }
}
r = subprocess.run(['curl', '-s', '-X', 'POST',
    f'https://inn.gs/e/{event_key}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps(event_data)
], capture_output=True, text=True)
result = json.loads(r.stdout)
eid = result.get('ids', ['?'])[0]
print(f"   Event ID: {eid}")
print(f"   Tag: {tag}")
print(f"   Status: {result.get('status')}")

# 5) Wait and check
print("\n5) Waiting 15 seconds...")
time.sleep(15)

# Check the event
r = subprocess.run(['curl', '-s',
    f'https://api.inngest.com/v1/events/{eid}/runs',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
print(f"   Runs after 15s: {r.stdout[:500]}")

# 6) Try pausing and unpausing email-processor to clear queue
# First let's see all Inngest API endpoints available
print("\n6) Inngest API endpoints test:")
for endpoint in [
    'v1/functions',
    'v1/apps', 
    'v2/functions',
]:
    r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
        f'https://api.inngest.com/{endpoint}',
        '-H', f'Authorization: Bearer {signing_key}'
    ], capture_output=True, text=True)
    print(f"   {endpoint}: HTTP {r.stdout}")

# 7) Try the environment-scoped API
print("\n7) Environment-scoped API:")
env_id = '714444f8-a617-4ef8-a53c-c897a4717bd0'
for endpoint in [
    f'v1/envs/{env_id}/functions',
    f'v1/envs/{env_id}/apps',
]:
    r = subprocess.run(['curl', '-s',
        f'https://api.inngest.com/{endpoint}',
        '-H', f'Authorization: Bearer {signing_key}'
    ], capture_output=True, text=True)
    print(f"   {endpoint}: {r.stdout[:500]}")
