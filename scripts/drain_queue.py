#!/usr/bin/env python3
"""Cancel ALL queued email-processor runs and reset DB state."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

signing_key = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'

cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'
oid = '64209895-565d-4974-9d41-3f39d1a1b467'

# 1) Cancel ALL email-processor runs (bulk cancel everything started before now)
print("=" * 60)
print("1) CANCELLING ALL email-processor runs")
now = '2026-04-03T23:59:59Z'  # Cancel everything up to end of today
cancel_payload = {
    "app_id": "leadflow-app",
    "function_id": "leadflow-app-email-processor",
    "started_before": now
}
r = subprocess.run(['curl', '-s', '-X', 'POST',
    'https://api.inngest.com/v1/cancellations',
    '-H', f'Authorization: Bearer {signing_key}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps(cancel_payload)
], capture_output=True, text=True)
print(f"   email-processor: {r.stdout[:200]}")

# Also cancel campaign-sweep to stop it from creating more events while we fix
cancel_sweep = {
    "app_id": "leadflow-app", 
    "function_id": "leadflow-app-campaign-sweep",
    "started_before": now
}
r = subprocess.run(['curl', '-s', '-X', 'POST',
    'https://api.inngest.com/v1/cancellations',
    '-H', f'Authorization: Bearer {signing_key}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps(cancel_sweep)
], capture_output=True, text=True)
print(f"   campaign-sweep: {r.stdout[:200]}")

# 2) Reset campaign recipients dispatched_at
print("\n" + "=" * 60)
print("2) RESETTING dispatched_at on all recipients")
r = subprocess.run(['curl', '-s', '-X', 'PATCH',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&status=eq.active',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'dispatched_at': None})
], capture_output=True, text=True)
print(f"   Reset: done")

# 3) Reset server current_usage (we bumped it during diagnostics)
print("\n" + "=" * 60)
print("3) RESETTING server current_usage to 0")
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4', 'rofsell'), ('1dac6ece-a3be-401a-840a-34072d90be2c', 'Territorial')]:
    r = subprocess.run(['curl', '-s', '-X', 'PATCH',
        f'{url}/smart_servers?id=eq.{sid}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({'current_usage': 0})
    ], capture_output=True, text=True)
    print(f"   {name}: reset to 0")

# 4) Fix campaign sent_count (diagnostic RPC incremented it)
print("\n" + "=" * 60) 
print("4) RESETTING campaign sent_count to 0")
r = subprocess.run(['curl', '-s', '-X', 'PATCH',
    f'{url}/campaigns?id=eq.{cid}',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'sent_count': 0})
], capture_output=True, text=True)
print(f"   Reset: done")

# 5) Reset mailbox current_usage for all mailboxes on both servers
print("\n" + "=" * 60)
print("5) RESETTING mailbox current_usage to 0")
for sid in ['7a0741c6-4678-4863-9a1e-26c888e5fae4', '1dac6ece-a3be-401a-840a-34072d90be2c']:
    r = subprocess.run(['curl', '-s', '-X', 'PATCH',
        f'{url}/server_mailboxes?server_id=eq.{sid}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({'current_usage': 0})
    ], capture_output=True, text=True)
    print(f"   server {sid[:8]}: reset")

# 6) Fix warmup_day back to 1 and daily_limit back to 10 (diagnostic advanced it)
print("\n" + "=" * 60)
print("6) RESETTING warmup_day=1, daily_limit=10 (diagnostic bumped these)")
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4', 'rofsell'), ('1dac6ece-a3be-401a-840a-34072d90be2c', 'Territorial')]:
    r = subprocess.run(['curl', '-s', '-X', 'PATCH',
        f'{url}/smart_servers?id=eq.{sid}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({'warmup_day': 1, 'daily_limit': 10, 'warmup_daily_sends': 0})
    ], capture_output=True, text=True)
    print(f"   {name}: warmup_day=1, daily_limit=10")

print("\n" + "=" * 60)
print("DONE. Now fix the code before removing cancellations.")
print("Key issues to fix:")
print("  - email-processor: don't retry on daily capacity (return, don't throw)")
print("  - email-processor: add EARLY capacity check before heavy DB work")
print("  - email-processor: reduce stale TTL from 2h to 35min")
print("  - campaign-sweep: add capacity awareness (don't dispatch if at limit)")
