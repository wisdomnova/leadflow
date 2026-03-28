#!/usr/bin/env python3
import json, urllib.request
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

SUPA_URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
CAMPAIGN = "2f6e8eee-e1c0-4b16-bcae-0f23ca52a235"

def get(path):
    req = urllib.request.Request(SUPA_URL + "/" + path, headers=H)
    return json.loads(urllib.request.urlopen(req).read())

# Recent failures
print("=== Recent email_failed ===")
data = get("activity_log?org_id=eq.64209895-565d-4974-9d41-3f39d1a1b467&action_type=eq.email_failed&order=created_at.desc&limit=10&select=created_at,description")
for d in data:
    print(d["created_at"][:19], "|", d["description"][:120])

# Active recipients sample
print("\n=== Sample active recipients ===")
data2 = get("campaign_recipients?campaign_id=eq." + CAMPAIGN + "&status=eq.active&select=lead_id,last_sent_at,next_send_at&limit=5")
for d in data2:
    print(d)

# Count active with no last_sent_at
print("\n=== Active count ===")
req = urllib.request.Request(
    SUPA_URL + "/campaign_recipients?campaign_id=eq." + CAMPAIGN + "&status=eq.active&last_sent_at=is.null&select=id&limit=1",
    headers={**H, "Prefer": "count=exact"}
)
resp = urllib.request.urlopen(req)
cr = resp.headers.get("Content-Range", "")
print("Active unsent:", cr)
