import urllib.request, json, os
from datetime import datetime, timezone

SUPABASE_URL = 'https://eqksgmbcyvfllcaeqgbj.supabase.co'
SERVICE_KEY = ''
with open(os.path.join(os.path.dirname(__file__), '..', '.env')) as f:
    for line in f:
        if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
            SERVICE_KEY = line.split('=',1)[1].strip().strip('"')

headers = {'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}'}
ORG = '64209895-565d-4974-9d41-3f39d1a1b467'
CAMPAIGN = 'c7a43dd6-b673-438b-9561-2da6046fd96f'

def api(path):
    url = f'{SUPABASE_URL}/rest/v1/{path}'
    req = urllib.request.Request(url, headers=headers)
    try:
        return json.loads(urllib.request.urlopen(req).read())
    except Exception as e:
        print(f"  ERROR: {e}")
        return []

def count(path):
    url = f'{SUPABASE_URL}/rest/v1/{path}'
    h = {**headers, 'Prefer': 'count=exact', 'Range': '0-0'}
    req = urllib.request.Request(url, headers=h)
    resp = urllib.request.urlopen(req)
    cr = resp.headers.get('Content-Range', '')
    return int(cr.split('/')[-1]) if '/' in cr else 0

now = datetime.now(timezone.utc)
print(f"=== DIAGNOSTIC: {now.isoformat()} ===\n")

# 1. Campaign status
print("--- CAMPAIGN ---")
c = api(f'campaigns?select=id,name,status,sent_count,total_leads&id=eq.{CAMPAIGN}')
if c: print(json.dumps(c[0], indent=2))

# 2. Latest sends
print("\n--- LAST 10 SENDS ---")
sends = api(f'activity_log?select=action_type,created_at,description&org_id=eq.{ORG}&action_type=eq.email_sent&order=created_at.desc&limit=10')
for s in sends:
    print(f"  {s['created_at']}")

# 3. Any sends today (April 2)?
n_today = count(f'activity_log?select=id&org_id=eq.{ORG}&action_type=eq.email_sent&created_at=gte.2026-04-02T00:00:00')
n_yesterday = count(f'activity_log?select=id&org_id=eq.{ORG}&action_type=eq.email_sent&created_at=gte.2026-04-01T00:00:00&created_at=lt.2026-04-02T00:00:00')
print(f"\n  Sends today (Apr 2): {n_today}")
print(f"  Sends yesterday (Apr 1): {n_yesterday}")

# 4. Recipients
print("\n--- RECIPIENTS ---")
total = count(f'campaign_recipients?select=id&campaign_id=eq.{CAMPAIGN}')
active = count(f'campaign_recipients?select=id&campaign_id=eq.{CAMPAIGN}&status=eq.active')
unsent = count(f'campaign_recipients?select=id&campaign_id=eq.{CAMPAIGN}&status=eq.active&last_sent_at=is.null')
print(f"  Total: {total}")
print(f"  Active: {active}")
print(f"  Active+unsent (sweep eligible): {unsent}")

# 5. Check dispatched_at — how many were marked by the new sweep?
dispatched = count(f'campaign_recipients?select=id&campaign_id=eq.{CAMPAIGN}&dispatched_at=not.is.null')
print(f"  With dispatched_at set: {dispatched}")

# 6. Recently dispatched (last 30 min)
thirty_min = datetime(2026, 4, 2, now.hour, max(0, now.minute - 30), tzinfo=timezone.utc).isoformat()
recent_disp = count(f'campaign_recipients?select=id&campaign_id=eq.{CAMPAIGN}&dispatched_at=gte.{thirty_min}')
print(f"  Dispatched in last 30min: {recent_disp}")

# 7. Server capacity
print("\n--- SERVER CAPACITY ---")
servers = api(f'smart_servers?select=id,name,current_usage,daily_limit,status&org_id=eq.{ORG}')
for s in servers:
    remaining = (s.get('daily_limit') or 0) - (s.get('current_usage') or 0)
    print(f"  {s['name']}: {s.get('current_usage')}/{s.get('daily_limit')} (remaining: {remaining}) [{s['status']}]")

# 8. Mailbox capacity
print("\n--- MAILBOX CAPACITY ---")
mbs = api(f'server_mailboxes?select=current_usage,daily_limit&org_id=eq.{ORG}')
total_usage = sum(m.get('current_usage') or 0 for m in mbs)
total_limit = sum(m.get('daily_limit') or 0 for m in mbs)
at_limit = sum(1 for m in mbs if (m.get('current_usage') or 0) >= (m.get('daily_limit') or 30))
print(f"  Total usage: {total_usage} / {total_limit}")
print(f"  At limit: {at_limit} / {len(mbs)}")

# 9. Errors today
print("\n--- ERRORS TODAY ---")
errors = api(f'activity_log?select=action_type,description,created_at&org_id=eq.{ORG}&action_type=like.*fail*&created_at=gte.2026-04-01T00:00:00&order=created_at.desc&limit=5')
for e in errors:
    print(f"  {e['created_at']} | {e.get('description','')[:120]}")
if not errors:
    print("  None")

# 10. Stall notification — was the old one or was a new one generated?
print("\n--- STALL NOTIFICATIONS ---")
stalls = api(f'notifications?select=id,title,created_at&org_id=eq.{ORG}&title=like.*Stall*&order=created_at.desc&limit=5')
for s in stalls:
    print(f"  {s['created_at']} | {s['title']}")
