#!/usr/bin/env python3
"""Check Inngest runs for email-processor."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)

def api(path):
    r = subprocess.run(['curl', '-s', f'https://api.inngest.com/v1/{path}',
        '-H', f'Authorization: Bearer {sk}'], capture_output=True, text=True)
    return json.loads(r.stdout) if r.stdout else {}

# Check recent email-processor runs
runs = api('events?name=campaign/email.process&limit=3')
print("Recent campaign/email.process events:")
events = runs.get('data', [])
for e in events[:3]:
    eid = e.get('id', '?')
    ts = e.get('received_at', e.get('ts', '?'))
    print(f"  event {eid} at {str(ts)[:19]}")

# Check for any recent runs
print("\nRecent runs (any function):")
r = subprocess.run(['curl', '-s', 'https://api.inngest.com/v1/events?limit=5',
    '-H', f'Authorization: Bearer {sk}'], capture_output=True, text=True)
data = json.loads(r.stdout)
for e in data.get('data', [])[:5]:
    print(f"  {e.get('name','?')} at {str(e.get('received_at', e.get('ts','?')))[:19]} id={e.get('id','?')[:20]}")

# Check cancellations one more time
c = api('cancellations')
print(f"\nCancellations: {len(c.get('data', []))}")
