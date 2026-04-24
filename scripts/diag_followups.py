#!/usr/bin/env python3
"""Diagnose 3969 sent with 2135 leads."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'

def q(path):
    r = subprocess.run(['curl', '-s', '--max-time', '10', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'],
        capture_output=True, text=True)
    return json.loads(r.stdout) if r.stdout.strip() else []

# Campaign + steps
camp = q(f'campaigns?id=eq.{cid}&select=name,status,sent_count,total_leads,steps')[0]
steps = camp.get('steps', [])
print(f"Campaign: {camp['name']}")
print(f"  sent_count={camp['sent_count']}  total_leads={camp['total_leads']}  steps={len(steps)}")
for i, s in enumerate(steps):
    print(f"  Step {i}: delay={s.get('delay','?')}  subject={s.get('subject','')[:60]}")

# Recipient current_step breakdown
print("\nRecipient current_step breakdown:")
for step in range(len(steps) + 1):
    recs = q(f'campaign_recipients?campaign_id=eq.{cid}&current_step=eq.{step}&select=id&limit=2200')
    if len(recs) > 0:
        print(f"  current_step={step}: {len(recs)}")

# Status breakdown
print("\nRecipient status breakdown:")
for st in ['active', 'replied', 'bounced', 'unsubscribed', 'completed']:
    recs = q(f'campaign_recipients?campaign_id=eq.{cid}&status=eq.{st}&select=id&limit=2200')
    if len(recs) > 0:
        print(f"  {st}: {len(recs)}")

# Servers
print("\nServers:")
for sid, name in [('7a0741c6-4678-4863-9a1e-26c888e5fae4','rofsell'),('1dac6ece-a3be-401a-840a-34072d90be2c','Territorial')]:
    d = q(f'smart_servers?id=eq.{sid}&select=name,status,daily_limit,current_usage,warmup_day,warmup_daily_sends')[0]
    print(f"  {name}: status={d['status']} day={d['warmup_day']} limit={d['daily_limit']} usage={d['current_usage']} warmup_sends={d['warmup_daily_sends']}")

# Math check
print(f"\nMath: 3969 sent / {camp['total_leads']} leads = {3969/camp['total_leads']:.1f} emails per lead on average")
print(f"With {len(steps)} steps, max possible = {camp['total_leads'] * len(steps)} = {len(steps)} per lead")
