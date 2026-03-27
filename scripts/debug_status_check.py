#!/usr/bin/env python3
"""Quick status check + look for recent activity."""
import json, urllib.request, time
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "count=exact"}

def get(path):
    for attempt in range(3):
        try:
            req = urllib.request.Request(f"{URL}/{path}", headers=H)
            resp = urllib.request.urlopen(req)
            count_header = resp.headers.get("Content-Range", "")
            data = json.loads(resp.read())
            return data, count_header
        except:
            if attempt < 2: time.sleep(1)
            else: raise

ORG = "64209895-565d-4974-9d41-3f39d1a1b467"
CAMPAIGN = "2f6e8eee-e1c0-4b16-bcae-0f23ca52a235"

# Status counts with exact count
print("=== Campaign Stats ===")
camp, _ = get(f"campaigns?id=eq.{CAMPAIGN}&select=sent_count,bounce_count,open_count,reply_count,total_leads,status")
for k, v in camp[0].items():
    print(f"  {k}: {v}")

# Recipients by status (with exact counts)
for status in ["active", "completed", "bounced", "replied"]:
    _, cr = get(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.{status}&select=id&limit=1")
    print(f"  recipients {status}: {cr}")

# Recent activity (all types)
print(f"\n=== Recent activity_log (last 20) ===")
H2 = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
req = urllib.request.Request(f"{URL}/activity_log?org_id=eq.{ORG}&order=created_at.desc&limit=20&select=created_at,action_type,description", headers=H2)
acts = json.loads(urllib.request.urlopen(req).read())
for a in acts:
    print(f"  {a.get('created_at','')[:19]} | {a.get('action_type','')} | {a.get('description','')[:80]}")

# Check recent sent emails (in last 2 minutes)
print(f"\n=== email_sent in last 5 min ===")
cutoff = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(time.time() - 300))
req = urllib.request.Request(f"{URL}/activity_log?org_id=eq.{ORG}&action_type=eq.email_sent&created_at=gte.{cutoff}&select=created_at&order=created_at.desc&limit=10", headers=H2)
recent = json.loads(urllib.request.urlopen(req).read())
print(f"  Recent sends: {len(recent)}")
for r in recent:
    print(f"  {r.get('created_at','')[:19]}")

# Check bounced recipients for patterns - get lead_ids
print(f"\n=== Sample bounced recipients ===")
req = urllib.request.Request(f"{URL}/campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.bounced&limit=5&select=lead_id,last_sent_at,created_at", headers=H2)
bounced = json.loads(urllib.request.urlopen(req).read())
for b in bounced:
    print(f"  lead_id: {b['lead_id'][:8]}... last_sent: {b.get('last_sent_at')} created: {b.get('created_at','')[:19]}")
