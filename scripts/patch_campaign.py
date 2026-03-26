#!/usr/bin/env python3
"""Patch the 'new demo' campaign to add missing recipients."""
import json
import os
import urllib.request
import sys
from pathlib import Path

# Load .env file
env_path = Path(__file__).resolve().parent.parent / ".env"
for line in env_path.read_text().splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        key, _, val = line.partition("=")
        os.environ[key.strip()] = val.strip().strip('"')

SUPABASE_URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co"
API_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CAMPAIGN_ID = "2f6e8eee-e1c0-4b16-bcae-0f23ca52a235"

HEADERS = {
    "apikey": API_KEY,
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

def supabase_get(path):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS)
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode())

def supabase_post(path, data, extra_headers=None):
    h = {**HEADERS}
    if extra_headers:
        h.update(extra_headers)
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        data=json.dumps(data).encode(),
        method="POST",
        headers=h,
    )
    return urllib.request.urlopen(req)

def supabase_patch(path, data):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        data=json.dumps(data).encode(),
        method="PATCH",
        headers=HEADERS,
    )
    return urllib.request.urlopen(req)


# Step 1: Get campaign data
print("=== Step 1: Fetch campaign lead_ids ===")
campaign = supabase_get(f"campaigns?select=lead_ids,org_id,total_leads&id=eq.{CAMPAIGN_ID}")[0]
all_lead_ids = set(campaign["lead_ids"])
org_id = campaign["org_id"]
print(f"  Org ID: {org_id}")
print(f"  Total lead_ids on campaign row: {len(all_lead_ids)}")

# Step 2: Get existing recipients (paginate)
print("=== Step 2: Fetch existing recipients ===")
existing_ids = set()
offset = 0
while True:
    page = supabase_get(
        f"campaign_recipients?campaign_id=eq.{CAMPAIGN_ID}&select=lead_id&offset={offset}&limit=1000"
    )
    if not page:
        break
    for r in page:
        existing_ids.add(r["lead_id"])
    offset += len(page)
    if len(page) < 1000:
        break
print(f"  Existing recipients: {len(existing_ids)}")

# Step 3: Find missing
missing = list(all_lead_ids - existing_ids)
print(f"=== Step 3: Missing recipients: {len(missing)} ===")

if not missing:
    print("Nothing to do!")
    sys.exit(0)

# Step 4: Insert missing in batches
print("=== Step 4: Insert missing recipients ===")
BATCH = 200
inserted = 0
for i in range(0, len(missing), BATCH):
    batch = missing[i : i + BATCH]
    rows = [
        {
            "org_id": org_id,
            "campaign_id": CAMPAIGN_ID,
            "lead_id": lid,
            "status": "active",
            "current_step": 0,
        }
        for lid in batch
    ]
    try:
        supabase_post("campaign_recipients", rows, {"Prefer": "resolution=ignore-duplicates"})
        inserted += len(batch)
        print(f"  Batch {i // BATCH + 1}: inserted {len(batch)} (total: {inserted})")
    except Exception as e:
        body = e.read().decode() if hasattr(e, "read") else ""
        print(f"  ERROR batch {i // BATCH + 1}: {e}\n    {body}", file=sys.stderr)

# Step 5: Update total_leads
print("=== Step 5: Update total_leads ===")
supabase_patch(f"campaigns?id=eq.{CAMPAIGN_ID}", {"total_leads": len(all_lead_ids)})
print(f"  Set total_leads = {len(all_lead_ids)}")

# Step 6: Verify
print("=== Step 6: Verify ===")
count = 0
offset = 0
while True:
    page = supabase_get(
        f"campaign_recipients?campaign_id=eq.{CAMPAIGN_ID}&select=id&offset={offset}&limit=1000"
    )
    count += len(page)
    if len(page) < 1000:
        break
    offset += 1000
print(f"  Total recipients now: {count}")
print("=== Done! ===")
