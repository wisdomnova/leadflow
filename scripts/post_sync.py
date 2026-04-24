#!/usr/bin/env python3
"""Post-sync check: are events now triggering function runs?"""
import re, subprocess, json, time

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
signing_key = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
event_key = re.search(r'INNGEST_EVENT_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'
oid = '64209895-565d-4974-9d41-3f39d1a1b467'

# 1) Send a fresh test event
print("1) Sending fresh test event after sync...")
recs = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&status=eq.active&last_sent_at=is.null&select=lead_id&limit=1',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
lead = json.loads(recs.stdout)[0]['lead_id']
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
result = json.loads(r.stdout)
event_id = result.get('ids', ['unknown'])[0]
print(f"   Event sent: {r.stdout}")
print(f"   Event ID: {event_id}")

# 2) Wait and check the event's runs
print("\n2) Waiting 30 seconds for processing...")
time.sleep(30)

# Check the event's function runs via API
print("\n3) Checking event runs...")
r = subprocess.run(['curl', '-s',
    f'https://api.inngest.com/v1/events/{event_id}/runs',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
print(f"   Runs: {r.stdout[:500]}")

# 4) Check if recipient was updated
print("\n4) Checking recipient...")
r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&lead_id=eq.{lead}',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
rec = json.loads(r.stdout)[0]
print(f"   last_sent_at: {rec['last_sent_at']}")
print(f"   current_step: {rec['current_step']}")
print(f"   status: {rec['status']}")

# 5) Check campaign
print("\n5) Campaign status:")
r = subprocess.run(['curl', '-s',
    f'{url}/campaigns?id=eq.{cid}&select=sent_count',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
print(f"   {r.stdout}")

# 6) Check servers
print("\n6) Server usage:")
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4', 'rofsell'), ('1dac6ece-a3be-401a-840a-34072d90be2c', 'Territorial')]:
    r = subprocess.run(['curl', '-s',
        f'{url}/smart_servers?id=eq.{sid}&select=current_usage,daily_limit,warmup_daily_sends',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
    ], capture_output=True, text=True)
    print(f"   {name}: {r.stdout.strip()}")

# 7) Check recent activity
print("\n7) Recent activity:")
r = subprocess.run(['curl', '-s',
    f'{url}/activity_log?select=action_type,description,created_at&order=created_at.desc&limit=5',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    acts = json.loads(r.stdout)
    for a in acts:
        print(f"   {a['created_at']}: {a['action_type']} - {a['description'][:80]}")
except:
    print(f"   {r.stdout[:300]}")

# 8) Check latest events in Inngest
print("\n8) Latest Inngest events:")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/events?limit=5',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    for e in data.get('data', []):
        print(f"   {e.get('received_at')}: {e.get('name')} (source={e.get('source')})")
except:
    print(f"   {r.stdout[:300]}")
