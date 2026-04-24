#!/usr/bin/env python3
"""Deep diagnostic: why is Dach Marketing still at 0 sent?"""
import re, subprocess, json, urllib.parse

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
rpc = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1/rpc'

cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'
oid = '64209895-565d-4974-9d41-3f39d1a1b467'

def api(path, method='GET', data=None):
    cmd = ['curl', '-s']
    if method == 'POST':
        cmd += ['-X', 'POST']
    endpoint = f'{rpc}/{path.replace("rpc/","")}' if path.startswith('rpc/') else f'{url}/{path}'
    cmd += [endpoint,
            '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}']
    if data:
        cmd += ['-H', 'Content-Type: application/json', '-d', json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        j = json.loads(r.stdout)
        return j
    except:
        print(f"   [RAW] {r.stdout[:300]}")
        return r.stdout

# 1) Campaign status
print("=" * 60)
print("1) CAMPAIGN STATUS")
c = api(f'campaigns?id=eq.{cid}&select=id,name,status,use_powersend,server_ids,smart_sending,send_interval_min,send_interval_max,schedule_start_time,schedule_end_time,schedule_timezone,schedule_days,created_at')
if isinstance(c, list) and len(c) > 0:
    for k, v in c[0].items():
        print(f"   {k}: {v}")
else:
    print(f"   ERROR: {c}")

# 2) Recipients breakdown
print("\n" + "=" * 60)
print("2) RECIPIENTS BREAKDOWN")
# Count by status
for status in ['active', 'completed', 'bounced', 'failed', 'unsubscribed']:
    r = subprocess.run(['curl', '-s', '-I',
        f'{url}/campaign_recipients?campaign_id=eq.{cid}&status=eq.{status}&select=id',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Prefer: count=exact'
    ], capture_output=True, text=True)
    for line in r.stdout.split('\n'):
        if 'content-range' in line.lower():
            print(f"   {status}: {line.strip().split('/')[-1]}")

# Check dispatched vs not
for label, filt in [
    ('dispatched_at IS NULL', 'dispatched_at=is.null'),
    ('dispatched_at IS NOT NULL', 'dispatched_at=not.is.null'),
    ('sent_count > 0', 'sent_count=gt.0'),
    ('sent_count = 0', 'sent_count=eq.0'),
    ('last_sent_at IS NOT NULL', 'last_sent_at=not.is.null'),
    ('next_send_at IS NOT NULL', 'next_send_at=not.is.null'),
]:
    r = subprocess.run(['curl', '-s', '-I',
        f'{url}/campaign_recipients?campaign_id=eq.{cid}&{filt}&select=id',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Prefer: count=exact'
    ], capture_output=True, text=True)
    for line in r.stdout.split('\n'):
        if 'content-range' in line.lower():
            print(f"   {label}: {line.strip().split('/')[-1]}")

# 3) Check a few recipients 
print("\n" + "=" * 60)
print("3) SAMPLE RECIPIENTS (first 3)")
recs = api(f'campaign_recipients?campaign_id=eq.{cid}&select=id,status,sent_count,dispatched_at,last_sent_at,next_send_at,current_step&limit=3')
for r in (recs or []):
    print(f"   {json.dumps(r)}")

# 4) Server + mailbox status
print("\n" + "=" * 60)
print("4) SERVERS")
for sid, name in [('1dac6ece-a3be-401a-840a-34072d90be2c', 'Territorial'), ('7a0741c6-4678-4863-9a1e-26c888e5fae4', 'rofsell')]:
    s = api(f'smart_servers?id=eq.{sid}&select=name,status,daily_limit,current_usage,warmup_day,warmup_daily_sends,smtp_host,smtp_port,smtp_username')
    print(f"   {json.dumps(s)}")

# 5) Mailbox sample
print("\n" + "=" * 60)
print("5) MAILBOX SAMPLE (3 from each server)")
for sid in ['1dac6ece-a3be-401a-840a-34072d90be2c', '7a0741c6-4678-4863-9a1e-26c888e5fae4']:
    mbs = api(f'server_mailboxes?server_id=eq.{sid}&select=id,email,status,daily_limit,current_usage,smtp_host,smtp_port&limit=3')
    for m in (mbs or []):
        print(f"   {json.dumps(m)}")

# 6) Test RPC
print("\n" + "=" * 60)
print("6) RPC get_next_powersend_node")
node = subprocess.run(['curl', '-s', '-X', 'POST',
    f'{rpc}/get_next_powersend_node',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'org_id_param': oid, 'server_ids_param': ['1dac6ece-a3be-401a-840a-34072d90be2c', '7a0741c6-4678-4863-9a1e-26c888e5fae4']})
], capture_output=True, text=True)
print(f"   {node.stdout[:500]}")

# 7) RPC get_next_pool_mailbox for first server
print("\n" + "=" * 60)
print("7) RPC get_next_pool_mailbox for rofsell")
mb = subprocess.run(['curl', '-s', '-X', 'POST',
    f'{rpc}/get_next_pool_mailbox',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'server_id_param': '7a0741c6-4678-4863-9a1e-26c888e5fae4'})
], capture_output=True, text=True)
print(f"   {mb.stdout[:500]}")

# 8) Check Inngest event key
print("\n" + "=" * 60)
print("8) INNGEST CONFIG")
ik = re.search(r'INNGEST_EVENT_KEY="([^"]+)"', text)
print(f"   INNGEST_EVENT_KEY: {'SET' if ik else 'MISSING'}")
isk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text)
print(f"   INNGEST_SIGNING_KEY: {'SET' if isk else 'MISSING'}")

# 9) Check activity_log for recent errors
print("\n" + "=" * 60)
print("9) RECENT ACTIVITY LOG (last 5)")
acts = api(f'activity_log?org_id=eq.{oid}&select=id,type,message,created_at&order=created_at.desc&limit=5')
for a in (acts or []):
    print(f"   {json.dumps(a)}")

# 10) Check if campaign has steps defined
print("\n" + "=" * 60)
print("10) CAMPAIGN STEPS")
steps = api(f'campaign_steps?campaign_id=eq.{cid}&select=id,step_number,subject,delay_days,delay_hours&order=step_number.asc')
for s in (steps or []):
    print(f"   {json.dumps(s)}")

# 11) Check schedule — is it within sending hours?
import datetime
print("\n" + "=" * 60)
print("11) CURRENT TIME CHECK")
now = datetime.datetime.now(datetime.timezone.utc)
print(f"   UTC now: {now.isoformat()}")
print(f"   Day of week (Mon=0): {now.weekday()}")
if isinstance(c, list) and len(c) > 0 and c[0].get('schedule_timezone'):
    print(f"   Campaign timezone: {c[0]['schedule_timezone']}")
    print(f"   Schedule: {c[0].get('schedule_start_time')} - {c[0].get('schedule_end_time')}")
    print(f"   Schedule days: {c[0].get('schedule_days')}")
