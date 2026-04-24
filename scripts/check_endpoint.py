#!/usr/bin/env python3
"""Check if Inngest can reach the serve endpoint."""
import re, subprocess, json

# 1) Test the serve endpoint directly
print("1) GET /api/inngest (function registration):")
r = subprocess.run(['curl', '-sv', '-o', '/dev/null', '-w', '\n%{http_code}',
    'https://tryleadflow.ai/api/inngest'
], capture_output=True, text=True)
print(f"   HTTP: {r.stdout.strip()}")
# Check if there are any TLS or connection issues in stderr
for line in r.stderr.split('\n'):
    if any(x in line.lower() for x in ['ssl', 'tls', 'error', 'refused', 'timeout', 'certificate', 'subject']):
        print(f"   {line.strip()}")

# 2) Test POST to the serve endpoint (what Inngest does to execute functions)
print("\n2) POST /api/inngest (simulating Inngest callback):")
r = subprocess.run(['curl', '-s', '-X', 'POST',
    'https://tryleadflow.ai/api/inngest',
    '-H', 'Content-Type: application/json',
    '-d', '{"test": true}',
    '-w', '\nHTTP: %{http_code}\nTime: %{time_total}s'
], capture_output=True, text=True)
print(f"   {r.stdout}")

# 3) Check app health
print("\n3) App health check:")
r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code} (%{time_total}s)',
    'https://tryleadflow.ai/'
], capture_output=True, text=True)
print(f"   Homepage: HTTP {r.stdout}")

r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code} (%{time_total}s)',
    'https://tryleadflow.ai/api/inngest'
], capture_output=True, text=True)
print(f"   Inngest endpoint: HTTP {r.stdout}")

# 4) DNS check 
print("\n4) DNS resolution:")
r = subprocess.run(['dig', '+short', 'tryleadflow.ai'], capture_output=True, text=True)
print(f"   tryleadflow.ai -> {r.stdout.strip()}")

# 5) Check if the last deployment was recent
print("\n5) Checking serve endpoint metadata:")
r = subprocess.run(['curl', '-s', 'https://tryleadflow.ai/api/inngest'], capture_output=True, text=True)
print(f"   {r.stdout}")

# 6) Try the PUT sync again to see if it reveals issues 
print("\n6) PUT sync (re-register):")
r = subprocess.run(['curl', '-sv',
    '-X', 'PUT',
    'https://tryleadflow.ai/api/inngest',
    '-H', 'Content-Type: application/json',
    '-w', '\nHTTP: %{http_code}'
], capture_output=True, text=True)
print(f"   Response: {r.stdout}")
for line in r.stderr.split('\n'):
    if any(x in line.lower() for x in ['< http', 'error', 'failed']):
        print(f"   {line.strip()}")

# 7) Check if we're deployed to the right code version
# The app should have 19 functions as of the latest code
print("\n7) Function count check:")
r = subprocess.run(['curl', '-s', 'https://tryleadflow.ai/api/inngest'], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    print(f"   function_count: {data.get('function_count')}")
    print(f"   mode: {data.get('mode')}")
    print(f"   has_event_key: {data.get('has_event_key')}")
    print(f"   has_signing_key: {data.get('has_signing_key')}")
except:
    print(f"   {r.stdout[:300]}")

# 8) Check if maybe the app URL is different from what Inngest expects
with open('/Users/user/leadflow/.env') as f:
    text = f.read()
inngest_url = re.search(r'INNGEST_BASE_URL="([^"]+)"', text)
app_url = re.search(r'NEXT_PUBLIC_APP_URL="([^"]+)"', text)
print(f"\n8) Environment URLs:")
print(f"   NEXT_PUBLIC_APP_URL: {app_url.group(1) if app_url else 'NOT SET'}")
print(f"   INNGEST_BASE_URL: {inngest_url.group(1) if inngest_url else 'NOT SET'}")

# The Inngest SDK needs to know its serve URL. Check if INNGEST_SERVE_URL is set
serve_url = re.search(r'INNGEST_SERVE_URL="([^"]+)"', text)
print(f"   INNGEST_SERVE_URL: {serve_url.group(1) if serve_url else 'NOT SET'}")
