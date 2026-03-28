#!/usr/bin/env python3
"""Deep dive: check campaign_recipients existence, leads for reply emails, unibox FK"""
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

# 1. ALL campaign_recipients globally (any status)
print("=== ALL campaign_recipients (global) ===")
total = get_count("campaign_recipients?select=id&limit=1")
print(f"  Total: {total}")

# By status
for status in ["active", "completed", "bounced", "replied", "queued", "paused"]:
    n = get_count(f"campaign_recipients?status=eq.{status}&select=id&limit=1")
    print(f"  {status}: {n}")
    time.sleep(0.2)

# 2. The one stored unibox_message — full details
print("\n=== The one existing unibox_message ===")
msgs = get(f"unibox_messages?org_id=eq.{ORG}&select=*&limit=5")
for m in msgs:
    print(json.dumps(m, indent=2, default=str))

# 3. Check all notifications for this org (recent)
print("\n=== ALL notifications for Scubi org (last 20) ===")
notifs = get(f"notifications?org_id=eq.{ORG}&order=created_at.desc&limit=20&select=id,title,description,created_at,is_read")
for n in notifs:
    print(f"  {n['created_at'][:19]} | {n.get('title',''):25s} | read={n.get('is_read',''):5} | {n.get('description','')[:70]}")

# 4. Check server_mailboxes with IMAP — all of them
print("\n=== ALL server_mailboxes with IMAP for Scubi ===")
n_imap = get_count(f"server_mailboxes?org_id=eq.{ORG}&imap_host=not.is.null&select=id&limit=1")
print(f"  Total with IMAP: {n_imap}")
n_total = get_count(f"server_mailboxes?org_id=eq.{ORG}&select=id&limit=1")
print(f"  Total mailboxes: {n_total}")

# Sample some with sync_uid > 0
mbs = get(f"server_mailboxes?org_id=eq.{ORG}&imap_host=not.is.null&last_sync_uid=gt.0&select=id,email,last_sync_uid&order=last_sync_uid.desc&limit=10")
print(f"  With sync_uid > 0: {len(mbs)}")
for m in mbs:
    print(f"    uid={m.get('last_sync_uid',0):5d} | {m['email']}")
