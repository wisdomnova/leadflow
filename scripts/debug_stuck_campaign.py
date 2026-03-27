#!/usr/bin/env python3
"""Diagnose why 'new demo' campaign is stuck at 180 sent."""
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


def get(path, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(f"{URL}/{path}", headers=H)
            return json.loads(urllib.request.urlopen(req).read())
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
            else:
                raise


def get_all(path):
    results = []
    offset = 0
    while True:
        sep = "&" if "?" in path else "?"
        page = get(f"{path}{sep}offset={offset}&limit=1000")
        results.extend(page)
        if len(page) < 1000:
            break
        offset += 1000
    return results


# 1. Campaign details
print("=== Campaign Details ===")
camp = get(f"campaigns?id=eq.{CAMPAIGN}&select=*")[0]
for k in ["id", "name", "status", "sent_count", "open_count", "reply_count", "total_leads"]:
    print(f"  {k}: {camp.get(k)}")
print(f"  steps: {json.dumps(camp.get('steps', []))[:200]}")
print(f"  config: {json.dumps(camp.get('config', {}))[:200]}")

# 2. Recipient status distribution
print("\n=== Recipient Status Distribution ===")
recips = get_all(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&select=status,current_step,last_sent_at,next_send_at")
status_counts = {}
for r in recips:
    st = r.get("status", "unknown")
    status_counts[st] = status_counts.get(st, 0) + 1
print(f"  Total recipients: {len(recips)}")
for st, cnt in sorted(status_counts.items(), key=lambda x: -x[1]):
    print(f"  {st:15s}: {cnt}")

# 3. Check recipients that should be sending (active with next_send_at in the past)
print("\n=== Active recipients with past next_send_at ===")
past_due = [r for r in recips if r.get("status") == "active" and r.get("next_send_at")]
from datetime import datetime, timezone
now = datetime.now(timezone.utc)
overdue = []
for r in past_due:
    try:
        nsa = datetime.fromisoformat(r["next_send_at"].replace("Z", "+00:00"))
        if nsa < now:
            overdue.append(r)
    except:
        pass
print(f"  Active recipients with next_send_at set: {len(past_due)}")
print(f"  Overdue (next_send_at in the past): {len(overdue)}")

# 4. Check recipients that have never been sent (active, no last_sent_at)
never_sent = [r for r in recips if r.get("status") == "active" and not r.get("last_sent_at")]
sent_already = [r for r in recips if r.get("last_sent_at")]
print(f"\n=== Send Progress ===")
print(f"  Recipients with last_sent_at (actually sent): {len(sent_already)}")
print(f"  Active recipients never sent: {len(never_sent)}")
print(f"  Current step distribution:")
step_counts = {}
for r in recips:
    cs = r.get("current_step", 0)
    step_counts[cs] = step_counts.get(cs, 0) + 1
for cs, cnt in sorted(step_counts.items()):
    print(f"    step {cs}: {cnt}")

# 5. Sample some never-sent active recipients
if never_sent:
    print(f"\n=== Sample never-sent active recipients (first 5) ===")
    sample = get(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.active&last_sent_at=is.null&select=id,lead_id,status,current_step,next_send_at,created_at&limit=5")
    for s in sample:
        print(f"  {s}")

# 6. Check recent activity log for the campaign
print(f"\n=== Recent Activity Log ===")
acts = get(f"activity_log?org_id=eq.{ORG}&order=created_at.desc&limit=20&select=action_type,description,created_at&metadata->>campaign_id=eq.{CAMPAIGN}")
if not acts:
    # Try without the campaign filter
    acts = get(f"activity_log?org_id=eq.{ORG}&order=created_at.desc&limit=10&select=action_type,description,created_at")
print(f"  Found {len(acts)} entries")
for a in acts[:10]:
    print(f"  {a.get('created_at','')[:19]} | {a.get('action_type','')} | {a.get('description','')[:80]}")

# 7. Check if there are any email_failed entries
print(f"\n=== Email Failures ===")
fails = get(f"activity_log?org_id=eq.{ORG}&action_type=eq.email_failed&order=created_at.desc&limit=5&select=description,created_at,metadata")
print(f"  Found {len(fails)} failures")
for f in fails[:5]:
    print(f"  {f.get('created_at','')[:19]} | {f.get('description','')[:100]}")
