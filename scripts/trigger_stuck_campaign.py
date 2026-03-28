#!/usr/bin/env python3
"""
Manually triggers campaign/email.process events for all unsent recipients
of the "Recruite Usa" campaign. Pure stdlib — no pip dependencies.
"""
import json, os, time, urllib.request, urllib.parse
from pathlib import Path

# Manual .env loading
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), val)

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
INNGEST_KEY  = os.environ["INNGEST_EVENT_KEY"]

def sb_get(path, params=None):
    """Simple Supabase REST GET call."""
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())

# 1. Find the stuck campaign
print("Looking for 'Recruite Usa' campaign...")
campaigns = sb_get("campaigns", {
    "select": "id,org_id,name,status,total_leads,sent_count",
    "name": "ilike.*recruite*",
})
if not campaigns:
    print("No campaign found matching 'Recruite*'")
    exit(1)

campaign = campaigns[0]
print(f"Found: {campaign['name']}  id={campaign['id']}  status={campaign['status']}  sent={campaign.get('sent_count',0)}/{campaign.get('total_leads',0)}")

cid = campaign["id"]
oid = campaign["org_id"]

# 2. Fetch all unsent recipients in pages (skip count query — too slow)
print("Fetching unsent active recipients...")
PAGE = 1000
all_stuck = []
offset = 0
while True:
    page = sb_get("campaign_recipients", {
        "select": "lead_id,current_step",
        "campaign_id": f"eq.{cid}",
        "status": "eq.active",
        "last_sent_at": "is.null",
        "offset": str(offset),
        "limit": str(PAGE),
    })
    if not page:
        break
    all_stuck.extend(page)
    if len(page) < PAGE:
        break
    offset += PAGE

print(f"Fetched {len(all_stuck)} stuck recipients to dispatch")

# 4. Dispatch events via Inngest
INNGEST_URL = f"https://inn.gs/e/{INNGEST_KEY}"
BATCH = 100
dispatched = 0

for i in range(0, len(all_stuck), BATCH):
    batch = all_stuck[i:i+BATCH]
    events = [{
        "name": "campaign/email.process",
        "data": {
            "campaignId": cid,
            "leadId": r["lead_id"],
            "stepIdx": r["current_step"] or 0,
            "orgId": oid,
        }
    } for r in batch]

    req = urllib.request.Request(
        INNGEST_URL,
        data=json.dumps(events).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            dispatched += len(batch)
            print(f"  Dispatched {dispatched}/{len(all_stuck)}")
    except Exception as e:
        print(f"  ERROR batch {i}: {e}")

    time.sleep(0.5)

print(f"\nDone! Dispatched {dispatched} events total.")
print("The campaign-sweep cron will handle any stragglers every 2 minutes.")
