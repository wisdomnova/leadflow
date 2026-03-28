#!/usr/bin/env python3
"""Diagnose missing Unibox messages for PowerSend replies - focused on Scubi org"""
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

def get(path, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(SUPA_URL + "/" + path, headers=H)
            return json.loads(urllib.request.urlopen(req).read())
        except Exception as e:
            if i < retries - 1:
                time.sleep(2)
            else:
                print(f"  ERROR: {e}")
                return []

def get_count(path, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(SUPA_URL + "/" + path, headers={**H, "Prefer": "count=exact"})
            resp = urllib.request.urlopen(req)
            cr = resp.headers.get("Content-Range", "")
            return int(cr.split("/")[1]) if "/" in cr else 0
        except Exception as e:
            if i < retries - 1:
                time.sleep(2)
            else:
                print(f"  ERROR: {e}")
                return -1

# 1. Unibox messages
print("=== Unibox Messages (Scubi org) ===")
total = get_count(f"unibox_messages?org_id=eq.{ORG}&select=id&limit=1")
print(f"  Total: {total}")

with_lead = get_count(f"unibox_messages?org_id=eq.{ORG}&lead_id=not.is.null&select=id&limit=1")
print(f"  With lead_id: {with_lead}")

without_lead = get_count(f"unibox_messages?org_id=eq.{ORG}&lead_id=is.null&select=id&limit=1")
print(f"  Without lead_id: {without_lead}")

time.sleep(0.5)

# 2. Recent messages
print("\n=== Recent unibox_messages ===")
msgs = get(f"unibox_messages?org_id=eq.{ORG}&select=id,from_email,subject,direction,lead_id,received_at,account_id&order=received_at.desc&limit=20")
for m in msgs:
    lid = str(m.get("lead_id", "") or "")[:8]
    print(f"  {m['received_at'][:19]} | {m.get('direction','?'):8s} | lead={lid:8s} | {m['from_email']:40s} | {(m.get('subject','') or '')[:40]}")

time.sleep(0.5)

# 3. Campaign recipients with status=replied
print("\n=== Campaign recipients (replied) ===")
replied = get(f"campaign_recipients?status=eq.replied&select=id,lead_id,campaign_id,replied_at,last_sent_at&limit=20")
print(f"  Count: {len(replied)}")
for r in replied:
    print(f"  lead={str(r.get('lead_id',''))[:8]} | campaign={str(r.get('campaign_id',''))[:8]} | replied={r.get('replied_at','')[:19]} | sent={str(r.get('last_sent_at',''))[:19]}")

time.sleep(0.5)

# 4. Leads with status=replied
print("\n=== Leads with status=replied ===")
leads = get(f"leads?org_id=eq.{ORG}&status=eq.replied&select=id,email,first_name,last_name&limit=20")
print(f"  Count: {len(leads)}")
for l in leads:
    print(f"  {l['id'][:8]} | {l['email']:40s} | {l.get('first_name','')} {l.get('last_name','')}")

time.sleep(0.5)

# 5. Notifications about replies
print("\n=== Reply notifications ===")
notifs = get(f"notifications?org_id=eq.{ORG}&title=eq.New Reply Received&select=id,description,created_at,is_read&order=created_at.desc&limit=10")
print(f"  Count: {len(notifs)}")
for n in notifs:
    print(f"  {n['created_at'][:19]} | read={n.get('is_read','')} | {n['description'][:80]}")

time.sleep(0.5)

# 6. PowerSend mailboxes with IMAP
print("\n=== PowerSend mailboxes with IMAP ===")
mbs = get(f"server_mailboxes?org_id=eq.{ORG}&imap_host=not.is.null&select=id,email,imap_host,last_sync_uid,status&order=email&limit=10")
print(f"  Count: {len(mbs)}")
for m in mbs:
    print(f"  {m['email']:40s} | imap={m.get('imap_host',''):20s} | uid={m.get('last_sync_uid',0)} | {m['status']}")

# 7. Check if campaigns still exist for this org
print("\n=== Campaigns (Scubi org) ===")
camps = get(f"campaigns?org_id=eq.{ORG}&select=id,name,status,sent_count,total_leads&order=created_at.desc&limit=5")
print(f"  Count: {len(camps)}")
for c in camps:
    print(f"  {c['id'][:8]} | {c.get('name',''):20s} | {c.get('status',''):12s} | sent={c.get('sent_count',0)} / {c.get('total_leads',0)}")

# 8. All email accounts for this org
print("\n=== Email accounts (Scubi org) ===")
accs = get(f"email_accounts?org_id=eq.{ORG}&select=id,email,provider,status,last_sync_at&limit=10")
print(f"  Count: {len(accs)}")
for a in accs:
    print(f"  {a['id'][:8]} | {a.get('email',''):30s} | {a.get('provider',''):10s} | {a.get('status','')} | sync={str(a.get('last_sync_at',''))[:19]}")
