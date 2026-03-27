#!/usr/bin/env python3
"""Check PowerSend servers and mailboxes for the campaign."""
import json, urllib.request
from pathlib import Path

env = {}
for line in Path(__file__).resolve().parent.parent.joinpath(".env").read_text().splitlines():
    if line.strip() and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"')

URL = "https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1"
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
ORG = "64209895-565d-4974-9d41-3f39d1a1b467"
SERVERS = ["01ce1936-1c3d-4554-a2fb-34a13deb04a6", "782e5d31-2f43-4979-9ab2-3131f31dd101"]

def get(path):
    req = urllib.request.Request(f"{URL}/{path}", headers=H)
    return json.loads(urllib.request.urlopen(req).read())

# 1. Check PowerSend servers
print("=== PowerSend Servers ===")
for sid in SERVERS:
    try:
        servers = get(f"powersend_servers?id=eq.{sid}&select=*")
        if servers:
            s = servers[0]
            for k, v in s.items():
                if k not in ('smtp_config', 'api_key'):
                    print(f"  {k}: {v}")
                elif k == 'smtp_config':
                    # redact password
                    config = v or {}
                    redacted = {kk: ('***' if 'pass' in kk.lower() else vv) for kk, vv in config.items()}
                    print(f"  smtp_config: {redacted}")
            print()
        else:
            print(f"  Server {sid}: NOT FOUND")
    except Exception as e:
        print(f"  Server {sid} error: {e}")

# 2. Check mailbox pools
print("=== Mailbox Pools ===")
for sid in SERVERS:
    try:
        mailboxes = get(f"powersend_mailboxes?server_id=eq.{sid}&select=*")
        print(f"\n  Server {sid}: {len(mailboxes)} mailboxes")
        for mb in mailboxes[:3]:
            for k, v in mb.items():
                if 'pass' not in k.lower():
                    print(f"    {k}: {v}")
            print()
    except Exception as e:
        print(f"  Mailboxes for {sid} error: {e}")

# 3. Test the RPC function
print("\n=== Test get_next_powersend_node RPC ===")
try:
    import urllib.request
    req_data = json.dumps({"org_id_param": ORG, "server_ids_param": SERVERS}).encode()
    req = urllib.request.Request(f"{URL}/rpc/get_next_powersend_node", data=req_data, headers=H, method="POST")
    result = json.loads(urllib.request.urlopen(req).read())
    print(f"  Result: {result}")
except Exception as e:
    print(f"  RPC error: {e}")
    # Try to read error body
    try:
        import traceback
        traceback.print_exc()
    except:
        pass

# 4. Test get_next_pool_mailbox RPC with first server
print("\n=== Test get_next_pool_mailbox RPC ===")
for sid in SERVERS:
    try:
        req_data = json.dumps({"server_id_param": sid}).encode()
        req = urllib.request.Request(f"{URL}/rpc/get_next_pool_mailbox", data=req_data, headers=H, method="POST")
        result = json.loads(urllib.request.urlopen(req).read())
        print(f"  Server {sid}: {result}")
    except Exception as e:
        print(f"  Server {sid} RPC error: {e}")
