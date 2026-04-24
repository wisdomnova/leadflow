#!/usr/bin/env python3
"""Bulk cancel ALL email-processor runs to clear the 1.45M queue backlog.
Uses a future started_before to catch everything."""
import re, subprocess, json, datetime

with open('/Users/user/leadflow/.env') as f:
    text = f.read()
sk = re.search(r'INNGEST_SIGNING_KEY="([^"]+)"', text).group(1)

# Create cancellation with far-future started_before to catch all runs
future = datetime.datetime.now(datetime.timezone.utc).isoformat()
print(f"Creating cancellation for ALL email-processor runs (started_before={future})")

r = subprocess.run(['curl', '-s', '-X', 'POST',
    'https://api.inngest.com/v1/cancellations',
    '-H', f'Authorization: Bearer {sk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({
        'app_id': 'leadflow-app',
        'function_id': 'leadflow-app-email-processor',
        'started_before': future
    })], capture_output=True, text=True)
print(f"  email-processor: {r.stdout[:200]}")
ep_data = json.loads(r.stdout)
cancel_id_ep = ep_data.get('data', {}).get('id', '?') if ep_data.get('data') else f"ERROR: {r.stdout[:100]}"

# Also cancel campaign-sweep to prevent re-dispatching while we clean up
r = subprocess.run(['curl', '-s', '-X', 'POST',
    'https://api.inngest.com/v1/cancellations',
    '-H', f'Authorization: Bearer {sk}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({
        'app_id': 'leadflow-app',
        'function_id': 'leadflow-app-campaign-sweep',
        'started_before': future
    })], capture_output=True, text=True)
print(f"  campaign-sweep: {r.stdout[:200]}")
cs_data = json.loads(r.stdout)
cancel_id_cs = cs_data.get('data', {}).get('id', '?') if cs_data.get('data') else f"ERROR: {r.stdout[:100]}"

print(f"\nCancellation IDs:")
print(f"  email-processor: {cancel_id_ep}")
print(f"  campaign-sweep: {cancel_id_cs}")
print(f"\nWait ~2 minutes for queue to drain, then run delete_and_restart.py")
