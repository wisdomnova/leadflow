#!/usr/bin/env python3
"""Send a single test event to email-processor and track its execution."""
import re, subprocess, json, time

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
ek = re.search(r'INNGEST_EVENT_KEY="([^"]+)"', text).group(1)
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'

# Get an undispatched recipient
r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.d989f357-39cb-4d99-a3cd-56a36e2562be&last_sent_at=is.null&status=eq.active&limit=1&select=id,lead_id',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
    capture_output=True, text=True)
recips = json.loads(r.stdout)
if not recips:
    print("No unsent recipients available for test")
    exit(1)

recipient = recips[0]
lead_id = recipient['lead_id']
campaign_id = 'd989f357-39cb-4d99-a3cd-56a36e2562be'
org_id = '64209895-565d-4974-9d41-3f39d1a1b467'

print(f"Test recipient: lead_id={lead_id}")

# Mark as dispatched
r = subprocess.run(['curl', '-s', '-X', 'PATCH',
    f'{url}/campaign_recipients?id=eq.{recipient["id"]}',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'dispatched_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})],
    capture_output=True, text=True)

# Send event directly to Inngest
event = {
    'name': 'campaign/email.process',
    'data': {
        'campaignId': campaign_id,
        'leadId': lead_id,
        'stepIdx': 0,
        'orgId': org_id
    }
}

print(f"Sending event...")
r = subprocess.run(['curl', '-s', '-X', 'POST',
    'https://inn.gs/e/' + ek,
    '-H', 'Content-Type: application/json',
    '-d', json.dumps([event])],
    capture_output=True, text=True)
print(f"  Response: {r.stdout[:200]}")

# Wait and check
print("\nWaiting 30 seconds for processing...")
time.sleep(30)

# Check if the recipient was sent
r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?id=eq.{recipient["id"]}&select=status,last_sent_at,current_step',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
    capture_output=True, text=True)
print(f"Recipient after 30s: {r.stdout.strip()}")

# Check server usage
r = subprocess.run(['curl', '-s',
    f'{url}/smart_servers?org_id=eq.{org_id}&select=name,current_usage,daily_limit',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
    capture_output=True, text=True)
print(f"Server usage: {r.stdout.strip()}")

# Check campaign
r = subprocess.run(['curl', '-s',
    f'{url}/campaigns?id=eq.{campaign_id}&select=sent_count',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
    capture_output=True, text=True)
print(f"Campaign sent: {r.stdout.strip()}")
