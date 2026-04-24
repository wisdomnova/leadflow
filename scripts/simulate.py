#!/usr/bin/env python3
"""Simulate exactly what emailProcessor does step by step to find the error."""
import re, subprocess, json, smtplib, ssl, time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

with open('/Users/user/leadflow/.env') as f:
    text = f.read()

anon = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"', text).group(1)
srk = re.search(r'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"', text).group(1)
url = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1'
rpc = 'https://eqksgmbcyvfllcaeqgbj.supabase.co/rest/v1/rpc'

cid = 'd989f357-39cb-4d99-a3cd-56a36e2562be'
oid = '64209895-565d-4974-9d41-3f39d1a1b467'

def api(path):
    r = subprocess.run(['curl', '-s', f'{url}/{path}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}'
    ], capture_output=True, text=True)
    return json.loads(r.stdout)

def rpc_call(name, data):
    r = subprocess.run(['curl', '-s', '-X', 'POST', f'{rpc}/{name}',
        '-H', f'apikey: {anon}', '-H', f'Authorization: Bearer {srk}',
        '-H', 'Content-Type: application/json', '-d', json.dumps(data)
    ], capture_output=True, text=True)
    return json.loads(r.stdout)

# ── Step 1: Get a test recipient ─────────────────────────────────────────
recs = api(f'campaign_recipients?campaign_id=eq.{cid}&status=eq.active&last_sent_at=is.null&select=lead_id&limit=1')
lead_id = recs[0]['lead_id']
print(f"Test lead_id: {lead_id}")
step_idx = 0

# ── Step 2: Preflight check (same as emailProcessor) ────────────────────
print("\n── PREFLIGHT CHECK ──")
camp_status = api(f'campaigns?id=eq.{cid}&select=status')
print(f"  Campaign status: {camp_status[0]['status']}")
recip = api(f'campaign_recipients?campaign_id=eq.{cid}&lead_id=eq.{lead_id}&select=status,last_sent_at,current_step')
print(f"  Recipient: {recip[0]}")

# ── Step 3: Fetch details (same queries as emailProcessor) ──────────────
print("\n── FETCH DETAILS ──")
campaign = api(f'campaigns?id=eq.{cid}&select=id,steps,status,use_powersend,powersend_config,powersend_server_ids,sender_id,sender_ids,config,name,org_id,sent_count,total_leads')[0]
print(f"  Campaign: {campaign['name']}, use_powersend={campaign['use_powersend']}")

lead = api(f'leads?id=eq.{lead_id}&select=id,email,first_name,last_name,company,job_title,city,country,timezone,phone,custom_fields,tags,status,org_id,source,sentiment')[0]
print(f"  Lead: {lead['email']}, {lead['first_name']} {lead['last_name']} at {lead['company']}")

org = api(f'organizations?id=eq.{oid}&select=id,name,ai_usage_current,subscription_status,plan_tier,smart_sending_enabled')[0]
print(f"  Org: {org['name']}, sub={org['subscription_status']}, tier={org['plan_tier']}")

# ── Step 4: Subscription check ──────────────────────────────────────────
print("\n── SUBSCRIPTION CHECK ──")
print(f"  subscription_status: {org['subscription_status']}")
print(f"  plan_tier: {org['plan_tier']}")
active = org['subscription_status'] in ['active', 'canceling', 'past_due', 'trialing']
print(f"  active: {active}")

# ── Step 5: Volume check ────────────────────────────────────────────────
print("\n── VOLUME CHECK ──")
from datetime import datetime
first_of_month = datetime.now().strftime('%Y-%m-01')
usage = api(f'analytics_daily?org_id=eq.{oid}&date=gte.{first_of_month}&select=sent_count')
monthly_vol = sum(u.get('sent_count', 0) for u in usage)
print(f"  Monthly volume: {monthly_vol}")
limits = {'starter': 10000, 'pro': 100000, 'enterprise': 500000}
limit = limits.get(org['plan_tier'], 10000)
print(f"  Limit ({org['plan_tier']}): {limit}")
print(f"  Under limit: {monthly_vol < limit}")

# ── Step 6: PowerSend node selection ─────────────────────────────────────
print("\n── POWERSEND NODE SELECTION ──")
ps_server_ids = campaign.get('powersend_server_ids', [])
ps_config = campaign.get('powersend_config', {})
server_filter = ps_server_ids if ps_server_ids else ([ps_config['server_id']] if ps_config.get('server_id') else None)
print(f"  Server filter: {server_filter}")

node = rpc_call('get_next_powersend_node', {
    'org_id_param': oid,
    'server_ids_param': server_filter
})
if isinstance(node, list) and node:
    node = node[0]
    print(f"  Node: {node['name']} (id={node['id'][:8]})")
    print(f"  current_usage: {node['current_usage']}/{node['daily_limit']}")
else:
    print(f"  ERROR: No node returned! {node}")
    exit(1)

# ── Step 7: Pool mailbox selection ───────────────────────────────────────
print("\n── POOL MAILBOX SELECTION ──")
mb = rpc_call('get_next_pool_mailbox', {'server_id_param': node['id']})
if isinstance(mb, list) and mb:
    mb = mb[0]
    print(f"  Mailbox: {mb['email']}")
    print(f"  SMTP: {mb['smtp_host']}:{mb['smtp_port']}")
    print(f"  Username: {mb['smtp_username']}")
    print(f"  Password: {'SET' if mb.get('smtp_password') else 'EMPTY'} ({len(mb.get('smtp_password', ''))} chars)")
    print(f"  Display name: {mb.get('display_name', 'N/A')}")
else:
    print(f"  ERROR: No mailbox returned! {mb}")
    exit(1)

# ── Step 8: Build account object (same as emailProcessor) ───────────────
print("\n── BUILD ACCOUNT OBJECT ──")
mb_id = mb.get('mailbox_id', mb.get('id'))
account = {
    'id': mb_id,
    'email': mb['email'],
    'from_name': mb.get('display_name') or mb['email'].split('@')[0],
    'provider': 'custom_smtp',
    'config': {
        'smtpHost': mb['smtp_host'],
        'smtpPort': str(mb.get('smtp_port', '465')),
        'smtpUser': mb['smtp_username'],
        'smtpPass': mb['smtp_password'],
    }
}
print(f"  Account ID: {account['id']}")
print(f"  Email: {account['email']}")
print(f"  From name: {account['from_name']}")
print(f"  SMTP: {account['config']['smtpHost']}:{account['config']['smtpPort']}")
print(f"  User: {account['config']['smtpUser']}")
print(f"  Pass: {'*' * len(account['config'].get('smtpPass', ''))}")

# ── Step 9: Process email template ──────────────────────────────────────
print("\n── EMAIL TEMPLATE ──")
step_data = campaign['steps'][step_idx]
subject = step_data['subject']
body = step_data['body']
print(f"  Subject template: {subject}")
print(f"  Body template (first 100): {body[:100]}...")

# Variable replacement
for key in ['first_name', 'last_name', 'company', 'job_title', 'city', 'country', 'email']:
    val = lead.get(key, '')
    subject = subject.replace(f'{{{{{key}}}}}', str(val) if val else '')
    body = body.replace(f'{{{{{key}}}}}', str(val) if val else '')

# Defaults
subject = subject.replace('{{first_name}}', 'there').replace('{{company}}', 'your company')
body = body.replace('{{first_name}}', 'there').replace('{{company}}', 'your company')

print(f"  Processed subject: {subject}")
print(f"  Processed body (first 100): {body[:100]}...")

# ── Step 10: Try SMTP connection ─────────────────────────────────────────
print("\n── SMTP CONNECTION TEST ──")
smtp_host = account['config']['smtpHost']
smtp_port = int(account['config']['smtpPort'])
smtp_user = account['config']['smtpUser']
smtp_pass = account['config']['smtpPass']

print(f"  Connecting to {smtp_host}:{smtp_port}...")
try:
    if smtp_port == 465:
        context = ssl.create_default_context()
        server = smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=10)
    else:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
    
    print(f"  Connected! Server greeting: {server.ehlo_resp[:100] if server.ehlo_resp else 'N/A'}")
    
    print(f"  Logging in as {smtp_user}...")
    server.login(smtp_user, smtp_pass)
    print(f"  Login successful!")
    
    # Just test connection, don't actually send
    server.quit()
    print(f"  SMTP connection test PASSED!")
    
except Exception as e:
    print(f"  SMTP ERROR: {type(e).__name__}: {e}")

print("\n" + "=" * 60)
print("SIMULATION COMPLETE")
