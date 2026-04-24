#!/usr/bin/env python3
"""Check actual DB columns to find column mismatches in emailProcessor."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'

cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'
oid = '64209895-565d-4974-9d41-3f39d1a1b467'

# 1) Get actual campaigns columns via select ALL
print("1) CAMPAIGNS table - actual columns:")
r = subprocess.run(['curl', '-s',
    f'{url}/campaigns?id=eq.{cid}&limit=1',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, list) and len(data) > 0:
        cols = list(data[0].keys())
        print(f"   Column count: {len(cols)}")
        print(f"   Columns: {cols}")
        # Check specific columns used in emailProcessor
        check = ['steps', 'use_powersend', 'powersend_config', 'powersend_server_ids', 
                 'sender_id', 'sender_ids', 'config', 'sent_count', 'total_leads', 'org_id']
        for col in check:
            exists = col in cols
            val = data[0].get(col, 'N/A')
            if col == 'steps':
                val = f"{len(val) if isinstance(val, list) else 'N/A'} steps"
            elif isinstance(val, (dict, list)):
                val = json.dumps(val)[:100]
            print(f"   {'✓' if exists else '✗'} {col}: {val}")
except Exception as e:
    print(f"   Error: {e}\n   {r.stdout[:300]}")

# 2) Get actual leads columns
print("\n2) LEADS table - actual columns (sample):")
# Get the test lead
r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&status=eq.active&select=lead_id&limit=1',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
lead_id = json.loads(r.stdout)[0]['lead_id']
r = subprocess.run(['curl', '-s',
    f'{url}/leads?id=eq.{lead_id}&limit=1',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, list) and len(data) > 0:
        cols = list(data[0].keys())
        print(f"   Column count: {len(cols)}")
        print(f"   Columns: {cols}")
        # Check columns used in emailProcessor select
        check = ['email', 'first_name', 'last_name', 'company', 'job_title', 'city', 'country',
                 'timezone', 'phone', 'custom_fields', 'tags', 'status', 'org_id', 'source', 'sentiment']
        for col in check:
            exists = col in cols
            print(f"   {'✓' if exists else '✗'} {col}")
except Exception as e:
    print(f"   Error: {e}\n   {r.stdout[:300]}")

# 3) Get actual organizations columns 
print("\n3) ORGANIZATIONS table - actual columns:")
r = subprocess.run(['curl', '-s',
    f'{url}/organizations?id=eq.{oid}&limit=1',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, list) and len(data) > 0:
        cols = list(data[0].keys())
        print(f"   Column count: {len(cols)}")
        print(f"   Columns: {cols}")
        check = ['name', 'ai_usage_current', 'subscription_status', 'plan_tier', 'smart_sending_enabled']
        for col in check:
            exists = col in cols
            print(f"   {'✓' if exists else '✗'} {col}")
except Exception as e:
    print(f"   Error: {e}\n   {r.stdout[:300]}")

# 4) Check the test event we sent - did it change the recipient?
print(f"\n4) Test recipient (lead {lead_id}):")
r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&lead_id=eq.{lead_id}',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, list) and len(data) > 0:
        print(f"   {json.dumps(data[0], indent=2)}")
except:
    print(f"   {r.stdout[:300]}")

# 5) Test individual queries that emailProcessor does
print("\n5) Testing emailProcessor queries individually:")

# 5a) Campaign select (same columns as emailProcessor)
print("  5a) Campaign fetch:")
r = subprocess.run(['curl', '-s',
    f'{url}/campaigns?id=eq.{cid}&select=id,steps,status,use_powersend,powersend_config,powersend_server_ids,sender_id,sender_ids,config,name,org_id,sent_count,total_leads',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, dict) and 'code' in data:
        print(f"   ✗ ERROR: {data.get('message')} | hint: {data.get('hint')}")
    else:
        print(f"   ✓ OK ({len(data)} rows)")
except:
    print(f"   {r.stdout[:200]}")

# 5b) Lead fetch
print("  5b) Lead fetch:")
r = subprocess.run(['curl', '-s',
    f'{url}/leads?id=eq.{lead_id}&select=id,email,first_name,last_name,company,job_title,city,country,timezone,phone,custom_fields,tags,status,org_id,source,sentiment',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, dict) and 'code' in data:
        print(f"   ✗ ERROR: {data.get('message')} | hint: {data.get('hint')}")
    else:
        print(f"   ✓ OK ({len(data)} rows)")
except:
    print(f"   {r.stdout[:200]}")

# 5c) Organization fetch
print("  5c) Organization fetch:")
r = subprocess.run(['curl', '-s',
    f'{url}/organizations?id=eq.{oid}&select=id,name,ai_usage_current,subscription_status,plan_tier,smart_sending_enabled',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, dict) and 'code' in data:
        print(f"   ✗ ERROR: {data.get('message')} | hint: {data.get('hint')}")
    else:
        print(f"   ✓ OK ({len(data)} rows)")
except:
    print(f"   {r.stdout[:200]}")

# 5d) Recipient fetch
print("  5d) Recipient fetch:")
r = subprocess.run(['curl', '-s',
    f'{url}/campaign_recipients?campaign_id=eq.{cid}&lead_id=eq.{lead_id}&select=id,status,current_step,last_sent_at',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, dict) and 'code' in data:
        print(f"   ✗ ERROR: {data.get('message')} | hint: {data.get('hint')}")
    else:
        print(f"   ✓ OK ({len(data)} rows)")
except:
    print(f"   {r.stdout[:200]}")

# 5e) Analytics (subscription check)
print("  5e) Analytics daily fetch:")
r = subprocess.run(['curl', '-s',
    f'{url}/analytics_daily?org_id=eq.{oid}&date=gte.2026-04-01&select=sent_count',
    '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    if isinstance(data, dict) and 'code' in data:
        print(f"   ✗ ERROR: {data.get('message')} | hint: {data.get('hint')}")
    else:
        print(f"   ✓ OK ({len(data)} rows)")
except:
    print(f"   {r.stdout[:200]}")

# 5f) Check RPCs
print("  5f) RPCs:")
for rpc_name, params in [
    ('increment_campaign_stat', {'campaign_id_param': cid, 'column_param': 'sent_count'}),
    ('increment_server_usage', {'server_id_param': '7a0741c6-4678-4863-9a1e-26c888e5fae4'}),
    ('increment_mailbox_usage', {'mailbox_id_param': '2320ab0b-2a0c-4e23-9c37-870ab558f96d'}),
]:
    r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
        '-X', 'POST',
        f'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1/rpc/{rpc_name}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps(params)
    ], capture_output=True, text=True)
    status = r.stdout.strip()
    print(f"   {rpc_name}: HTTP {status}")
