#!/usr/bin/env python3
"""Check what's bouncing."""
import json, urllib.request, time
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
ORG = "64209895-565d-4974-9d41-3f39d1a1b467"
CAMPAIGN = "2f6e8eee-e1c0-4b16-bcae-0f23ca52a235"

def get(path):
    for attempt in range(3):
        try:
            req = urllib.request.Request(f"{URL}/{path}", headers=H)
            return json.loads(urllib.request.urlopen(req).read())
        except:
            if attempt < 2: time.sleep(1)
            else: raise

# 1. Recent email failures
print("=== Recent email_failed entries ===")
fails = get(f"activity_log?org_id=eq.{ORG}&action_type=eq.email_failed&order=created_at.desc&limit=10&select=created_at,description,metadata")
for f in fails:
    desc = f.get("description", "")[:120]
    meta = f.get("metadata", {})
    print(f"  {f.get('created_at','')[:19]} | {desc}")
    if meta.get("error"):
        print(f"    ERROR: {meta['error'][:150]}")
    print()

# 2. Current status breakdown
print("=== Current Status ===")
camp = get(f"campaigns?id=eq.{CAMPAIGN}&select=sent_count,bounce_count,open_count,reply_count,total_leads,status")[0]
for k, v in camp.items():
    print(f"  {k}: {v}")

# 3. Bounce rate
bounced = get(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.bounced&select=id")
completed = get(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.completed&select=id")
active = get(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.active&select=id")
print(f"\n  bounced: {len(bounced)}")
print(f"  completed: {len(completed)}")
print(f"  active: {len(active)}")
total_processed = len(bounced) + len(completed)
if total_processed > 0:
    print(f"  bounce rate: {len(bounced)/total_processed*100:.1f}%")
