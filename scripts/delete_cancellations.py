#!/usr/bin/env python3
"""Delete Inngest cancellation rules and verify."""
import re, subprocess, json

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)

def api(method, path):
    args = ['curl', '-s']
    if method != 'GET':
        args += ['-X', method]
    args += [f'https://api.inngest.com/v1/{path}', '-H', f'Authorization: Bearer {sk}']
    r = subprocess.run(args, capture_output=True, text=True)
    return r.stdout

# List current
data = json.loads(api('GET', 'cancellations'))
cancellations = data.get('data', [])
print(f"Current cancellations: {len(cancellations)}")
for c in cancellations:
    print(f"  id={c['id']} fn={c.get('function_id','?')}")

# Delete all
for c in cancellations:
    result = api('DELETE', f"cancellations/{c['id']}")
    print(f"  DELETE {c['id']}: {result[:80]}")

# Verify
remaining = json.loads(api('GET', 'cancellations')).get('data', [])
print(f"Remaining: {len(remaining)}")
