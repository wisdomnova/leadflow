#!/usr/bin/env python3
"""Check Inngest API thoroughly for email-processor run status."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)
ek = re.search(r'INNGEST_EVENT_KEY="([^"]+)"', text).group(1)

def api(path, method='GET', data=None):
    args = ['curl', '-s']
    if method != 'GET':
        args += ['-X', method]
    args += [f'https://api.inngest.com/v1/{path}',
             '-H', f'Authorization: Bearer {sk}']
    if data:
        args += ['-H', 'Content-Type: application/json', '-d', json.dumps(data)]
    r = subprocess.run(args, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except:
        return {'raw': r.stdout[:500]}

# 1. Check recent events
print("=== RECENT EVENTS (last 5) ===")
events = api('events?limit=5')
for e in events.get('data', []):
    print(f"  {e.get('name','?')} | received={str(e.get('received_at',''))[:19]} | id={e.get('id','?')[:24]}")
    if 'data' in e and isinstance(e['data'], dict):
        print(f"    data: {json.dumps(e['data'])[:120]}")

# 2. Check cancellations  
print("\n=== CANCELLATIONS ===")
c = api('cancellations')
print(f"  Count: {len(c.get('data', []))}")

# 3. Try to list functions (if endpoint exists)
print("\n=== FUNCTIONS ===")
for endpoint in ['functions', 'apps', 'apps/leadflow-app/functions']:
    result = api(endpoint)
    if 'data' in result and isinstance(result['data'], list):
        print(f"  {endpoint}: {len(result['data'])} items")
        for fn in result['data'][:3]:
            print(f"    {fn.get('name', fn.get('id', '?'))}: {fn.get('status', '?')}")
        break
    elif 'raw' in result:
        print(f"  {endpoint}: {result['raw'][:100]}")
    else:
        print(f"  {endpoint}: {json.dumps(result)[:150]}")

# 4. Send a TAGGED test event and immediately check for its run
import time
tag = f"test-{int(time.time())}"
print(f"\n=== TAGGED TEST EVENT ({tag}) ===")
r = subprocess.run(['curl', '-s', '-X', 'POST', f'https://inn.gs/e/{ek}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps([{
        'name': 'campaign/email.process',
        'data': {
            'campaignId': 'd989f357-39cb-4d99-a3cd-56a36e2562be',
            'leadId': '0112361d-caee-4b17-aa56-6bb489946beb',
            'stepIdx': 0,
            'orgId': '64209895-565d-4974-9d41-3f39d1a1b467',
            '_tag': tag
        }
    }])], capture_output=True, text=True)
print(f"  Send result: {r.stdout[:200]}")
event_id = json.loads(r.stdout).get('ids', ['?'])[0]

# Check the event's runs
print(f"\n  Waiting 10s...")
time.sleep(10)
runs = api(f'events/{event_id}/runs')
print(f"  Runs for event {event_id[:20]}:")
if isinstance(runs, dict) and 'data' in runs:
    for run in runs.get('data', []):
        print(f"    run_id={run.get('run_id', run.get('id', '?'))[:20]} status={run.get('status','?')} fn={run.get('function_id','?')}")
        if 'output' in run:
            print(f"      output: {json.dumps(run['output'])[:200]}")
elif isinstance(runs, dict):
    print(f"    Response: {json.dumps(runs)[:300]}")

# Wait a bit more
print(f"\n  Waiting 20 more seconds...")
time.sleep(20)
runs = api(f'events/{event_id}/runs')
print(f"  Runs for event {event_id[:20]} (after 30s total):")
if isinstance(runs, dict) and 'data' in runs:
    for run in runs.get('data', []):
        print(f"    run_id={run.get('run_id', run.get('id', '?'))[:20]} status={run.get('status','?')} fn={run.get('function_id','?')}")
        if 'output' in run:
            print(f"      output: {json.dumps(run['output'])[:200]}")
elif isinstance(runs, dict):
    print(f"    Response: {json.dumps(runs)[:300]}")
