#!/usr/bin/env python3
"""
After deploying the Unibox sync fix:
1. Reset last_sync_uid on all PowerSend mailboxes so the next cron sync re-processes recent messages
2. Clean up duplicate notifications
"""
import json, urllib.request, time
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

SUPA_URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json", "Prefer": "return=minimal"}
H_JSON = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
ORG = "64209895-565d-4974-9d41-3f39d1a1b467"

def patch(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(SUPA_URL + "/" + path, data=data, headers=H, method="PATCH")
    urllib.request.urlopen(req)

def delete(path):
    req = urllib.request.Request(SUPA_URL + "/" + path, headers=H, method="DELETE")
    urllib.request.urlopen(req)

def get(path):
    req = urllib.request.Request(SUPA_URL + "/" + path, headers=H_JSON)
    return json.loads(urllib.request.urlopen(req).read())

def get_count(path):
    req = urllib.request.Request(SUPA_URL + "/" + path, headers={**H_JSON, "Prefer": "count=exact"})
    resp = urllib.request.urlopen(req)
    cr = resp.headers.get("Content-Range", "")
    return int(cr.split("/")[1]) if "/" in cr else 0

# 1. Reset last_sync_uid on all mailboxes with IMAP for this org
print("Step 1: Reset last_sync_uid on all PowerSend mailboxes...")
patch(
    f"server_mailboxes?org_id=eq.{ORG}&imap_host=not.is.null",
    {"last_sync_uid": 0}
)
print("  Done. All mailboxes will re-sync on next cron run.")

# 2. Clean up duplicate notifications
print("\nStep 2: Count duplicate 'New Reply Received' notifications...")
n = get_count(f"notifications?org_id=eq.{ORG}&title=eq.New%20Reply%20Received&select=id&limit=1")
print(f"  Found {n} 'New Reply Received' notifications")

if n > 0:
    print("  Deleting all — the next sync will re-create them (once each, with dedup)...")
    delete(f"notifications?org_id=eq.{ORG}&title=eq.New%20Reply%20Received")
    print("  Done.")

# 3. Show current state
print("\nStep 3: Current unibox_messages count...")
msg_count = get_count(f"unibox_messages?org_id=eq.{ORG}&select=id&limit=1")
print(f"  unibox_messages: {msg_count}")

lead_count = get_count(f"leads?org_id=eq.{ORG}&select=id&limit=1")
print(f"  Total leads: {lead_count}")

print("\n✓ After deployment, the 15-min cron sync will re-process all mailboxes.")
print("  Each reply from a known lead will be stored in unibox_messages.")
print("  The dedup check will ensure each message is processed only once.")
