#!/usr/bin/env python3
"""Recalculate campaign stats from campaign_recipients (with pagination + retries)."""
import json, urllib.request, time
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


def get(path, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(f"{URL}/{path}", headers=H)
            return json.loads(urllib.request.urlopen(req).read())
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
            else:
                raise


def get_all(path, retries=3):
    """Paginate through all results."""
    results = []
    offset = 0
    while True:
        sep = "&" if "?" in path else "?"
        page = get(f"{path}{sep}offset={offset}&limit=1000", retries)
        results.extend(page)
        if len(page) < 1000:
            break
        offset += 1000
    return results


def patch(path, data, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(f"{URL}/{path}", data=json.dumps(data).encode(), method="PATCH", headers=H)
            return urllib.request.urlopen(req).status
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
            else:
                raise


# 1. Get all campaigns for this org
campaigns = get(f"campaigns?org_id=eq.{ORG}&select=id,name,sent_count,open_count,reply_count,bounce_count,click_count,total_leads")

print("=== Recalculating campaign stats from campaign_recipients ===\n")

for camp in campaigns:
    cid = camp["id"]
    name = camp["name"]

    # Get ALL recipients for this campaign (paginated)
    recips = get_all(f"campaign_recipients?campaign_id=eq.{cid}&select=status,opens,clicks,replies,last_sent_at")

    # Calculate actual stats
    actual_sent = sum(1 for r in recips if r.get("last_sent_at"))
    actual_open = sum(1 for r in recips if (r.get("opens") or 0) > 0)
    actual_reply = sum(1 for r in recips if r.get("status") == "replied" or (r.get("replies") or 0) > 0)
    actual_bounce = sum(1 for r in recips if r.get("status") == "bounced")
    actual_click = sum(1 for r in recips if (r.get("clicks") or 0) > 0)

    old_sent = camp.get("sent_count", 0) or 0
    old_open = camp.get("open_count", 0) or 0
    old_bounce = camp.get("bounce_count", 0) or 0

    print(f"  {name}")
    print(f"    recipients: {len(recips)}")

    # If no recipients exist, keep sent_count as-is but zero out bounces
    if len(recips) == 0:
        print(f"    No recipients found. Keeping sent={old_sent}, open={old_open}. Zeroing bounce: {old_bounce} -> 0")
        patch(f"campaigns?id=eq.{cid}", {"bounce_count": 0})
        actual_sent = old_sent  # preserve for analytics_daily
        actual_open = old_open
        actual_bounce = 0
    else:
        print(f"    sent:   {old_sent:4d} -> {actual_sent:4d}")
        print(f"    open:   {old_open:4d} -> {actual_open:4d}")
        print(f"    reply:  {camp.get('reply_count',0) or 0:4d} -> {actual_reply:4d}")
        print(f"    bounce: {old_bounce:4d} -> {actual_bounce:4d}")
        print(f"    click:  {camp.get('click_count',0) or 0:4d} -> {actual_click:4d}")

        patch(f"campaigns?id=eq.{cid}", {
            "sent_count": actual_sent,
            "open_count": actual_open,
            "reply_count": actual_reply,
            "bounce_count": actual_bounce,
            "click_count": actual_click,
        })
    print()

# 2. Fix analytics_daily
print("=== Fixing analytics_daily ===\n")

# Recalculate correct totals from campaigns (re-fetch after update)
camps_new = get(f"campaigns?org_id=eq.{ORG}&select=sent_count,open_count,reply_count,bounce_count,click_count")
total_sent = sum(c.get("sent_count", 0) or 0 for c in camps_new)
total_open = sum(c.get("open_count", 0) or 0 for c in camps_new)
total_reply = sum(c.get("reply_count", 0) or 0 for c in camps_new)
total_bounce = sum(c.get("bounce_count", 0) or 0 for c in camps_new)
total_click = sum(c.get("click_count", 0) or 0 for c in camps_new)
print(f"  Campaign totals: sent={total_sent}, open={total_open}, reply={total_reply}, bounce={total_bounce}")

daily = get(f"analytics_daily?org_id=eq.{ORG}&select=*&order=date.asc")
daily_totals = {
    "sent": sum(d.get("sent_count", 0) or 0 for d in daily),
    "open": sum(d.get("open_count", 0) or 0 for d in daily),
    "reply": sum(d.get("reply_count", 0) or 0 for d in daily),
    "bounce": sum(d.get("bounce_count", 0) or 0 for d in daily),
}
print(f"  Daily totals:    sent={daily_totals['sent']}, open={daily_totals['open']}, reply={daily_totals['reply']}, bounce={daily_totals['bounce']}")

# Scale each day proportionally
for d in daily:
    date = d["date"]
    updates = {}
    changed = False

    for col, daily_key in [("sent_count", "sent"), ("open_count", "open"), ("bounce_count", "bounce"), ("reply_count", "reply"), ("click_count", "click")]:
        old_val = d.get(col, 0) or 0
        target = {"sent": total_sent, "open": total_open, "bounce": total_bounce, "reply": total_reply, "click": total_click}[daily_key]
        daily_sum = daily_totals.get(daily_key, 0)
        if daily_sum > 0:
            new_val = round(old_val * (target / daily_sum))
        else:
            new_val = 0
        updates[col] = new_val
        if new_val != old_val:
            changed = True

    if changed:
        status = patch(f"analytics_daily?org_id=eq.{ORG}&date=eq.{date}", updates)
        print(f"  {date}: sent {d.get('sent_count',0)}->{updates['sent_count']}, open {d.get('open_count',0)}->{updates['open_count']}, bounce {d.get('bounce_count',0)}->{updates['bounce_count']} (PATCH: {status})")
        time.sleep(0.2)  # avoid rate limits / SSL issues

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
d_open = sum(d.get("open_count", 0) or 0 for d in daily_final)
d_bounce = sum(d.get("bounce_count", 0) or 0 for d in daily_final)
print(f"\n  analytics_daily totals: sent={d_sent}, open={d_open}, bounce={d_bounce}")
print(f"  campaign totals:        sent={total_sent}, open={total_open}, bounce={total_bounce}")
