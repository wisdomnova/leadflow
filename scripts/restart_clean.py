#!/usr/bin/env python3
"""After queue drain: reset DB, delete cancellations, let fresh sweep take over."""
import re, subprocess, json, time

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'

def patch(table, query, data):
    subprocess.run(['curl', '-s', '-X', 'PATCH',
        f'{url}/{table}?{query}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps(data)], capture_output=True, text=True)

# 1. Reset all recipients dispatched_at (pagination-safe: loop in batches of 1000)
print("1) Reset dispatched_at on all recipients...")
for offset in range(0, 3000, 1000):
    patch(f'campaign_recipients', f'campaign_id=eq.{cid}&status=eq.active&offset={offset}&limit=1000', {'dispatched_at': None})
print("   Done (3 batches of 1000)")

# 2. Reset server counters
print("2) Reset server counters...")
for sid in ['7a0741c6-4678-4863-9a1e-26c888e5fae4', '1dac6ece-a3be-401a-840a-34072d90be2c']:
    patch('smart_servers', f'id=eq.{sid}', {'current_usage': 0, 'warmup_daily_sends': 0})
print("   Done")

# 3. Reset mailbox counters
print("3) Reset mailbox counters...")
for sid in ['7a0741c6-4678-4863-9a1e-26c888e5fae4', '1dac6ece-a3be-401a-840a-34072d90be2c']:
    patch('server_mailboxes', f'server_id=eq.{sid}', {'current_usage': 0})
print("   Done")

# 4. Reset campaign sent_count
print("4) Reset campaign sent_count...")
patch('campaigns', f'id=eq.{cid}', {'sent_count': 0})
print("   Done")

# 5. Delete ALL cancellation rules
print("5) Delete cancellation rules...")
r = subprocess.run(['curl', '-s', 'https://api.inngest.com/v1/cancellations',
    '-H', f'Authorization: Bearer {sk}'], capture_output=True, text=True)
cancellations = json.loads(r.stdout).get('data', [])
print(f"   Found {len(cancellations)} cancellation(s)")
for c in cancellations:
    r = subprocess.run(['curl', '-s', '-X', 'DELETE',
        f"https://api.inngest.com/v1/cancellations/{c['id']}",
        '-H', f'Authorization: Bearer {sk}'], capture_output=True, text=True)
    print(f"   Deleted {c['id']}: {r.stdout[:80]}")

# 6. Verify
print("\n=== VERIFICATION ===")
r = subprocess.run(['curl', '-s',
    f'{url}/smart_servers?org_id=eq.64209895-565d-4974-9d41-3f39d1a1b467&select=name,status,daily_limit,current_usage,warmup_daily_sends',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'], capture_output=True, text=True)
for s in json.loads(r.stdout):
    print(f"  {s['name']}: status={s['status']} limit={s['daily_limit']} usage={s['current_usage']} warmup={s['warmup_daily_sends']}")

r = subprocess.run(['curl', '-s',
    f'{url}/campaigns?id=eq.{cid}&select=sent_count,status',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'], capture_output=True, text=True)
print(f"  Campaign: {json.loads(r.stdout)}")

r = subprocess.run(['curl', '-s', 'https://api.inngest.com/v1/cancellations',
    '-H', f'Authorization: Bearer {sk}'], capture_output=True, text=True)
remaining = json.loads(r.stdout).get('data', [])
print(f"  Remaining cancellations: {len(remaining)}")

print("\nReady! Sweep should dispatch fresh events within ~2 minutes.")
print("Run: python3 scripts/monitor.py to check for sends.")
