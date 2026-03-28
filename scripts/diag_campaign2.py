#!/usr/bin/env python3
"""Diagnose campaign sending issue using raw HTTP (no external deps)."""
import urllib.request, urllib.parse, json, os

# Load env
env = {}
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')) as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            v = v.strip().strip('"').strip("'")
            env[k] = v

URL = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY', '')
ORG = '64209895-565d-4974-9d41-3f39d1a1b467'

HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'count=exact'
}

def api_get(table, params='', head=False):
    url = f'{URL}/{table}?{params}'
    req = urllib.request.Request(url, headers=HEADERS)
    if head:
        req.add_header('Prefer', 'count=exact')
        req.method = 'HEAD'
    with urllib.request.urlopen(req, timeout=30) as r:
        cr = r.headers.get('Content-Range', '')
        if head:
            # parse count from content-range: */123
            count = int(cr.split('/')[-1]) if '/' in cr else 0
            return count
        data = json.loads(r.read())
        count = int(cr.split('/')[-1]) if '/' in cr else len(data)
        return data, count

# 1. Get campaigns
print("=== CAMPAIGNS ===")
camps, _ = api_get('campaigns', f'org_id=eq.{ORG}&select=id,name,status,total_leads,sent_count,bounce_count,config,use_powersend,powersend_server_ids,sender_id,sender_ids,created_at')

for c in camps:
    print(f"\nCampaign: {c['name']}")
    print(f"  ID: {c['id']}")
    print(f"  Status: {c['status']}")
    print(f"  Total leads: {c['total_leads']}")
    print(f"  Sent: {c['sent_count']}, Bounced: {c['bounce_count']}")
    print(f"  Config: {json.dumps(c.get('config'))}")
    print(f"  use_powersend: {c.get('use_powersend')}")
    print(f"  powersend_server_ids: {c.get('powersend_server_ids')}")
    print(f"  sender_id: {c.get('sender_id')}")
    print(f"  sender_ids: {c.get('sender_ids')}")
    print(f"  Created: {c.get('created_at')}")

    cid = c['id']
    total_r = api_get('campaign_recipients', f'campaign_id=eq.{cid}&select=id', head=True)
    active_r = api_get('campaign_recipients', f'campaign_id=eq.{cid}&status=eq.active&select=id', head=True)
    unsent = api_get('campaign_recipients', f'campaign_id=eq.{cid}&status=eq.active&last_sent_at=is.null&select=id', head=True)
    print(f"  Recipients total: {total_r}, active: {active_r}, unsent(null last_sent_at): {unsent}")

# 2. Activity log
print("\n=== RECENT ACTIVITY (last 15) ===")
acts, _ = api_get('activity_log', f'org_id=eq.{ORG}&select=action_type,description,created_at&order=created_at.desc&limit=15')
for a in acts:
    print(f"  [{a['created_at']}] {a['action_type']}: {a['description'][:120]}")

# 3. PowerSend servers
print("\n=== POWERSEND SERVERS ===")
srvs, _ = api_get('powersend_servers', f'org_id=eq.{ORG}&select=id,name,domain_name,status')
for s in srvs:
    print(f"  {s['name']} ({s['domain_name']}) - {s['status']} - id:{s['id']}")

# 4. Check pool mailboxes for those servers
print("\n=== POOL MAILBOXES ===")
for s in srvs:
    mbs, cnt = api_get('server_mailboxes', f'server_id=eq.{s["id"]}&select=id,email,smtp_host,status,warmup_enabled,warmup_phase&limit=5')
    print(f"  Server {s['name']}: {cnt} mailboxes")
    for m in mbs[:3]:
        print(f"    {m['email']} - status:{m.get('status')} warmup_phase:{m.get('warmup_phase')}")

# 5. Check subscription_status
print("\n=== ORG SUBSCRIPTION ===")
orgs, _ = api_get('organizations', f'id=eq.{ORG}&select=subscription_status,plan_tier,smart_sending_enabled,ai_usage_limit,ai_usage_current')
print(f"  {json.dumps(orgs[0] if orgs else 'NOT FOUND')}")
