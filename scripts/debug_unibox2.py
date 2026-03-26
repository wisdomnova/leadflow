#!/usr/bin/env python3
"""Find which mailbox(es) were used for the 'new demo' campaign and check their sync state."""
import json, urllib.request
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
CAMPAIGN = "2f6e8eee-e1c0-4b16-bcae-0f23ca52a235"
ORG = "64209895-565d-4974-9d41-3f39d1a1b467"


def get(path):
    req = urllib.request.Request(f"{URL}/{path}", headers=H)
    return json.loads(urllib.request.urlopen(req).read())


# 1. Get campaign details including which servers were used
camp = get(f"campaigns?id=eq.{CAMPAIGN}&select=*")
print("=== Campaign details ===")
c = camp[0]
for k in ["id", "name", "status", "server_ids", "reply_count", "send_count", "open_count"]:
    print(f"  {k}: {c.get(k)}")

# 2. Check all server mailboxes with their sync UIDs
mbs = get(f"server_mailboxes?org_id=eq.{ORG}&select=id,email,server_id,imap_host,last_sync_uid,status&limit=50")
print(f"\n=== All server mailboxes ({len(mbs)}) ===")
for mb in mbs:
    print(f"  {mb['email']:35s} | server={str(mb.get('server_id','?'))[:8]} | uid={mb.get('last_sync_uid',0)} | {mb['status']}")

# 3. Check activity log for reply events  
acts = get(f"activity_log?org_id=eq.{ORG}&action_type=eq.email.reply&select=id,description,metadata,created_at&order=created_at.desc&limit=5")
print(f"\n=== Reply activity log entries: {len(acts)} ===")
for a in acts:
    print(f"  {a.get('created_at','?')} | {a.get('description','?')}")
    print(f"    metadata: {a.get('metadata','?')}")

# 4. Check if campaign_recipients now supports replied status (verify migration)
print("\n=== Verify migration applied ===")
try:
    import urllib.request as ur
    # Try to filter by replied status - if constraint is fixed, this returns 200
    req = urllib.request.Request(f"{URL}/campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.replied&select=id&limit=1", headers=H)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    print(f"  Query for replied status works! Results: {len(data)}")
except Exception as e:
    print(f"  ERROR: {e}")

# 5. Also try selecting replied_at column
try:
    req = urllib.request.Request(f"{URL}/campaign_recipients?campaign_id=eq.{CAMPAIGN}&select=id,replied_at&limit=1", headers=H)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    print(f"  replied_at column exists! Sample: {data}")
except Exception as e:
    print(f"  replied_at ERROR: {e}")
