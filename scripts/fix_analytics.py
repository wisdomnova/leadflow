#!/usr/bin/env python3
"""Recalculate campaign stats from campaign_recipients (source of truth)
and fix analytics_daily to match."""
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


def get(path):
    req = urllib.request.Request(f"{URL}/{path}", headers=H)
    return json.loads(urllib.request.urlopen(req).read())


def patch(path, data):
    req = urllib.request.Request(f"{URL}/{path}", data=json.dumps(data).encode(), method="PATCH", headers=H)
    return urllib.request.urlopen(req).status


# 1. Get all campaigns for this org
campaigns = get(f"campaigns?org_id=eq.{ORG}&select=id,name,sent_count,open_count,reply_count,bounce_count,click_count,total_leads")

print("=== Recalculating campaign stats from campaign_recipients ===\n")

for camp in campaigns:
    cid = camp["id"]
    name = camp["name"]

    # Get all recipients for this campaign
    recips = get(f"campaign_recipients?campaign_id=eq.{cid}&select=status,opens,clicks,replies,last_sent_at&limit=10000")

    # Calculate actual stats
    actual_sent = sum(1 for r in recips if r.get("last_sent_at"))
    actual_open = sum(1 for r in recips if (r.get("opens") or 0) > 0)
    actual_reply = sum(1 for r in recips if r.get("status") == "replied" or (r.get("replies") or 0) > 0)
    actual_bounce = sum(1 for r in recips if r.get("status") == "bounced")
    actual_click = sum(1 for r in recips if (r.get("clicks") or 0) > 0)

    old_sent = camp.get("sent_count", 0) or 0
    old_open = camp.get("open_count", 0) or 0
    old_reply = camp.get("reply_count", 0) or 0
    old_bounce = camp.get("bounce_count", 0) or 0
    old_click = camp.get("click_count", 0) or 0

    print(f"  {name}")
    print(f"    recipients: {len(recips)}")
    print(f"    sent:   {old_sent:4d} -> {actual_sent:4d}  {'CHANGED' if old_sent != actual_sent else 'ok'}")
    print(f"    open:   {old_open:4d} -> {actual_open:4d}  {'CHANGED' if old_open != actual_open else 'ok'}")
    print(f"    reply:  {old_reply:4d} -> {actual_reply:4d}  {'CHANGED' if old_reply != actual_reply else 'ok'}")
    print(f"    bounce: {old_bounce:4d} -> {actual_bounce:4d}  {'CHANGED' if old_bounce != actual_bounce else 'ok'}")
    print(f"    click:  {old_click:4d} -> {actual_click:4d}  {'CHANGED' if old_click != actual_click else 'ok'}")

    # Update campaign with correct stats
    status = patch(f"campaigns?id=eq.{cid}", {
        "sent_count": actual_sent,
        "open_count": actual_open,
        "reply_count": actual_reply,
        "bounce_count": actual_bounce,
        "click_count": actual_click,
    })
    print(f"    PATCH: {status}")
    print()

# 2. Fix analytics_daily - recalculate from campaign totals
print("=== Fixing analytics_daily ===\n")

# Recalculate the correct totals across all campaigns
camps_new = get(f"campaigns?org_id=eq.{ORG}&select=id,name,sent_count,open_count,reply_count,bounce_count,click_count")
total_sent = sum(c.get("sent_count", 0) or 0 for c in camps_new)
total_open = sum(c.get("open_count", 0) or 0 for c in camps_new)
total_reply = sum(c.get("reply_count", 0) or 0 for c in camps_new)
total_bounce = sum(c.get("bounce_count", 0) or 0 for c in camps_new)
total_click = sum(c.get("click_count", 0) or 0 for c in camps_new)
print(f"  Correct campaign totals: sent={total_sent}, open={total_open}, reply={total_reply}, bounce={total_bounce}, click={total_click}")

# Get existing analytics_daily entries
daily = get(f"analytics_daily?org_id=eq.{ORG}&select=*&order=date.asc")
daily_total_sent = sum(d.get("sent_count", 0) or 0 for d in daily)
daily_total_bounce = sum(d.get("bounce_count", 0) or 0 for d in daily)
print(f"  Current daily totals: sent={daily_total_sent}, bounce={daily_total_bounce}")

# Strategy: scale each day's stats proportionally to match campaign totals
# For bounce: most bounces were on 2026-03-26 (965), campaigns say actual is much less
# We'll set the bounce on each day to proportional share, but most simply:
# just correct the single day with the most inflation
if daily:
    for d in daily:
        date = d["date"]
        old_bounce_d = d.get("bounce_count", 0) or 0
        old_sent_d = d.get("sent_count", 0) or 0

        # Scale bounce counts proportionally
        if daily_total_bounce > 0:
            new_bounce_d = round(old_bounce_d * (total_bounce / daily_total_bounce))
        else:
            new_bounce_d = 0

        # Scale sent counts proportionally (analytics_daily had extra sends from deleted campaigns)
        if daily_total_sent > 0:
            new_sent_d = round(old_sent_d * (total_sent / daily_total_sent))
        else:
            new_sent_d = 0

        # Also scale opens proportionally
        old_open_d = d.get("open_count", 0) or 0
        daily_total_open = sum(dd.get("open_count", 0) or 0 for dd in daily)
        new_open_d = round(old_open_d * (total_open / daily_total_open)) if daily_total_open > 0 else 0

        if old_bounce_d != new_bounce_d or old_sent_d != new_sent_d or old_open_d != new_open_d:
            status = patch(f"analytics_daily?org_id=eq.{ORG}&date=eq.{date}", {
                "sent_count": new_sent_d,
                "bounce_count": new_bounce_d,
                "open_count": new_open_d,
                "reply_count": d.get("reply_count", 0) or 0,
                "click_count": d.get("click_count", 0) or 0,
            })
            print(f"  {date}: sent {old_sent_d}->{new_sent_d}, bounce {old_bounce_d}->{new_bounce_d}, open {old_open_d}->{new_open_d} (PATCH: {status})")

# 3. Verify
print("\n=== Verification ===")
camps_final = get(f"campaigns?org_id=eq.{ORG}&select=name,sent_count,open_count,reply_count,bounce_count")
for c in camps_final:
    s = c.get("sent_count", 0) or 0
    o = c.get("open_count", 0) or 0
    r = c.get("reply_count", 0) or 0
    b = c.get("bounce_count", 0) or 0
    brate = f"{b/s*100:.1f}%" if s > 0 else "n/a"
    orate = f"{o/s*100:.1f}%" if s > 0 else "n/a"
    print(f"  {c['name']:25s} | sent={s:4d} | open={o:4d} ({orate}) | reply={r:2d} | bounce={b:3d} ({brate})")

daily_final = get(f"analytics_daily?org_id=eq.{ORG}&select=date,sent_count,open_count,bounce_count&order=date.asc")
d_sent = sum(d.get("sent_count", 0) or 0 for d in daily_final)
d_bounce = sum(d.get("bounce_count", 0) or 0 for d in daily_final)
d_open = sum(d.get("open_count", 0) or 0 for d in daily_final)
print(f"\n  analytics_daily totals: sent={d_sent}, open={d_open}, bounce={d_bounce}")
print(f"  campaign totals:        sent={total_sent}, open={total_open}, bounce={total_bounce}")
