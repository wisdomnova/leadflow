#!/usr/bin/env python3
"""Check if campaign sweep and email-processor are running after deploy."""
import re, subprocess, json, time

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'

def inngest_api(path):
    r = subprocess.run(['curl', '-s', f'https://api.inngest.com/v1/{path}',
        '-H', f'Authorization: Bearer {sk}'], capture_output=True, text=True)
    return json.loads(r.stdout) if r.stdout else {}

def supabase(path):
    r = subprocess.run(['curl', '-s', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
        capture_output=True, text=True)
    return json.loads(r.stdout)

# Check cancellations
print("=== CANCELLATIONS ===")
d = inngest_api('cancellations')
print(f"  Count: {len(d.get('data', []))}")

# Check servers
print("\n=== SERVERS ===")
cols = 'name,status,warmup_enabled,daily_limit,current_usage,warmup_daily_sends'
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4','rofsell'),('1dac6ece-a3be-401a-840a-34072d90be2c','Territorial')]:
    d = supabase(f'smart_servers?id=eq.{sid}&select={cols}')[0]
    print(f"  {name}: status={d['status']} limit={d['daily_limit']} usage={d['current_usage']} warmup_sends={d['warmup_daily_sends']}")

# Check campaign
print("\n=== CAMPAIGN ===")
camp = supabase('campaigns?id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&select=name,status,sent_count')[0]
print(f"  {camp['name']}: status={camp['status']} sent={camp['sent_count']}")

# Check activity log for recent sends
print("\n=== RECENT ACTIVITY ===")
logs = supabase('activity_log?org_id=eq.64209895-565d-4974-9d41-3f39d1a1b467&order=created_at.desc&limit=5&select=type,created_at')
if isinstance(logs, list) and logs:
    for log in logs:
        if isinstance(log, dict):
            print(f"  {log.get('type','?')} at {str(log.get('created_at','?'))[:19]}")
        else:
            print(f"  {str(log)[:100]}")
elif isinstance(logs, dict) and 'message' in logs:
    print(f"  Error: {logs['message']}")
else:
    print(f"  Raw: {str(logs)[:200]}")
if not logs:
    print("  (none)")

# Check dispatched recipients
print("\n=== DISPATCHED RECIPIENTS ===")
disp = supabase('campaign_recipients?campaign_id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&dispatched_at=not.is.null&select=id&limit=5')
print(f"  Dispatched count: {len(disp)}")

print("\nNote: deployment takes 3-5min via AWS CodePipeline.")
print("Run this script again after deployment completes to see sends.")
