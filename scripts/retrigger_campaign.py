#!/usr/bin/env python3
"""
Re-trigger campaign/email.process events for all stuck (active, never-sent) recipients.
Uses the Inngest Event API to send events in batches.
"""
import json, urllib.request
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

SUPABASE_URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
SUPA_KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
SUPA_H = {"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}", "Content-Type": "application/json"}
INNGEST_EVENT_KEY = env["INNGEST_EVENT_KEY"]
ORG = "64209895-565d-4974-9d41-3f39d1a1b467"
CAMPAIGN = "2f6e8eee-e1c0-4b16-bcae-0f23ca52a235"

def supa_get(path, retries=3):
    import time
    for attempt in range(retries):
        try:
            req = urllib.request.Request(f"{SUPABASE_URL}/{path}", headers=SUPA_H)
            return json.loads(urllib.request.urlopen(req).read())
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
            else:
                raise

def supa_get_all(path):
    results = []
    offset = 0
    while True:
        sep = "&" if "?" in path else "?"
        page = supa_get(f"{path}{sep}offset={offset}&limit=1000")
        results.extend(page)
        if len(page) < 1000:
            break
        offset += 1000
    return results

def send_inngest_events(events):
    """Send events to Inngest via the Event API."""
    url = f"https://inn.gs/e/{INNGEST_EVENT_KEY}"
    data = json.dumps(events).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

# 1. Get all active recipients that have never been sent
print("Fetching stuck recipients...")
stuck = supa_get_all(
    f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=eq.active&last_sent_at=is.null"
    f"&select=lead_id"
)
print(f"Found {len(stuck)} stuck recipients (active, never sent)")

if not stuck:
    print("No stuck recipients found. Exiting.")
    exit(0)

# 2. Build Inngest events
all_events = []
for r in stuck:
    all_events.append({
        "name": "campaign/email.process",
        "data": {
            "campaignId": CAMPAIGN,
            "leadId": r["lead_id"],
            "stepIdx": 0,
            "orgId": ORG
        }
    })

# 3. Send in batches of 100 (Inngest API limit)
BATCH_SIZE = 100
total_sent = 0
for i in range(0, len(all_events), BATCH_SIZE):
    batch = all_events[i:i+BATCH_SIZE]
    try:
        result = send_inngest_events(batch)
        total_sent += len(batch)
        print(f"  Sent batch {i//BATCH_SIZE + 1}: {len(batch)} events (total: {total_sent}/{len(all_events)})")
    except Exception as e:
        print(f"  ERROR sending batch {i//BATCH_SIZE + 1}: {e}")
        # Try to read error response body
        if hasattr(e, 'read'):
            try:
                print(f"  Response: {e.read().decode()}")
            except:
                pass
        break

print(f"\nDone! Triggered {total_sent} events for stuck recipients.")
print("Inngest will process them with concurrency=10 over the next few minutes.")
