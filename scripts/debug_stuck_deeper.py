#!/usr/bin/env python3
"""Deeper diagnosis: check subscription, accounts, and try to understand why events failed."""
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

def get(path):
    req = urllib.request.Request(f"{URL}/{path}", headers=H)
    return json.loads(urllib.request.urlopen(req).read())

# 1. Organization + subscription
print("=== Organization ===")
org = get(f"organizations?id=eq.{ORG}&select=*")[0]
for k, v in org.items():
    print(f"  {k}: {v}")

# 2. Subscription (stripe_subscriptions table if exists)
print("\n=== Subscriptions ===")
try:
    subs = get(f"stripe_subscriptions?org_id=eq.{ORG}&select=*")
    for s in subs:
        print(f"  {s}")
except Exception as e:
    print(f"  No stripe_subscriptions table or error: {e}")

# 3. Email accounts
print("\n=== Email Accounts ===")
accts = get(f"email_accounts?org_id=eq.{ORG}&select=*")
for a in accts:
    print(f"  {a.get('email')} | {a.get('provider')} | {a.get('status')}")

# 4. Campaign sender config
print("\n=== Campaign Sender Config ===")
camp = get(f"campaigns?id=eq.{CAMPAIGN}&select=sender_id,sender_ids,use_powersend,powersend_config,powersend_server_ids")[0]
for k, v in camp.items():
    print(f"  {k}: {v}")

# 5. Analytics daily for this month (to check volume limit)
from datetime import datetime
first_of_month = datetime.now().replace(day=1).strftime("%Y-%m-%d")
print(f"\n=== Analytics Daily (from {first_of_month}) ===")
daily = get(f"analytics_daily?org_id=eq.{ORG}&date=gte.{first_of_month}&select=date,sent_count")
total_sent = sum(d.get("sent_count", 0) for d in daily)
print(f"  Total daily entries: {len(daily)}")
print(f"  Monthly sent total: {total_sent}")
for d in daily:
    print(f"  {d['date']}: {d['sent_count']}")

# 6. Check if "plan_limit_reached" in activity log
print("\n=== Plan Limit Events ===")
limits = get(f"activity_log?org_id=eq.{ORG}&action_type=eq.plan_limit_reached&order=created_at.desc&limit=5&select=created_at,description")
print(f"  Found: {len(limits)}")
for l in limits:
    print(f"  {l}")

# 7. Check campaign_recipients with status completed for timing - when was last send?
print("\n=== Completed Recipients Timing ===")
completed = get(f"campaign_recipients?campaign_id=eq.{CAMPAIGN}&status=in.(completed,replied)&select=last_sent_at&order=last_sent_at.desc&limit=5")
for c in completed:
    print(f"  last_sent_at: {c.get('last_sent_at')}")
    
# 8. Check all activity for the campaign
print("\n=== activity_log: all email_sent for this campaign ===")
email_sent = get(f"activity_log?org_id=eq.{ORG}&action_type=eq.email_sent&order=created_at.asc&limit=5&select=created_at")
print(f"  First email_sent: {email_sent[0] if email_sent else 'none'}")
email_sent_last = get(f"activity_log?org_id=eq.{ORG}&action_type=eq.email_sent&order=created_at.desc&limit=5&select=created_at")
print(f"  Last email_sent:  {email_sent_last[0] if email_sent_last else 'none'}")

# Count total email_sent activity entries
all_sent = get(f"activity_log?org_id=eq.{ORG}&action_type=eq.email_sent&select=id")
print(f"  Total email_sent activity entries: {len(all_sent)}")
