#!/usr/bin/env python3
"""Check mailbox pool data to understand the SMTP mismatch."""
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
SERVERS = ["01ce1936-1c3d-4554-a2fb-34a13deb04a6", "782e5d31-2f43-4979-9ab2-3131f31dd101"]

def rpc(name, params):
    for _ in range(3):
        try:
            data = json.dumps(params).encode()
            req = urllib.request.Request(URL + "/rpc/" + name, data=data, headers=H, method="POST")
            return json.loads(urllib.request.urlopen(req).read())
        except Exception as e:
            print("  RPC error: " + str(e))
            time.sleep(1)
    return None

# Test get_next_pool_mailbox multiple times to see rotation
for sid in SERVERS:
    print("=== Server " + sid[:8] + " ===")
    for i in range(3):
        result = rpc("get_next_pool_mailbox", {"server_id_param": sid})
        if result and len(result) > 0:
            mb = result[0] if isinstance(result, list) else result
            print("  Call %d: email=%s smtp_user=%s smtp_host=%s" % (
                i+1,
                mb.get("email", "?"),
                mb.get("smtp_username", "?"),
                mb.get("smtp_host", "?"),
            ))
        else:
            print("  Call %d: no result" % (i+1))
    print()

# Also check: does the mailbox email match the smtp_username?
print("=== Checking ALL mailboxes for email vs smtp_username mismatch ===")
for sid in SERVERS:
    # We need to query the mailboxes table directly
    # First find the table name
    pass

# Try powersend_mailboxes
def get(path):
    for _ in range(3):
        try:
            req = urllib.request.Request(URL + "/" + path, headers=H)
            return json.loads(urllib.request.urlopen(req).read())
        except Exception as e:
            print("  GET error: " + str(e))
            time.sleep(1)
    return []

# Try different table names
for table in ["powersend_mailboxes", "mailboxes", "server_mailboxes", "warmup_mailboxes"]:
    try:
        result = get(table + "?limit=1&select=*")
        if result:
            print("Found table: " + table)
            print("  Columns: " + str(list(result[0].keys())))
            break
    except:
        pass

# Check RPC function definition
print("\n=== get_next_pool_mailbox return fields ===")
result = rpc("get_next_pool_mailbox", {"server_id_param": SERVERS[0]})
if result:
    r = result[0] if isinstance(result, list) else result
    for k, v in r.items():
        val = str(v)
        if "pass" in k.lower():
            val = "***"
        print("  " + k + ": " + val)
