#!/usr/bin/env python3
"""Test the RPCs that email-processor uses."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'

def rpc(name, params):
    r = subprocess.run(['curl', '-s', '-X', 'POST',
        f'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1/rpc/{name}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps(params)], capture_output=True, text=True)
    return r.stdout

# Test get_next_powersend_node
org_id = '64209895-565d-4974-9d41-3f39d1a1b467'
server_ids = ['1dac6ece-a3be-401a-840a-34072d90be2c', '7a0741c6-4678-4863-9a1e-26c888e5fae4']

print("=== get_next_powersend_node ===")
result = rpc('get_next_powersend_node', {'org_id_param': org_id, 'server_ids_param': server_ids})
print(f"  Result: {result[:500]}")

# Test get_next_pool_mailbox for each server
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4','rofsell'),('1dac6ece-a3be-401a-840a-34072d90be2c','Territorial')]:
    print(f"\n=== get_next_pool_mailbox ({name}) ===")
    result = rpc('get_next_pool_mailbox', {'server_id_param': sid})
    print(f"  Result: {result[:500]}")

# Test checkSubscription equivalent
print("\n=== Subscription check ===")
r = subprocess.run(['curl', '-s',
    f'{url}/organizations?id=eq.{org_id}&select=subscription_status,plan_tier',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
    capture_output=True, text=True)
print(f"  Org: {r.stdout.strip()}")

# Check if there's a subscriptions table
r = subprocess.run(['curl', '-s',
    f'{url}/subscriptions?organization_id=eq.{org_id}&select=status,plan_tier',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
    capture_output=True, text=True)
print(f"  Subscriptions: {r.stdout.strip()[:300]}")
