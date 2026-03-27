#!/usr/bin/env python3
"""Check all mailboxes for both servers to see if some have mismatched email/smtp_user."""
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

def get_all(path):
    results = []
    offset = 0
    while True:
        try:
            sep = "&" if "?" in path else "?"
            req = urllib.request.Request(URL + "/" + path + sep + "offset=" + str(offset) + "&limit=1000", headers=H)
            page = json.loads(urllib.request.urlopen(req).read())
            results.extend(page)
            if len(page) < 1000:
                break
            offset += 1000
        except Exception as e:
            print("Error: " + str(e))
            break
    return results

for sid in SERVERS:
    print("=== Server " + sid[:8] + " ===")
    mbs = get_all("server_mailboxes?server_id=eq." + sid + "&select=id,email,smtp_username,smtp_host,status,current_usage,total_sends")
    print("  Total mailboxes: " + str(len(mbs)))
    
    mismatched = 0
    for mb in mbs:
        if mb.get("email") != mb.get("smtp_username"):
            mismatched += 1
            print("  MISMATCH: email=" + str(mb.get("email")) + " smtp_user=" + str(mb.get("smtp_username")))
    
    if mismatched == 0:
        print("  All email/smtp_username match")
    
    # Check SMTP hosts
    hosts = {}
    for mb in mbs:
        h = mb.get("smtp_host", "none")
        hosts[h] = hosts.get(h, 0) + 1
    print("  SMTP hosts: " + str(hosts))
    
    # Check statuses
    statuses = {}
    for mb in mbs:
        s = mb.get("status", "unknown")
        statuses[s] = statuses.get(s, 0) + 1
    print("  Statuses: " + str(statuses))
    
    # Sample first 5
    print("  Sample mailboxes:")
    for mb in mbs[:5]:
        print("    " + str(mb.get("email")) + " | smtp=" + str(mb.get("smtp_host")) + " | status=" + str(mb.get("status")) + " | sends=" + str(mb.get("total_sends")))
    print()

# Now test: what account does the email processor code build?
# The error says FROM daniel@deliverabilitytryleadflow.com but authenticated as alex@mailfromleadflow.xyz
# This suggests different servers/mailboxes are being mixed
# Check if the RPC returns mailboxes from DIFFERENT servers
print("=== Check if servers share SMTP hosts ===")
all_mbs = get_all("server_mailboxes?select=server_id,smtp_host&limit=200")
server_hosts = {}
for mb in all_mbs:
    sid = mb.get("server_id", "?")[:8]
    h = mb.get("smtp_host", "?")
    key = sid + " -> " + h
    server_hosts[key] = server_hosts.get(key, 0) + 1
for k, v in sorted(server_hosts.items()):
    print("  " + k + ": " + str(v))
