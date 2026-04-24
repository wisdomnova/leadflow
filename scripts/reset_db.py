#!/usr/bin/env python3
"""Reset DB state: rofsell back to warming, all counters reset, dispatched_at cleared."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'

cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'

# 1) Fix rofsell — was accidentally graduated by advance_powersend_warmup
print("1) Fixing rofsell (back to warming):")
r = subprocess.run(['curl', '-s', '-X', 'PATCH',
    f'{url}/smart_servers?id=eq.7a0741c6-4678-4863-9a1e-26c888e5fae4',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({
        'status': 'warming',
        'warmup_enabled': True,
        'warmup_day': 1,
        'daily_limit': 10,
        'current_usage': 0,
        'warmup_daily_sends': 0,
        'warmup_completed_at': None,
        'total_sends': 0
    })
], capture_output=True, text=True)
print(f"   done")

# 2) Verify Territorial is correct
print("2) Verifying Territorial:")
r = subprocess.run(['curl', '-s', '-X', 'PATCH',
    f'{url}/smart_servers?id=eq.1dac6ece-a3be-401a-840a-34072d90be2c',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({
        'current_usage': 0,
        'warmup_daily_sends': 0,
        'total_sends': 0
    })
], capture_output=True, text=True)
print(f"   done")

# 3) Reset campaign sent_count  
print("3) Reset campaign sent_count:")
r = subprocess.run(['curl', '-s', '-X', 'PATCH',
    f'{url}/campaigns?id=eq.{cid}',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'sent_count': 0})
], capture_output=True, text=True)
print(f"   done")

# 4) Reset all mailbox current_usage
print("4) Reset mailbox usage:")
for sid in ['7a0741c6-4678-4863-9a1e-26c888e5fae4', '1dac6ece-a3be-401a-840a-34072d90be2c']:
    r = subprocess.run(['curl', '-s', '-X', 'PATCH',
        f'{url}/server_mailboxes?server_id=eq.{sid}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({'current_usage': 0})
    ], capture_output=True, text=True)

print(f"   done")

# 5) Reset dispatched_at on all recipients
print("5) Reset dispatched_at:")
r = subprocess.run(['curl', '-s', '-X', 'PATCH',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&status=eq.active',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'dispatched_at': None})
], capture_output=True, text=True)
print(f"   done")

# 6) Verify final state
print("\n=== FINAL STATE ===")
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4', 'rofsell'), ('1dac6ece-a3be-401a-840a-34072d90be2c', 'Territorial')]:
    r = subprocess.run(['curl', '-s',
        f'{url}/smart_servers?id=eq.{sid}&select=name,status,warmup_enabled,warmup_day,daily_limit,current_usage,warmup_daily_sends',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
    ], capture_output=True, text=True)
    print(f"   {name}: {r.stdout.strip()}")

r = subprocess.run(['curl', '-s',
    f'{url}/campaigns?id=eq.{cid}&select=sent_count,status',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
print(f"   Campaign: {r.stdout.strip()}")

# Count undispatched recipients
r2 = subprocess.run(['curl', '-s', '-I',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&dispatched_at=is.null&status=eq.active&select=id',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Prefer: count=exact'
], capture_output=True, text=True)
for line in r2.stdout.split('\n'):
    if 'content-range' in line.lower():
        print(f"   Undispatched recipients: {line.strip().split('/')[-1]}")
