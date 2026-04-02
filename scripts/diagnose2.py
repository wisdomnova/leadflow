import urllib.request, json, os

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

# 1. Server capacity TODAY
print("=== SERVER CAPACITY (should be reset at midnight) ===")
servers = api(f'smart_servers?select=id,name,current_usage,daily_limit,status,warmup_daily_sends&org_id=eq.{ORG}')
for s in servers:
    print(f"  {s['name']}: usage={s.get('current_usage')}/{s.get('daily_limit')} warmup_sends={s.get('warmup_daily_sends')} [{s['status']}]")

# 2. Mailbox usage today (sample)
print("\n=== MAILBOX USAGE SAMPLE (first 10) ===")
mbs = api(f'server_mailboxes?select=email,current_usage,daily_limit,status,last_sent_at&org_id=eq.{ORG}&limit=10')
for m in mbs:
    print(f"  {m['email'][:40]:40s} usage={m.get('current_usage')}/{m.get('daily_limit')} last={m.get('last_sent_at','never')}")

# 3. Campaign powersend config
print("\n=== CAMPAIGN POWERSEND CONFIG ===")
camp = api(f'campaigns?select=use_powersend,powersend_server_ids,powersend_config,sender_id,sender_ids&id=eq.{CAMPAIGN}')
if camp:
    print(json.dumps(camp[0], indent=2, default=str))

# 4. Check if stall notification was generated AFTER our fix (after 73ef98c deployed)
print("\n=== STALL NOTIFICATIONS (showing we need to check if old ones were cleaned) ===")
stalls = api(f'notifications?select=id,title,description,created_at&org_id=eq.{ORG}&title=like.*Stall*&order=created_at.desc&limit=5')
for s in stalls:
    print(f"  {s['created_at']} | {s['title']}")
    print(f"    {s.get('description','')[:150]}")

# 5. Check subscription
print("\n=== SUBSCRIPTION CHECK ===")
subs = api(f'subscriptions?select=*&org_id=eq.{ORG}&limit=1')
if subs:
    s = subs[0]
    print(f"  Plan: {s.get('plan_id')} | Status: {s.get('status')} | Tier: {s.get('tier')}")
    print(f"  Email limit: {json.dumps(s.get('limits'))}")

# 6. Monthly volume check (what emailProcessor checks)
print("\n=== MONTHLY VOLUME (plan limit check) ===")
analytics = api(f'analytics_daily?select=date,sent_count&org_id=eq.{ORG}&date=gte.2026-04-01&order=date.asc')
total = sum(a.get('sent_count', 0) for a in analytics)
print(f"  April total so far: {total}")
for a in analytics:
    print(f"    {a['date']}: {a.get('sent_count')}")

# Also check March
analytics_mar = api(f'analytics_daily?select=sent_count&org_id=eq.{ORG}&date=gte.2026-03-01&date=lt.2026-04-01')
march_total = sum(a.get('sent_count', 0) for a in analytics_mar)
print(f"  March total: {march_total}")

# 7. All-time total
analytics_all = api(f'analytics_daily?select=sent_count&org_id=eq.{ORG}')
all_total = sum(a.get('sent_count', 0) for a in analytics_all)
print(f"  All-time total: {all_total}")

# 8. Dispatched_at distribution
print("\n=== DISPATCHED_AT CHECK ===")
sample = api(f'campaign_recipients?select=lead_id,dispatched_at,last_sent_at,current_step,status&campaign_id=eq.{CAMPAIGN}&dispatched_at=not.is.null&order=dispatched_at.desc&limit=5')
for r in sample:
    print(f"  dispatched={r.get('dispatched_at')} sent={r.get('last_sent_at')} step={r.get('current_step')} status={r.get('status')}")
