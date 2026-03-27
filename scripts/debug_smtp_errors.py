#!/usr/bin/env python3
"""Check SMTP error patterns."""
import json, urllib.request, time
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}

def get(path):
    for _ in range(3):
        try:
            req = urllib.request.Request(URL + "/" + path, headers=H)
            return json.loads(urllib.request.urlopen(req).read())
        except:
            time.sleep(1)
    return []

# Get email_failed entries
fails = get("activity_log?action_type=eq.email_failed&order=created_at.desc&limit=50&select=description,metadata")

errors = {}
for f in fails:
    err = (f.get("metadata") or {}).get("error", f.get("description", ""))
    if "553" in err:
        key = "553 rejected"
    elif "550" in err:
        key = "550 error"
    elif "554" in err:
        key = "554 error"
    elif "timeout" in err.lower():
        key = "timeout"
    else:
        key = err[:80]
    errors[key] = errors.get(key, 0) + 1

print("Error distribution:")
for k, v in sorted(errors.items(), key=lambda x: -x[1]):
    print("  %s: %d" % (k, v))

# Full 553 error
for f in fails:
    err = (f.get("metadata") or {}).get("error", "")
    if "553" in err:
        print("\nFull 553 error: " + err)
        break

# Full non-553 errors
for f in fails:
    err = (f.get("metadata") or {}).get("error", "")
    if "553" not in err and err:
        print("\nFull other error: " + err)
        break
