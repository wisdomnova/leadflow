import urllib.request, json, os

SUPABASE_URL = 'https://eqksgmbcyvfllcaeqgbj.supabase.co'
SERVICE_KEY = ''
with open(os.path.join(os.path.dirname(__file__), '..', '.env')) as f:
    for line in f:
        if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
            SERVICE_KEY = line.split('=',1)[1].strip().strip('"')

headers = {'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}'}
ORG = '64209895-565d-4974-9d41-3f39d1a1b467'

# Check organization
print("=== ORGANIZATION ===")
org = json.loads(urllib.request.urlopen(urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/organizations?select=id,name,subscription_status,plan_tier,trial_ends_at,ai_usage_current,ai_usage_limit&id=eq.{ORG}',
    headers=headers
)).read())
if org:
    print(json.dumps(org[0], indent=2, default=str))
else:
    print("  NOT FOUND!")

# Check get_next_powersend_node RPC
print("\n=== TEST get_next_powersend_node RPC ===")
try:
    body = json.dumps({
        "org_id_param": ORG,
        "server_ids_param": ["01ce1936-1c3d-4554-a2fb-34a13deb04a6", "782e5d31-2f43-4979-9ab2-3131f31dd101"]
    }).encode()
    req = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/rpc/get_next_powersend_node',
        data=body,
        headers={**headers, 'Content-Type': 'application/json'}
    )
    resp = json.loads(urllib.request.urlopen(req).read())
    print(f"  Result: {json.dumps(resp[0] if resp else 'NO NODE RETURNED', indent=2, default=str)}")
except Exception as e:
    print(f"  ERROR: {e}")

# Check get_next_pool_mailbox RPC
print("\n=== TEST get_next_pool_mailbox RPC ===")
try:
    body = json.dumps({"server_id_param": "01ce1936-1c3d-4554-a2fb-34a13deb04a6"}).encode()
    req = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/rpc/get_next_pool_mailbox',
        data=body,
        headers={**headers, 'Content-Type': 'application/json'}
    )
    resp = json.loads(urllib.request.urlopen(req).read())
    if resp:
        print(f"  Mailbox: {resp[0].get('email')} (id: {resp[0].get('mailbox_id')})")
    else:
        print("  NO MAILBOX RETURNED!")
except Exception as e:
    print(f"  ERROR: {e}")

# Check increment_mailbox_usage RPC exists
print("\n=== TEST increment_mailbox_usage RPC ===")
try:
    # Just test with a real mailbox ID
    mb_id = "d394f852-fd99-4f19-99a2-84ecb71dfd09"
    body = json.dumps({"mailbox_id_param": mb_id}).encode()
    req = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/rpc/increment_mailbox_usage',
        data=body,
        headers={**headers, 'Content-Type': 'application/json'}
    )
    resp = urllib.request.urlopen(req)
    print(f"  Status: {resp.status} - OK")
except Exception as e:
    print(f"  ERROR: {e}")

# Check increment_server_usage RPC exists 
print("\n=== TEST increment_server_usage RPC ===")
try:
    body = json.dumps({"server_id_param": "01ce1936-1c3d-4554-a2fb-34a13deb04a6"}).encode()
    req = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/rpc/increment_server_usage',
        data=body,
        headers={**headers, 'Content-Type': 'application/json'}
    )
    resp = urllib.request.urlopen(req)
    print(f"  Status: {resp.status} - OK")
except Exception as e:
    print(f"  ERROR: {e}")

# Check increment_campaign_stat
print("\n=== TEST increment_campaign_stat RPC ===")
try:
    body = json.dumps({"campaign_id_param": "c7a43dd6-b673-438b-9561-2da6046fd96f", "column_param": "sent_count"}).encode()
    req = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/rpc/increment_campaign_stat',
        data=body,
        headers={**headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}
    )
    resp = urllib.request.urlopen(req)
    print(f"  Status: {resp.status} - OK (NOTE: this actually incremented sent_count by 1)")
except Exception as e:
    print(f"  ERROR: {e}")
