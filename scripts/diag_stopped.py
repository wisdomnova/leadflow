#!/usr/bin/env python3
"""Diagnose why campaign stopped at 2003."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'

def q(path):
    r = subprocess.run(['curl', '-s', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
        capture_output=True, text=True)
    return json.loads(r.stdout)

def count(path):
    r = subprocess.run(['curl', '-s', '-I', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Prefer: count=exact'], capture_output=True, text=True)
    for line in r.stdout.split('\n'):
        if 'content-range' in line.lower():
            return line.strip().split('/')[-1]
    return '?'

cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'

# Campaign
camp = q(f'campaigns?id=eq.{cid}&select=name,status,sent_count,total_leads')[0]
print(f"Campaign: {camp['name']} status={camp['status']} sent={camp['sent_count']} total={camp['total_leads']}")

# Recipient breakdown
print("\nRecipient status breakdown:")
for status in ['active', 'completed', 'bounced', 'replied', 'unsubscribed', 'failed']:
    c = count(f'campaign_recipients?campaign_id=eq.{cid}&status=eq.{status}&select=id')
    print(f"  {status}: {c}")

# Active but unsent
unsent_count = count(f'campaign_recipients?campaign_id=eq.{cid}&status=eq.active&last_sent_at=is.null&select=id')
print(f"\nActive + never sent: {unsent_count}")

# Active but undispatched
undisp_count = count(f'campaign_recipients?campaign_id=eq.{cid}&status=eq.active&dispatched_at=is.null&select=id')
print(f"Active + undispatched: {undisp_count}")

# Sample unsent active recipients
unsent = q(f'campaign_recipients?campaign_id=eq.{cid}&status=eq.active&last_sent_at=is.null&select=id,current_step,dispatched_at&limit=5')
print(f"\nSample unsent active recipients ({len(unsent)}):")
for r in unsent:
    print(f"  id={r['id'][:16]}... step={r['current_step']} dispatched={r.get('dispatched_at')}")

# Servers
print("\nServers:")
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4','rofsell'),('1dac6ece-a3be-401a-840a-34072d90be2c','Territorial')]:
    d = q(f'smart_servers?id=eq.{sid}&select=name,status,daily_limit,current_usage,warmup_day,warmup_daily_sends')[0]
    print(f"  {name}: status={d['status']} day={d['warmup_day']} limit={d['daily_limit']} usage={d['current_usage']} warmup_sends={d['warmup_daily_sends']}")

# Check if daily limit reached
print("\nDaily limit reached?")
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4','rofsell'),('1dac6ece-a3be-401a-840a-34072d90be2c','Territorial')]:
    d = q(f'smart_servers?id=eq.{sid}&select=daily_limit,current_usage')[0]
    reached = d['current_usage'] >= d['daily_limit']
    print(f"  {name}: {d['current_usage']}/{d['daily_limit']} {'YES - AT LIMIT' if reached else 'no'}")
