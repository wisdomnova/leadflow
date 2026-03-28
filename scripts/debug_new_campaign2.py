#!/usr/bin/env python3
"""Check campaign config fields and Inngest dispatch status"""
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
CID = "c7a43dd6-b673-438b-9561-2da6046fd96f"
ORG = "64209895-565d-4974-9d41-3f39d1a1b467"

def get(path):
    for i in range(3):
        try:
            req = urllib.request.Request(SUPA_URL + "/" + path, headers=H)
            return json.loads(urllib.request.urlopen(req).read())
        except Exception as e:
            if i < 2: time.sleep(2)
            else: print(f"  ERROR: {e}"); return []

# Get ALL campaign fields
print("=== Full campaign record ===")
camp = get(f"campaigns?id=eq.{CID}&select=*")
if camp:
    c = camp[0]
    # Print every key
    for k, v in sorted(c.items()):
        if k in ('lead_ids', 'steps', 'sequence_steps'):
            if isinstance(v, list):
                print(f"  {k}: [{len(v)} items]")
            else:
                print(f"  {k}: {str(v)[:100]}")
        else:
            print(f"  {k}: {v}")

# Check if Inngest events exist (campaign_launched, etc.)
print(f"\n=== Activity log for THIS campaign ===")
acts = get(f"activity_log?org_id=eq.{ORG}&metadata->>campaign_id=eq.{CID}&order=created_at.desc&limit=20&select=created_at,action_type,description,metadata")
if acts:
    for a in acts:
        print(f"  {a['created_at'][:19]} | {a.get('action_type',''):25s} | {a.get('description','')[:80]}")
else:
    print("  No activity for this campaign")

# Check for campaign_launched activity
print(f"\n=== Campaign launched activity ===")
launched = get(f"activity_log?org_id=eq.{ORG}&action_type=eq.campaign_launched&order=created_at.desc&limit=5&select=created_at,description,metadata")
for l in launched:
    print(f"  {l['created_at'][:19]} | {l.get('description','')[:100]}")
    print(f"    metadata: {json.dumps(l.get('metadata',''))[:200]}")

# Check the campaign's steps vs sequence_steps
print(f"\n=== Campaign steps ===")
if camp:
    c = camp[0]
    steps = c.get('steps') or []
    seq = c.get('sequence_steps') or []
    print(f"  steps: {len(steps)} items")
    for i, s in enumerate(steps[:3]):
        print(f"    [{i}] subject: {s.get('subject','')[:50]}, delay: {s.get('delay_days', s.get('delay',''))}")
    print(f"  sequence_steps: {len(seq)} items")
    for i, s in enumerate(seq[:3]):
        print(f"    [{i}] subject: {s.get('subject','')[:50]}, delay: {s.get('delay_days', s.get('delay',''))}")

# Check recipients with Inngest event tracking
print(f"\n=== Recipients with events dispatched? ===")
recips_with_sent = get(f"campaign_recipients?campaign_id=eq.{CID}&last_sent_at=not.is.null&select=id&limit=1")
print(f"  Recipients with last_sent_at set: {len(recips_with_sent)}")

# Check if there's a campaign_schedule or similar
print(f"\n=== Campaign schedule/timing fields ===")
if camp:
    c = camp[0]
    for k in ['schedule', 'send_schedule', 'timezone', 'daily_limit', 
              'use_powersend', 'powersend_config', 'powersend_server_ids',
              'sender_ids', 'sender_id', 'start_date', 'end_date',
              'schedule_type', 'sending_days', 'sending_hours', 'sending_window']:
        if k in c:
            print(f"  {k}: {json.dumps(c[k])[:200]}")
        else:
            print(f"  {k}: <NOT IN RECORD>")
