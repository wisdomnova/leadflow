#!/usr/bin/env python3
"""Debug why replies aren't showing in Unibox."""
import json, os, urllib.request
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
ORG = "64209895-565d-4974-9d41-3f39d1a1b467"
CAMPAIGN = "2f6e8eee-e1c0-4b16-bcae-0f23ca52a235"


def get(path):
    req = urllib.request.Request(f"{URL}/{path}", headers=H)
    return json.loads(urllib.request.urlopen(req).read())


# 1. Replied recipients
replied = get(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.replied&select=id,lead_id,status")
print(f"=== Replied recipients: {len(replied)} ===")
for r in replied[:5]:
    print(f"  {r}")

# 2. All unibox_messages for this org
msgs = get(f"unibox_messages?org_id=eq.{ORG}&select=id,from_email,subject,direction,lead_id,received_at,account_id&order=received_at.desc&limit=20")
print(f"\n=== Unibox messages for org: {len(msgs)} ===")
for m in msgs[:10]:
    d = m.get("direction", "?")
    e = m.get("from_email", "?")
    lid = m.get("lead_id", "NONE")
    s = (m.get("subject") or "(none)")[:40]
    print(f"  {d:8s} | {e:35s} | lead_id={str(lid):36s} | {s}")

# 3. Server mailboxes IMAP config
mbs = get(f"server_mailboxes?org_id=eq.{ORG}&select=id,email,imap_host,imap_port,last_sync_uid,status&limit=10")
print(f"\n=== Server mailboxes: {len(mbs)} ===")
for mb in mbs[:10]:
    print(f"  {mb['email']:35s} | imap={str(mb.get('imap_host','NONE')):20s} | uid={mb.get('last_sync_uid',0)} | {mb['status']}")

# 4. Check if there are any inbound unibox messages at all (across all orgs)
all_inbound = get("unibox_messages?direction=eq.inbound&select=id,org_id,from_email,lead_id&limit=5")
print(f"\n=== All inbound unibox_messages (global): {len(all_inbound)} ===")
for m in all_inbound:
    print(f"  org={m.get('org_id','?')} | {m.get('from_email','?')} | lead={m.get('lead_id','?')}")

# 5. Check reply_count on campaign
camp = get(f"campaigns?id=eq.{CAMPAIGN}&select=reply_count,total_leads,status")
print(f"\n=== Campaign stats ===")
print(f"  {camp}")

# 6. Check campaign_recipients columns (get one row to see all fields)
sample = get(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&select=*&limit=1")
print(f"\n=== campaign_recipients columns ===")
if sample:
    print(f"  {list(sample[0].keys())}")

# 7. Check if there are ANY recipients with status != active
all_statuses = get(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=neq.active&select=id,status,lead_id&limit=20")
print(f"\n=== Non-active recipients: {len(all_statuses)} ===")
for r in all_statuses[:10]:
    print(f"  {r}")
