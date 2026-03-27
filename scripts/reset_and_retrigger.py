#!/usr/bin/env python3
"""
Reset the 'new demo' campaign:
1. Set campaign status back to 'running'
2. Reset all falsely-bounced recipients (bounced but never sent) back to 'active'
3. Recalculate bounce_count from actual bounces only
4. Re-trigger Inngest events for all active unsent recipients
"""
import json, urllib.request, time
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

SUPA_URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json", "Prefer": "return=minimal"}
H_JSON = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
INNGEST_EVENT_KEY = env["INNGEST_EVENT_KEY"]
ORG = "64209895-565d-4974-9d41-3f39d1a1b467"
CAMPAIGN = "2f6e8eee-e1c0-4b16-bcae-0f23ca52a235"

def patch(path, body):
    data = json.dumps(body).encode()
    for _ in range(3):
        try:
            req = urllib.request.Request(SUPA_URL + "/" + path, data=data, headers=H, method="PATCH")
            urllib.request.urlopen(req)
            return True
        except Exception as e:
            print("  PATCH error: " + str(e))
            time.sleep(1)
    return False

def get(path):
    for _ in range(3):
        try:
            req = urllib.request.Request(SUPA_URL + "/" + path, headers=H_JSON)
            return json.loads(urllib.request.urlopen(req).read())
        except Exception as e:
            print("  GET error: " + str(e))
            time.sleep(1)
    return []

def get_all(path):
    results = []
    offset = 0
    while True:
        sep = "&" if "?" in path else "?"
        page = get(path + sep + "offset=" + str(offset) + "&limit=1000")
        results.extend(page)
        if len(page) < 1000:
            break
        offset += 1000
    return results

def send_inngest_events(events):
    url = "https://inn.gs/e/" + INNGEST_EVENT_KEY
    data = json.dumps(events).encode()
    for _ in range(3):
        try:
            req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
            resp = urllib.request.urlopen(req)
            return json.loads(resp.read())
        except Exception as e:
            print("  Inngest error: " + str(e))
            time.sleep(2)
    return None

# Step 1: Reset campaign status to running
print("Step 1: Reset campaign status to running...")
ok = patch("campaigns?id=eq." + CAMPAIGN, {"status": "running"})
print("  Done: " + str(ok))

# Step 2: Reset falsely-bounced recipients (bounced + never sent) back to active
print("\nStep 2: Reset falsely-bounced recipients...")
# These are recipients that were marked 'bounced' but have last_sent_at=null (never actually sent)
ok = patch(
    "campaign_recipients?campaign_id=eq." + CAMPAIGN + "&status=eq.bounced&last_sent_at=is.null",
    {"status": "active", "next_send_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
)
print("  Done: " + str(ok))

# Step 3: Recalculate bounce_count (only recipients that actually bounced after sending)
print("\nStep 3: Recalculate bounce_count...")
# Count recipients that are bounced AND have last_sent_at (legitimately bounced)
req = urllib.request.Request(
    SUPA_URL + "/campaign_recipients?campaign_id=eq." + CAMPAIGN + "&status=eq.bounced&last_sent_at=not.is.null&select=id&limit=1",
    headers={**H_JSON, "Prefer": "count=exact"}
)
resp = urllib.request.urlopen(req)
cr = resp.headers.get("Content-Range", "")
actual_bounces = 0
if "/" in cr:
    actual_bounces = int(cr.split("/")[1])
print("  Actual bounces (sent + bounced): " + str(actual_bounces))

# Update campaign bounce_count
ok = patch("campaigns?id=eq." + CAMPAIGN, {"bounce_count": actual_bounces})
print("  Updated bounce_count: " + str(ok))

# Step 4: Get all active unsent recipients and re-trigger
print("\nStep 4: Re-trigger active unsent recipients...")
stuck = get_all("campaign_recipients?campaign_id=eq." + CAMPAIGN + "&status=eq.active&last_sent_at=is.null&select=lead_id")
print("  Found " + str(len(stuck)) + " recipients to re-trigger")

if stuck:
    events = []
    for r in stuck:
        events.append({
            "name": "campaign/email.process",
            "data": {
                "campaignId": CAMPAIGN,
                "leadId": r["lead_id"],
                "stepIdx": 0,
                "orgId": ORG
            }
        })
    
    BATCH = 100
    total_sent = 0
    for i in range(0, len(events), BATCH):
        batch = events[i:i+BATCH]
        result = send_inngest_events(batch)
        if result is not None:
            total_sent += len(batch)
            print("  Batch %d: %d events (total: %d/%d)" % (i//BATCH + 1, len(batch), total_sent, len(events)))
        else:
            print("  ERROR on batch %d" % (i//BATCH + 1))
            break
    
    print("\nDone! Re-triggered " + str(total_sent) + " events.")
else:
    print("  No stuck recipients found.")

# Final status
print("\n=== Final Campaign Status ===")
camp = get("campaigns?id=eq." + CAMPAIGN + "&select=status,sent_count,bounce_count,total_leads")
if camp:
    for k, v in camp[0].items():
        print("  " + str(k) + ": " + str(v))
