#!/usr/bin/env python3
"""Check if leads/unibox_messages were cascade-deleted when campaign was deleted"""
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

# Check total leads for the org
print("=== Leads count ===")
n = get_count(f"leads?org_id=eq.{ORG}&select=id&limit=1")
print(f"  Total leads: {n}")
time.sleep(0.3)

# Check specific reply emails
reply_emails = [
    "adriana@online-digitalx.de",
    "marvin.ronsdorf@apollo18.com",
    "ralf@seybold.de",
    "elisabeth@ferrisbuehler.com",
    "pascal.macek@go2flow.ch",
    "l.kleemann@mso-digital.de",
]

print("\n=== Checking specific reply emails in leads ===")
for email in reply_emails:
    leads = get(f"leads?org_id=eq.{ORG}&email=eq.{email}&select=id,email,status,first_name,last_name")
    if leads:
        for l in leads:
            print(f"  FOUND: {l['email']:40s} | status={l.get('status',''):15s} | {l['id'][:8]}")
    else:
        print(f"  MISSING: {email}")
    time.sleep(0.2)

# Check ALL unibox_messages (not just this org)
print("\n=== ALL unibox_messages globally ===")
all_msgs = get(f"unibox_messages?select=id,org_id,from_email,lead_id,received_at,direction&order=received_at.desc&limit=20")
print(f"  Count: {len(all_msgs)}")
for m in all_msgs:
    lid = str(m.get("lead_id", "") or "")[:8]
    print(f"  {m['received_at'][:19]} | org={m['org_id'][:8]} | lead={lid:8s} | {m['from_email']:40s} | {m.get('direction','?')}")

time.sleep(0.3)

# Check notifications with URL-encoded title
print("\n=== Reply notifications ===")
notifs = get(f"notifications?org_id=eq.{ORG}&title=eq.New%20Reply%20Received&select=id,description,created_at,is_read&order=created_at.desc&limit=10")
print(f"  Count: {len(notifs)}")
for n in notifs:
    print(f"  {n['created_at'][:19]} | read={n.get('is_read','')} | {n['description'][:80]}")

# Check campaigns across ALL orgs
print("\n=== All campaigns (all orgs) ===")
camps = get("campaigns?select=id,org_id,name,status,sent_count,total_leads&order=created_at.desc&limit=10")
for c in camps:
    print(f"  org={c['org_id'][:8]} | {c['id'][:8]} | {c.get('name',''):20s} | {c.get('status',''):12s} | sent={c.get('sent_count',0)}/{c.get('total_leads',0)}")
