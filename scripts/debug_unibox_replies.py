#!/usr/bin/env python3
"""Diagnose missing Unibox messages for PowerSend replies"""
import json, urllib.request
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

SUPA_URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}

def get(path):
    req = urllib.request.Request(SUPA_URL + "/" + path, headers=H)
    return json.loads(urllib.request.urlopen(req).read())

def get_count(path):
    req = urllib.request.Request(SUPA_URL + "/" + path, headers={**H, "Prefer": "count=exact"})
    resp = urllib.request.urlopen(req)
    cr = resp.headers.get("Content-Range", "")
    return int(cr.split("/")[1]) if "/" in cr else 0

# 1. Check all organizations
print("=== Organizations ===")
orgs = get("organizations?select=id,name")
for o in orgs:
    print(f"  {o['id']} | {o['name']}")

# 2. For each org, check unibox_messages and leads
for org in orgs:
    oid = org["id"]
    print(f"\n=== Org: {org['name']} ({oid}) ===")
    
    # Unibox messages count
    n = get_count(f"unibox_messages?org_id=eq.{oid}&select=id&limit=1")
    print(f"  unibox_messages: {n}")
    
    # Messages with lead_id
    n2 = get_count(f"unibox_messages?org_id=eq.{oid}&lead_id=not.is.null&select=id&limit=1")
    print(f"  unibox_messages with lead_id: {n2}")
    
    # Messages without lead_id
    n3 = get_count(f"unibox_messages?org_id=eq.{oid}&lead_id=is.null&select=id&limit=1")
    print(f"  unibox_messages without lead_id: {n3}")
    
    # Sample messages
    msgs = get(f"unibox_messages?org_id=eq.{oid}&select=id,from_email,subject,direction,lead_id,received_at&order=received_at.desc&limit=10")
    print(f"  Recent messages:")
    for m in msgs:
        print(f"    {m['received_at'][:19]} | {m['direction']:8s} | lead={str(m.get('lead_id',''))[:8]:8s} | {m['from_email']:40s} | {(m['subject'] or '')[:40]}")
    
    # Campaign recipients with status=replied
    replied = get(f"campaign_recipients?select=id,lead_id,status,replied_at&status=eq.replied&limit=20")
    print(f"  Replied recipients: {len(replied)}")
    for r in replied:
        print(f"    lead={str(r.get('lead_id',''))[:8]} | replied_at={r.get('replied_at','')[:19]}")
    
    # Leads with status=replied
    leads_replied = get(f"leads?org_id=eq.{oid}&status=eq.replied&select=id,email,first_name,last_name,status&limit=20")
    print(f"  Leads with status=replied: {len(leads_replied)}")
    for l in leads_replied:
        print(f"    {l['id'][:8]} | {l['email']:40s} | {l.get('first_name','')} {l.get('last_name','')}")

# 3. Check notifications about replies
print("\n=== Reply notifications ===")
notifs = get("notifications?title=eq.New%20Reply%20Received&select=id,title,description,created_at&order=created_at.desc&limit=10")
for n in notifs:
    print(f"  {n['created_at'][:19]} | {n['description'][:80]}")

# 4. Check server mailboxes with IMAP
print("\n=== PowerSend mailboxes with IMAP ===")
mbs = get("server_mailboxes?imap_host=not.is.null&select=id,email,imap_host,last_sync_uid,status,org_id&limit=10")
print(f"  Total with IMAP: {len(mbs)}")
for m in mbs:
    print(f"  {m['email']:40s} | imap={m.get('imap_host',''):20s} | uid={m.get('last_sync_uid',0)} | {m['status']}")
