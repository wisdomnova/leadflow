#!/usr/bin/env python3
"""Debug analytics data accuracy."""
import json, urllib.request
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
ORG = "64209895-565d-4974-9d41-3f39d1a1b467"


def get(path):
    req = urllib.request.Request(f"{URL}/{path}", headers=H)
    return json.loads(urllib.request.urlopen(req).read())


# 1. Campaign-level stats
print("=== Campaign Stats ===")
camps = get(f"campaigns?org_id=eq.{ORG}&select=id,name,status,sent_count,open_count,reply_count,click_count,bounce_count,total_leads&order=sent_count.desc")
total_sent = 0
total_open = 0
total_reply = 0
total_bounce = 0
for c in camps:
    s = c.get("sent_count", 0) or 0
    o = c.get("open_count", 0) or 0
    r = c.get("reply_count", 0) or 0
    b = c.get("bounce_count", 0) or 0
    total_sent += s
    total_open += o
    total_reply += r
    total_bounce += b
    print(f"  {c['name']:25s} | status={c['status']:10s} | sent={s:4d} | open={o:4d} | reply={r:2d} | bounce={b:3d} | leads={c.get('total_leads',0)}")

print(f"\n  TOTALS from campaigns: sent={total_sent}, open={total_open}, reply={total_reply}, bounce={total_bounce}")
if total_sent > 0:
    print(f"  Calculated rates: open={total_open/total_sent*100:.1f}%, bounce={total_bounce/total_sent*100:.1f}%")

# 2. analytics_daily stats
print("\n=== analytics_daily ===")
daily = get(f"analytics_daily?org_id=eq.{ORG}&select=*&order=date.desc&limit=30")
d_sent = d_open = d_reply = d_bounce = 0
for d in daily:
    s = d.get("sent_count", 0) or 0
    o = d.get("open_count", 0) or 0
    r = d.get("reply_count", 0) or 0
    b = d.get("bounce_count", 0) or 0
    d_sent += s
    d_open += o
    d_reply += r
    d_bounce += b
    print(f"  {d['date']} | sent={s:4d} | open={o:4d} | reply={r:2d} | bounce={b:3d}")

print(f"\n  TOTALS from analytics_daily: sent={d_sent}, open={d_open}, reply={d_reply}, bounce={d_bounce}")
if d_sent > 0:
    print(f"  Calculated rates: open={d_open/d_sent*100:.1f}%, bounce={d_bounce/d_sent*100:.1f}%")

# 3. Actual recipient counts
print("\n=== Actual campaign_recipients counts ===")
for c in camps:
    if (c.get("sent_count", 0) or 0) > 0:
        recips = get(f"campaign_recipients?campaign_id=eq.{c['id']}&select=status")
        status_counts = {}
        for rc in recips:
            st = rc.get("status", "unknown")
            status_counts[st] = status_counts.get(st, 0) + 1
        # Count how many actually got sent (have last_sent_at)
        sent_recips = get(f"campaign_recipients?campaign_id=eq.{c['id']}&select=id&not.last_sent_at.is.null&limit=1&offset=0")
        print(f"  {c['name']:25s} | statuses: {status_counts}")

# 4. Check tracking_events for actual opens
print("\n=== tracking_events (opens) ===")
events = get(f"tracking_events?org_id=eq.{ORG}&select=event_type&limit=2000")
event_counts = {}
for e in events:
    t = e.get("event_type", "unknown")
    event_counts[t] = event_counts.get(t, 0) + 1
print(f"  Event counts: {event_counts}")
