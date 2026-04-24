#!/usr/bin/env python3
"""Diagnose Inngest: check events/runs, test event send, verify pipeline."""
import re, subprocess, json, os

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
event_key = re.search(r'INNGEST_EVENT_KEY="([^"]+)"', text).group(1)
signing_key = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)

cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'
oid = '64209895-565d-4974-9d41-3f39d1a1b467'

# 1) Check campaign properly
print("=" * 60)
print("1) CAMPAIGN")
r = subprocess.run(['curl', '-s',
    f'{url}/campaigns?id=eq.{cid}&select=id,name,status,use_powersend,sender_ids,powersend_server_ids,sent_count,total_leads,steps,org_id',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    camp = json.loads(r.stdout)
    if camp and isinstance(camp, list) and len(camp) > 0:
        c = camp[0]
        for k, v in c.items():
            if k != 'steps':
                print(f"   {k}: {v}")
            else:
                print(f"   steps: {len(v)} steps")
                for i, s in enumerate(v):
                    print(f"     [{i}] subject: {s.get('subject', 'N/A')}, delay: {s.get('delay_days', 0)}d {s.get('delay_hours', 0)}h")
    else:
        print(f"   ERROR: {r.stdout[:300]}")
except Exception as e:
    print(f"   ERROR: {e}\n   {r.stdout[:300]}")

# 2) Server status with correct columns
print("\n" + "=" * 60)
print("2) SERVERS (correct columns)")
for sid, name in [('1dac6ece-a3be-401a-840a-34072d90be2c', 'Territorial'), ('7a0741c6-4678-4863-9a1e-26c888e5fae4', 'rofsell')]:
    r = subprocess.run(['curl', '-s',
        f'{url}/smart_servers?id=eq.{sid}&select=name,status,daily_limit,current_usage,warmup_day,warmup_daily_sends,smtp_config',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
    ], capture_output=True, text=True)
    print(f"   {name}: {r.stdout.strip()}")

# 3) Sample recipients with correct columns
print("\n" + "=" * 60)
print("3) SAMPLE RECIPIENTS")
r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&select=id,lead_id,status,sent_count,current_step,dispatched_at,last_sent_at,next_send_at&limit=3',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    recs = json.loads(r.stdout)
    for rec in recs:
        print(f"   {json.dumps(rec)}")
except:
    print(f"   {r.stdout[:300]}")

# 4) Check Inngest API - list recent events  
print("\n" + "=" * 60)
print("4) INNGEST API - Recent events")
# Try with signing key
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/events?limit=5',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
print(f"   signing_key auth: {r.stdout[:300]}")

# Try with event key
r2 = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/events?limit=5',
    '-H', f'Authorization: Bearer {event_key}'
], capture_output=True, text=True)
print(f"   event_key auth: {r2.stdout[:300]}")

# 5) Check Inngest function runs
print("\n" + "=" * 60) 
print("5) INNGEST API - Function runs")
for fn_slug in ['email-processor', 'campaign-sweep']:
    r = subprocess.run(['curl', '-s',
        f'https://api.inngest.com/v1/functions/{fn_slug}/runs?limit=3',
        '-H', f'Authorization: Bearer {signing_key}'
    ], capture_output=True, text=True)
    print(f"   {fn_slug}: {r.stdout[:200]}")

# 6) Check Inngest cancellations
print("\n" + "=" * 60)
print("6) INNGEST API - Cancellations")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/cancellations?limit=3',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
print(f"   {r.stdout[:300]}")

# 7) Try sending a single test event via Inngest event API
print("\n" + "=" * 60)
print("7) TEST: Send single event via Inngest API")
# Get first recipient's lead_id
r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&status=eq.active&sent_count=eq.0&select=lead_id&limit=1',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    lead = json.loads(r.stdout)[0]['lead_id']
    print(f"   Test lead: {lead}")
    
    # Send event
    event_data = {
        "name": "campaign/email.process",
        "data": {
            "campaignId": cid,
            "leadId": lead,
            "stepIdx": 0,
            "orgId": oid
        }
    }
    r2 = subprocess.run(['curl', '-s', '-X', 'POST',
        'https://inn.gs/e/' + event_key,
        '-H', 'Content-Type: application/json',
        '-d', json.dumps(event_data)
    ], capture_output=True, text=True)
    print(f"   Event send result: {r2.stdout[:300]}")
except Exception as e:
    print(f"   Error: {e}")

# 8) Check APP_URL
app_url = re.search(r'NEXT_PUBLIC_APP_URL="([^"]+)"', text)
print(f"\n   APP_URL: {app_url.group(1) if app_url else 'NOT SET'}")
inngest_url = re.search(r'INNGEST_BASE_URL="([^"]+)"', text)
print(f"   INNGEST_BASE_URL: {inngest_url.group(1) if inngest_url else 'NOT SET'}")
