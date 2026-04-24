#!/usr/bin/env python3
"""Deep diagnostic: why are email-processor runs finishing but not sending?"""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)

def q(path):
    r = subprocess.run(['curl', '-s', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
        capture_output=True, text=True)
    return json.loads(r.stdout)

# 1. Check a sample of recently dispatched recipients
print("=== SAMPLE DISPATCHED RECIPIENTS ===")
recips = q('campaign_recipients?campaign_id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&dispatched_at=not.is.null&order=dispatched_at.desc&limit=3&select=id,status,dispatched_at,last_sent_at,current_step')
for r in recips:
    print(f"  id={r['id'][:12]}... status={r['status']} dispatched={r['dispatched_at'][:19]} sent={r['last_sent_at']} step={r['current_step']}")

# 2. Check if any recipients have NULL dispatched_at (undispatched)
undispatched = q('campaign_recipients?campaign_id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&dispatched_at=is.null&status=eq.active&select=id&limit=3')
print(f"\n=== UNDISPATCHED RECIPIENTS ===")
print(f"  Count (up to 1000): {len(undispatched)}")

# 3. Check total recipients
all_recips = q('campaign_recipients?campaign_id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&select=id&limit=1')
r2 = subprocess.run(['curl', '-s', '-I',
    f'{url}/campaign_recipients?campaign_id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&select=id',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Prefer: count=exact'], capture_output=True, text=True)
for line in r2.stdout.split('\n'):
    if 'content-range' in line.lower():
        print(f"  Total count from header: {line.strip()}")

# 4. Check campaign steps info
print("\n=== CAMPAIGN DETAILS ===")
camp = q('campaigns?id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&select=name,status,sent_count,use_powersend,powersend_server_ids,steps')[0]
steps = camp.get('steps', [])
print(f"  Name: {camp['name']}")
print(f"  Status: {camp['status']}")
print(f"  use_powersend: {camp['use_powersend']}")
print(f"  powersend_server_ids: {camp['powersend_server_ids']}")
print(f"  Steps count: {len(steps) if isinstance(steps, list) else '?'}")
print(f"  sent_count: {camp['sent_count']}")

# 5. Check the serve endpoint to see if functions are synced
print("\n=== INNGEST SERVE ENDPOINT ===")
r = subprocess.run(['curl', '-s', 'https://tryleadflow.ai/api/inngest'], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    print(f"  Status: {r.stdout[:200]}")
except:
    print(f"  Raw: {r.stdout[:200]}")

# 6. Check the Inngest runs API for email-processor specifically
print("\n=== INNGEST FUNCTION RUNS ===")
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/events?name=campaign/email.process&limit=2',
    '-H', f'Authorization: Bearer {sk}'], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    events = data.get('data', [])
    for e in events[:2]:
        print(f"  Event: id={e.get('id','?')[:20]} received={str(e.get('received_at','?'))[:19]}")
        ed = e.get('data', {})
        print(f"    data keys: {list(ed.keys()) if isinstance(ed, dict) else type(ed)}")
        if isinstance(ed, dict):
            print(f"    recipient_id: {ed.get('recipient_id','?')[:20] if ed.get('recipient_id') else 'MISSING'}")
            print(f"    campaign_id: {ed.get('campaign_id','?')[:20] if ed.get('campaign_id') else 'MISSING'}")
except Exception as ex:
    print(f"  Error: {ex}")
    print(f"  Raw: {r.stdout[:300]}")
