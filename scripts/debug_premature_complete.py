#!/usr/bin/env python3
"""Diagnose why campaign completed at 261/2048."""
import json, urllib.request, time
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H_COUNT = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "count=exact"}
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
CAMPAIGN = "2f6e8eee-e1c0-4b16-bcae-0f23ca52a235"

def count(path):
    for _ in range(3):
        try:
            req = urllib.request.Request(f"{URL}/{path}&limit=1", headers=H_COUNT)
            resp = urllib.request.urlopen(req)
            cr = resp.headers.get("Content-Range", "")
            return cr
        except:
            time.sleep(1)
    return "error"

def get(path):
    for _ in range(3):
        try:
            req = urllib.request.Request(f"{URL}/{path}", headers=H)
            return json.loads(urllib.request.urlopen(req).read())
        except:
            time.sleep(1)
    return []

# Campaign stats
camp = get(f"campaigns?id=eq.{CAMPAIGN}&select=status,sent_count,bounce_count,open_count,reply_count,total_leads")[0]
print("=== Campaign ===")
for k, v in camp.items():
    print(f"  {k}: {v}")

# Count by status
print("\n=== Recipients by status ===")
for st in ["active", "completed", "bounced", "replied"]:
    c = count(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.{st}&select=id")
    print(f"  {st}: {c}")

# How many were actually sent vs not?
c1 = count(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&last_sent_at=not.is.null&select=id")
c2 = count(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&last_sent_at=is.null&select=id")
print(f"\n  with last_sent_at: {c1}")
print(f"  NO last_sent_at:   {c2}")

# Bounced but never actually sent
c3 = count(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.bounced&last_sent_at=is.null&select=id")
print(f"  bounced but never sent: {c3}")

# Completed but never sent
c4 = count(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.completed&last_sent_at=is.null&select=id")
print(f"  completed but never sent: {c4}")

# Check activity_log for campaign_completed event
print("\n=== campaign_completed events ===")
events = get(f"activity_log?action_type=eq.campaign_completed&order=created_at.desc&limit=5&select=created_at,description,metadata")
for e in events:
    print(f"  {e}")

# Check email_failed events from today
print("\n=== Recent email_failed events (today) ===")
fails = get(f"activity_log?action_type=eq.email_failed&order=created_at.desc&limit=10&select=created_at,description")
for f in fails:
    print(f"  {f.get('created_at','')[:19]} | {f.get('description','')[:100]}")
print(f"  Total: {len(fails)}")
