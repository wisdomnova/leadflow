#!/usr/bin/env python3
"""Manually patch the detected reply that failed to store due to the old CHECK constraint."""
import json, urllib.request
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
LEAD_ID = "fbd1b347-39aa-446e-b28f-2ba97b4e3bd2"
FROM_EMAIL = "l.kleemann@mso-digital.de"
REPLY_AT = "2026-03-26T19:49:29.816197+00:00"
SUBJECT = "Nachricht wird nicht weitergeleitet - Out of Office!"


def get(path):
    req = urllib.request.Request(f"{URL}/{path}", headers=H)
    return json.loads(urllib.request.urlopen(req).read())


def patch(path, data):
    req = urllib.request.Request(f"{URL}/{path}", data=json.dumps(data).encode(), method="PATCH", headers=H)
    resp = urllib.request.urlopen(req)
    return resp.status


def post(path, data, extra=None):
    h = {**H}
    if extra:
        h.update(extra)
    req = urllib.request.Request(f"{URL}/{path}", data=json.dumps(data).encode(), method="POST", headers=h)
    resp = urllib.request.urlopen(req)
    return resp.status


# 1. Find the campaign_recipient for this lead
print("=== Step 1: Find recipient ===")
recip = get(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&lead_id=eq.{LEAD_ID}&select=id,status,replies")
print(f"  Found: {recip}")

if recip:
    rid = recip[0]["id"]
    print(f"\n=== Step 2: Update recipient to replied ===")
    status = patch(f"campaign_recipients?id=eq.{rid}", {
        "status": "replied",
        "replied_at": REPLY_AT,
        "replies": (recip[0].get("replies") or 0) + 1,
    })
    print(f"  PATCH status: {status}")
else:
    print("  No recipient found!")

# 2. Insert unibox_message
print(f"\n=== Step 3: Insert unibox_message ===")
import uuid

msg_id = f"<patched-reply-{uuid.uuid4()}@leadflow>"
status = post("unibox_messages", {
    "org_id": ORG,
    "lead_id": LEAD_ID,
    "message_id": msg_id,
    "from_email": FROM_EMAIL,
    "subject": SUBJECT,
    "snippet": "Vielen Dank für Ihre Nachricht. Ich bin derzeit nicht im Büro. (Out of Office)",
    "received_at": REPLY_AT,
    "is_read": False,
    "direction": "inbound",
    "sender_name": "L. Kleemann",
}, {"Prefer": "resolution=ignore-duplicates"})
print(f"  POST status: {status}")

# 3. Update lead status
print(f"\n=== Step 4: Update lead status ===")
status = patch(f"leads?id=eq.{LEAD_ID}", {
    "status": "replied",
    "last_message_received_at": REPLY_AT,
})
print(f"  PATCH status: {status}")

# 4. Verify
print(f"\n=== Verify ===")
msgs = get(f"unibox_messages?org_id=eq.{ORG}&direction=eq.inbound&select=id,from_email,subject,lead_id&limit=5")
print(f"  Unibox inbound for org: {len(msgs)}")
for m in msgs:
    print(f"    {m['from_email']} | {m.get('subject','')[:40]}")

recip2 = get(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&lead_id=eq.{LEAD_ID}&select=id,status,replied_at")
print(f"  Recipient: {recip2}")
