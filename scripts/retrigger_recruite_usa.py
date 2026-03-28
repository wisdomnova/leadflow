#!/usr/bin/env python3
"""Re-trigger stuck 'Recruite Usa' campaign by dispatching Inngest events directly"""
import json, urllib.request, time, sys
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

SUPA_URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
INNGEST_KEY = env["INNGEST_EVENT_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
CID = "c7a43dd6-b673-438b-9561-2da6046fd96f"
ORG = "64209895-565d-4974-9d41-3f39d1a1b467"

def get(path):
    req = urllib.request.Request(SUPA_URL + "/" + path, headers=H)
    return json.loads(urllib.request.urlopen(req).read())

# 1. Get all stuck recipients (active, never sent)
print("Fetching stuck recipients...")
all_stuck = []
page = 0
PAGE_SIZE = 1000
while True:
    data = get(f"campaign_recipients?campaign_id=eq.{CID}&status=eq.active&last_sent_at=is.null&select=lead_id,current_step&offset={page * PAGE_SIZE}&limit={PAGE_SIZE}")
    if not data:
        break
    all_stuck.extend(data)
    print(f"  Fetched {len(all_stuck)} so far...")
    if len(data) < PAGE_SIZE:
        break
    page += 1
    time.sleep(0.3)

print(f"\nTotal stuck recipients: {len(all_stuck)}")

if not all_stuck:
    print("No stuck recipients. Exiting.")
    sys.exit(0)

# 2. Dispatch events via Inngest Event API in batches
INNGEST_URL = f"https://inn.gs/e/{INNGEST_KEY}"
BATCH = 100
dispatched = 0

print(f"\nDispatching {len(all_stuck)} events in batches of {BATCH}...")

for i in range(0, len(all_stuck), BATCH):
    batch = all_stuck[i:i+BATCH]
    events = []
    for r in batch:
        events.append({
            "name": "campaign/email.process",
            "data": {
                "campaignId": CID,
                "leadId": r["lead_id"],
                "stepIdx": r.get("current_step", 0),
                "orgId": ORG
            }
        })
    
    body = json.dumps(events).encode()
    req = urllib.request.Request(INNGEST_URL, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        resp = urllib.request.urlopen(req)
        status = resp.getcode()
        dispatched += len(batch)
        if (i // BATCH) % 10 == 0:
            print(f"  Batch {i//BATCH + 1}: dispatched {dispatched}/{len(all_stuck)} (HTTP {status})")
    except Exception as e:
        print(f"  ERROR at batch {i//BATCH + 1}: {e}")
        # Rate limit? Wait and retry
        time.sleep(5)
        try:
            resp = urllib.request.urlopen(req)
            dispatched += len(batch)
            print(f"  Retry OK: dispatched {dispatched}/{len(all_stuck)}")
        except Exception as e2:
            print(f"  RETRY FAILED: {e2}")
            break
    
    time.sleep(0.2)  # Small delay between batches

print(f"\nDone! Dispatched {dispatched}/{len(all_stuck)} events")
print(f"With throttle=30/min, expect ~30 sends/minute")
print(f"Estimated time: ~{len(all_stuck)/30:.0f} minutes ({len(all_stuck)/30/60:.1f} hours)")
