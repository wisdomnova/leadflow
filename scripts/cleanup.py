import urllib.request, json, os

SUPABASE_URL = 'https://eqksgmbcyvfllcaeqgbj.supabase.co'
SERVICE_KEY = ''
with open(os.path.join(os.path.dirname(__file__), '..', '.env')) as f:
    for line in f:
        if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
            SERVICE_KEY = line.split('=',1)[1].strip().strip('"')

headers = {'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}', 'Content-Type': 'application/json'}
ORG = '64209895-565d-4974-9d41-3f39d1a1b467'
CAMPAIGN = 'c7a43dd6-b673-438b-9561-2da6046fd96f'

# 1. Delete stall notification
print("=== Deleting stall notification ===")
url = f'{SUPABASE_URL}/rest/v1/notifications?org_id=eq.{ORG}&title=like.*Stall*'
req = urllib.request.Request(url, method='DELETE', headers=headers)
resp = urllib.request.urlopen(req)
print(f"  Status: {resp.status}")

# 2. Fix sent_count (we accidentally incremented it by 1 during testing)
print("\n=== Fixing sent_count (1957 -> 1956) ===")
url = f'{SUPABASE_URL}/rest/v1/campaigns?id=eq.{CAMPAIGN}'
body = json.dumps({"sent_count": 1956}).encode()
req = urllib.request.Request(url, data=body, method='PATCH', headers={**headers, 'Prefer': 'return=minimal'})
resp = urllib.request.urlopen(req)
print(f"  Status: {resp.status}")
