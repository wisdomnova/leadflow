#!/usr/bin/env python3
"""Comprehensive diagnostic: campaign + warmup + DB integrity."""
import re, subprocess, json, sys

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
signing_key = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
event_key = re.search(r'INNGEST_EVENT_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
rpc = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1/rpc'

cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'
oid = '64209895-565d-4974-9d41-3f39d1a1b467'

def api_get(path):
    r = subprocess.run(['curl', '-s', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
    ], capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except: return r.stdout

def api_rpc(name, data):
    r = subprocess.run(['curl', '-s', '-X', 'POST', f'{rpc}/{name}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Content-Type: application/json', '-d', json.dumps(data)
    ], capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except: return r.stdout

def api_patch(path, data):
    r = subprocess.run(['curl', '-s', '-X', 'PATCH', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Content-Type: application/json', '-d', json.dumps(data)
    ], capture_output=True, text=True)
    return r.stdout

def count(path):
    r = subprocess.run(['curl', '-s', '-I', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Prefer: count=exact'
    ], capture_output=True, text=True)
    for line in r.stdout.split('\n'):
        if 'content-range' in line.lower():
            return line.strip().split('/')[-1]
    return '?'

print("=" * 70)
print("COMPREHENSIVE DIAGNOSTIC")
print("=" * 70)

# ── 1. CAMPAIGN STATUS ──────────────────────────────────────────────────
print("\n1) CAMPAIGN STATUS")
camp = api_get(f'campaigns?id=eq.{cid}&select=id,name,status,use_powersend,powersend_server_ids,sent_count,total_leads,config')
if isinstance(camp, list) and camp:
    c = camp[0]
    print(f"   name: {c['name']}, status: {c['status']}")
    print(f"   sent_count: {c['sent_count']}, total_leads: {c['total_leads']}")
    print(f"   use_powersend: {c['use_powersend']}")
    print(f"   powersend_server_ids: {c['powersend_server_ids']}")
    print(f"   config: {c['config']}")

# ── 2. SERVER STATUS ────────────────────────────────────────────────────
print("\n2) SERVER STATUS")
servers = api_get(f'smart_servers?org_id=eq.{oid}&select=id,name,status,daily_limit,current_usage,warmup_enabled,warmup_day,warmup_daily_sends,smtp_config,default_smtp_host,default_smtp_port')
if isinstance(servers, list):
    for s in servers:
        print(f"   {s['name']}:")
        print(f"     status={s['status']}, daily_limit={s['daily_limit']}, current_usage={s['current_usage']}")
        print(f"     warmup_enabled={s.get('warmup_enabled')}, warmup_day={s.get('warmup_day')}, warmup_daily_sends={s.get('warmup_daily_sends')}")
        print(f"     smtp_config={json.dumps(s.get('smtp_config', {}))}")
        print(f"     default_smtp_host={s.get('default_smtp_host')}, default_smtp_port={s.get('default_smtp_port')}")

# ── 3. MAILBOX SAMPLE ──────────────────────────────────────────────────
print("\n3) MAILBOX SAMPLE (2 per server)")
for sid in ['1dac6ece-a3be-401a-840a-34072d90be2c', '7a0741c6-4678-4863-9a1e-26c888e5fae4']:
    mbs = api_get(f'server_mailboxes?server_id=eq.{sid}&select=id,email,status,daily_limit,current_usage,smtp_host,smtp_port,smtp_username,smtp_password,last_sent_at&limit=2')
    if isinstance(mbs, list):
        for m in mbs:
            pw = m.get('smtp_password', '')
            m['smtp_password'] = f"{'SET' if pw else 'EMPTY'} ({len(pw)} chars)" if pw else "EMPTY"
            print(f"   {json.dumps(m)}")

# ── 4. RECIPIENT STATUS ────────────────────────────────────────────────
print("\n4) RECIPIENT STATUS")
print(f"   Total active: {count(f'campaign_recipients?campaign_id=eq.{cid}&status=eq.active&select=id')}")
print(f"   dispatched_at IS NULL: {count(f'campaign_recipients?campaign_id=eq.{cid}&dispatched_at=is.null&select=id')}")
print(f"   dispatched_at NOT NULL: {count(f'campaign_recipients?campaign_id=eq.{cid}&dispatched_at=not.is.null&select=id')}")
print(f"   last_sent_at NOT NULL: {count(f'campaign_recipients?campaign_id=eq.{cid}&last_sent_at=not.is.null&select=id')}")
print(f"   current_step > 0: {count(f'campaign_recipients?campaign_id=eq.{cid}&current_step=gt.0&select=id')}")

# ── 5. CHECK REQUIRED RPCS ─────────────────────────────────────────────
print("\n5) CHECK REQUIRED RPCS")
# get_random_seed
seeds = api_rpc('get_random_seed', {})
print(f"   get_random_seed: {json.dumps(seeds)[:200] if seeds else 'ERROR/EMPTY'}")

# warmup content
subj = api_rpc('get_random_warmup_content', {'req_category': 'subject', 'num_results': 1})
print(f"   get_random_warmup_content (subject): {json.dumps(subj)[:200] if subj else 'ERROR/EMPTY'}")

body = api_rpc('get_random_warmup_content', {'req_category': 'body', 'num_results': 1})
print(f"   get_random_warmup_content (body): {json.dumps(body)[:200] if body else 'ERROR/EMPTY'}")

# increment_powersend_warmup_send
print(f"   increment_powersend_warmup_send: checking existence...")
r = subprocess.run(['curl', '-s', '-X', 'POST', f'{rpc}/increment_powersend_warmup_send',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'server_id_param': '7a0741c6-4678-4863-9a1e-26c888e5fae4'})
], capture_output=True, text=True)
print(f"     response: {r.stdout[:200]}")

# advance_powersend_warmup
r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-X', 'POST',
    f'{rpc}/advance_powersend_warmup',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json', '-d', '{}'
], capture_output=True, text=True)
print(f"   advance_powersend_warmup: HTTP {r.stdout}")

# reset_powersend_warmup_sends
r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-X', 'POST',
    f'{rpc}/reset_powersend_warmup_sends',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Content-Type: application/json', '-d', '{}'
], capture_output=True, text=True)
print(f"   reset_powersend_warmup_sends: HTTP {r.stdout}")

# ── 6. CHECK WARMUP TABLES ─────────────────────────────────────────────
print("\n6) WARMUP TABLES")
# warmup_seeds
r = subprocess.run(['curl', '-s', '-I',
    f'{url}/warmup_seeds?select=id',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Prefer: count=exact'
], capture_output=True, text=True)
for line in r.stdout.split('\n'):
    if 'content-range' in line.lower():
        print(f"   warmup_seeds count: {line.strip().split('/')[-1]}")

# warmup_content  
r = subprocess.run(['curl', '-s', '-I',
    f'{url}/warmup_content?select=id',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Prefer: count=exact'
], capture_output=True, text=True)
for line in r.stdout.split('\n'):
    if 'content-range' in line.lower():
        print(f"   warmup_content count: {line.strip().split('/')[-1]}")

# warmup_stats
r = subprocess.run(['curl', '-s', '-I',
    f'{url}/warmup_stats?select=id',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
    '-H', 'Prefer: count=exact'
], capture_output=True, text=True)
for line in r.stdout.split('\n'):
    if 'content-range' in line.lower():
        print(f"   warmup_stats count: {line.strip().split('/')[-1]}")

# ── 7. INNGEST FUNCTION RUNS ───────────────────────────────────────────
print("\n7) INNGEST FUNCTION RUNS (recent)")
# Get environment functions
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/events?limit=10',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    events = json.loads(r.stdout).get('data', [])
    seen_names = set()
    for e in events:
        name = e.get('name', 'unknown')
        if name not in seen_names:
            seen_names.add(name)
            print(f"   Event: {name} at {e.get('received_at', '?')}")
except:
    print(f"   {r.stdout[:300]}")

# ── 8. CHECK SPECIFIC EVENT RUN ────────────────────────────────────────
print("\n8) CHECK campaign/email.process EVENT DETAILS")
# Find the event
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/events?name=campaign/email.process&limit=3',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    events = data.get('data', [])
    print(f"   Found {len(events)} events")
    for evt in events[:3]:
        evt_id = evt.get('internal_id', evt.get('id', '?'))
        print(f"   Event {evt_id}:")
        print(f"     received_at: {evt.get('received_at')}")
        print(f"     name: {evt.get('name')}")
        
        # Get function runs for this event
        r2 = subprocess.run(['curl', '-s',
            f'https://api.inngest.com/v1/events/{evt_id}/runs',
            '-H', f'Authorization: Bearer {signing_key}'
        ], capture_output=True, text=True)
        try:
            runs = json.loads(r2.stdout)
            print(f"     runs: {json.dumps(runs)[:500]}")
        except:
            print(f"     runs: {r2.stdout[:300]}")
except:
    print(f"   {r.stdout[:300]}")

# ── 9. CHECK campaign-sweep FUNCTION RUNS ──────────────────────────────
print("\n9) CAMPAIGN SWEEP STATUS")
# Check the last few internal events for campaign-sweep
r = subprocess.run(['curl', '-s',
    'https://api.inngest.com/v1/events?name=inngest/function.finished&limit=20',
    '-H', f'Authorization: Bearer {signing_key}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    events = data.get('data', [])
    sweep_count = 0
    ep_count = 0
    for e in events:
        # These are internal finish events - check if they reference sweep
        evt_id = e.get('id', '')
        received = e.get('received_at', '')
        name = e.get('name', '')
        print(f"   {received}: {name} id={evt_id[:20]}...")
except:
    print(f"   {r.stdout[:300]}")

# ── 10. FIX: Undo accidental increments from diag6.py ──────────────────
print("\n10) FIXING ACCIDENTAL INCREMENTS")
# Reset campaign sent_count to 0
api_patch(f'campaigns?id=eq.{cid}', {'sent_count': 0})
print(f"   Reset campaign sent_count to 0")

# Reset server current_usage to 0
for sid in ['7a0741c6-4678-4863-9a1e-26c888e5fae4', '1dac6ece-a3be-401a-840a-34072d90be2c']:
    api_patch(f'smart_servers?id=eq.{sid}', {'current_usage': 0})
print(f"   Reset server current_usage to 0")

# Reset mailbox current_usage for the one we incremented
api_patch(f'server_mailboxes?id=eq.2320ab0b-2a0c-4e23-9c37-870ab558f96d', {'current_usage': 0})
print(f"   Reset mailbox current_usage to 0")

# ── 11. Reset dispatched_at so sweep picks up fresh ────────────────────
print("\n11) RESET dispatched_at for fresh sweep pickup")
api_patch(f'campaign_recipients?campaign_id=eq.{cid}&status=eq.active', {'dispatched_at': None})
print(f"   All active recipients dispatched_at reset to null")

# Verify
n = count(f'campaign_recipients?campaign_id=eq.{cid}&dispatched_at=is.null&select=id')
print(f"   Verified: {n} recipients with dispatched_at=null")

# ── 12. Check event stale guard ────────────────────────────────────────
print("\n12) STALE EVENT GUARD CHECK")
import time
ts_ms = int(time.time() * 1000)
ts_s = int(time.time())
print(f"   Current timestamp in ms: {ts_ms}")
print(f"   Current timestamp in s:  {ts_s}")
print(f"   Date.now() - ts_ms = ~0 (correct)")
print(f"   Date.now() - ts_s  = ~{ts_ms - ts_s} ms = ~{(ts_ms - ts_s) // 60000} min (WRONG - would be ~55 years)")
print(f"   EVENT_TTL_MS (2h) = {2*60*60*1000}")
print(f"   If event.ts is in SECONDS, all events would be rejected as stale!")

# ── 13. SEND FRESH EVENT AND CHECK ─────────────────────────────────────
print("\n13) SENDING FRESH TEST EVENT")
# Get first lead
recs = api_get(f'campaign_recipients?campaign_id=eq.{cid}&status=eq.active&select=lead_id&limit=1')
if isinstance(recs, list) and recs:
    test_lead = recs[0]['lead_id']
    print(f"   Test lead: {test_lead}")
    
    event_data = {
        "name": "campaign/email.process",
        "data": {
            "campaignId": cid,
            "leadId": test_lead,
            "stepIdx": 0,
            "orgId": oid
        },
        "ts": ts_ms  # explicitly set ms timestamp
    }
    r = subprocess.run(['curl', '-s', '-X', 'POST',
        f'https://inn.gs/e/{event_key}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps(event_data)
    ], capture_output=True, text=True)
    print(f"   Event sent: {r.stdout}")
    
    print(f"\n   Waiting 20 seconds for processing...")
    import time; time.sleep(20)
    
    # Check recipient
    rec = api_get(f'campaign_recipients?campaign_id=eq.{cid}&lead_id=eq.{test_lead}')
    if isinstance(rec, list) and rec:
        r = rec[0]
        print(f"   RESULT:")
        print(f"     last_sent_at: {r['last_sent_at']}")
        print(f"     current_step: {r['current_step']}")
        print(f"     status: {r['status']}")
    
    # Check sent_count
    camp2 = api_get(f'campaigns?id=eq.{cid}&select=sent_count')
    if isinstance(camp2, list) and camp2:
        print(f"     campaign sent_count: {camp2[0]['sent_count']}")
    
    # Check activity
    acts = api_get(f'activity_log?order=created_at.desc&limit=3&select=action_type,description,created_at')
    if isinstance(acts, list):
        print(f"\n   Recent activity:")
        for a in acts:
            print(f"     {a['created_at']}: {a['action_type']}")

print("\n" + "=" * 70)
print("DONE")
