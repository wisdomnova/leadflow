#!/usr/bin/env python3
"""Re-create cancellation for old email-processor runs.
Second push will change trigger to campaign/email.send, new runs won't be affected."""
import re, subprocess, json, datetime

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)

now = datetime.datetime.now(datetime.timezone.utc).isoformat()
print(f"Creating cancellation for email-processor (started_before={now})")

r = subprocess.run(['curl', '-s', '-X', 'POST',
    'https://api.inngest.com/v1/cancellations',
    '-H', f'Authorization: Bearer {sk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({
        'app_id': 'leadflow-app',
        'function_id': 'leadflow-app-email-processor',
        'started_before': now
    })], capture_output=True, text=True)
print(f"  Result: {r.stdout[:200]}")

# Verify
r = subprocess.run(['curl', '-s', 'https://api.inngest.com/v1/cancellations',
    '-H', f'Authorization: Bearer {sk}'], capture_output=True, text=True)
data = json.loads(r.stdout)
print(f"\nActive cancellations: {len(data.get('data', []))}")
for c in data.get('data', []):
    print(f"  id={c['id']} fn={c.get('function_id','?')} before={c.get('started_before','?')[:19]}")

print("\nOnce second push deploys (campaign/email.send trigger):")
print("  - Old email.process runs will be cancelled by this rule")
print("  - New email.send runs will start fresh (after cancellation time)")
print("  - DELETE this cancellation once queue is clear")
