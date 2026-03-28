#!/usr/bin/env python3
"""Diagnose why 'Recruite Usa' campaign has 0 sent"""
import json, urllib.request, time
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

SUPA_URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
ORG = "64209895-565d-4974-9d41-3f39d1a1b467"

def get(path):
    for i in range(3):
        try:
            req = urllib.request.Request(SUPA_URL + "/" + path, headers=H)
            return json.loads(urllib.request.urlopen(req).read())
        except Exception as e:
            if i < 2: time.sleep(2)
            else: print(f"  ERROR: {e}"); return []

def get_count(path):
    for i in range(3):
        try:
            req = urllib.request.Request(SUPA_URL + "/" + path, headers={**H, "Prefer": "count=exact"})
            resp = urllib.request.urlopen(req)
            cr = resp.headers.get("Content-Range", "")
            return int(cr.split("/")[1]) if "/" in cr else 0
        except Exception as e:
            if i < 2: time.sleep(2)
            else: print(f"  ERROR: {e}"); return -1

# 1. Find the campaign
print("=== Campaigns for Scubi ===")
camps = get(f"campaigns?org_id=eq.{ORG}&select=*&order=created_at.desc&limit=5")
for c in camps:
    print(f"  ID: {c['id']}")
    print(f"  Name: {c.get('name')}")
    print(f"  Status: {c.get('status')}")
    print(f"  Created: {c.get('created_at','')[:19]}")
    print(f"  sent_count: {c.get('sent_count')}")
    print(f"  bounce_count: {c.get('bounce_count')}")
    print(f"  open_count: {c.get('open_count')}")
    print(f"  reply_count: {c.get('reply_count')}")
    print(f"  total_leads: {c.get('total_leads')}")
    print(f"  sending_account_id: {c.get('sending_account_id')}")
    print(f"  smart_server_id: {c.get('smart_server_id')}")
    print(f"  sending_mode: {c.get('sending_mode')}")
    # Print sequence steps
    steps = c.get('sequence_steps') or c.get('steps') or []
    print(f"  sequence_steps: {json.dumps(steps)[:200] if steps else 'NONE'}")
    # Print lead_ids field
    lead_ids = c.get('lead_ids')
    if lead_ids:
        print(f"  lead_ids: {len(lead_ids)} ids (first: {lead_ids[0][:8] if lead_ids else 'none'})")
    else:
        print(f"  lead_ids: {lead_ids}")
    print()

if not camps:
    print("  No campaigns found!")
    exit()

campaign = camps[0]
CID = campaign["id"]
time.sleep(0.3)

# 2. Campaign recipients
print(f"=== Recipients for campaign {CID[:8]} ===")
for status in ["active", "completed", "bounced", "replied", "queued", "paused"]:
    n = get_count(f"campaign_recipients?campaign_id=eq.{CID}&status=eq.{status}&select=id&limit=1")
    print(f"  {status}: {n}")
    time.sleep(0.2)

total_recip = get_count(f"campaign_recipients?campaign_id=eq.{CID}&select=id&limit=1")
print(f"  TOTAL: {total_recip}")
time.sleep(0.3)

# 3. Sample recipients
print(f"\n=== Sample recipients ===")
samples = get(f"campaign_recipients?campaign_id=eq.{CID}&select=id,lead_id,status,last_sent_at,next_send_at&limit=5&order=created_at.asc")
for s in samples:
    print(f"  {s}")
time.sleep(0.3)

# 4. Recent activity log
print(f"\n=== Recent activity (Scubi) ===")
acts = get(f"activity_log?org_id=eq.{ORG}&order=created_at.desc&limit=15&select=created_at,action_type,description")
for a in acts:
    print(f"  {a['created_at'][:19]} | {a.get('action_type',''):25s} | {a.get('description','')[:80]}")
time.sleep(0.3)

# 5. Check email accounts / smart servers
print(f"\n=== Email accounts ===")
accs = get(f"email_accounts?org_id=eq.{ORG}&select=id,email,provider,status&limit=5")
print(f"  Count: {len(accs)}")
for a in accs:
    print(f"  {a}")

print(f"\n=== Smart servers ===")
servers = get(f"smart_servers?org_id=eq.{ORG}&select=id,name,status,provider&limit=5")
print(f"  Count: {len(servers)}")
for s in servers:
    print(f"  {s['id'][:8]} | {s.get('name',''):20s} | {s.get('status','')} | {s.get('provider','')}")

# 6. Recent email_failed events
print(f"\n=== Recent email_failed ===")
fails = get(f"activity_log?org_id=eq.{ORG}&action_type=eq.email_failed&order=created_at.desc&limit=5&select=created_at,description")
for f in fails:
    print(f"  {f['created_at'][:19]} | {f.get('description','')[:100]}")

# 7. Recent email_sent events
print(f"\n=== Recent email_sent ===")
sents = get(f"activity_log?org_id=eq.{ORG}&action_type=eq.email_sent&order=created_at.desc&limit=5&select=created_at,description")
for s in sents:
    print(f"  {s['created_at'][:19]} | {s.get('description','')[:100]}")
