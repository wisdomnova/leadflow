# Campaign Management System - Complete Reference

A production-ready campaign system with lifecycle management, pausing/resuming, and advanced sequence capabilities.

## Quick Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Campaign Lifecycle                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CREATE                    LAUNCH               MONITORING       │
│  ├─ Draft                  ├─ Queued            ├─ Sending       │
│  │  (being composed)        │  (waiting to       │  (in progress) │
│  │                          │   send)            │                │
│  └─ Ready to               ├─ Scheduled         ├─ Completed     │
│     customize              │  (future time)      │  (all sent)    │
│                            │                     │                │
│  CONTROLS                  ACTIONS               END STATE        │
│  • Add recipients          • PAUSE               • View analytics │
│  • Set email details       • RESUME              • Track replies  │
│  • Configure from/reply    • STOP (irreversible) • Archive        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Campaign Lifecycle States

### Draft
- **What it means**: Campaign is being created/edited
- **What you can do**:
  - Edit all campaign settings (name, subject, body, from, reply-to)
  - Add/remove recipients
  - Create sequences if it's a drip campaign
  - Send to launch campaign
- **Cannot do**: Pause, resume, stop
- **Transition**: → Queued (send now) or Scheduled (send later)

### Queued
- **What it means**: Campaign is waiting to send immediately
- **What you can do**:
  - Pause (temporarily stop sends)
  - Stop (cancel permanently)
  - View analytics as emails send
- **Cannot do**: Edit campaign or recipients
- **Auto-transition**: → Sending (as emails process) → Completed (all sent)

### Scheduled
- **What it means**: Campaign is set to send at a specific future time
- **What you can do**:
  - Pause (stop it before it sends)
  - Stop (cancel without sending)
  - Edit scheduled_for time
  - View analytics once sending starts
- **Cannot do**: Edit recipients or email content
- **Auto-transition**: → Queued (when scheduled time arrives) → Sending → Completed

### Paused
- **What it means**: Campaign was sending but you paused it
- **What you can do**:
  - Resume (continue from where it left off)
  - Stop (abandon campaign permanently)
  - View partial analytics
- **Cannot do**: Edit campaign while paused
- **Key difference from Stop**: Can be resumed; pending sends stay pending (not skipped)

### Stopped
- **What it means**: Campaign has been permanently cancelled
- **What you can do**:
  - View final analytics
  - View what was actually sent
  - Cannot resume
- **What happens**:
  - All pending emails marked "skipped"
  - Already-sent emails remain as-is
  - Cannot be undone
- **Use case**: Campaign completed early, or you need to stop for compliance/legal reasons

### Completed
- **What it means**: Campaign finished (all emails sent or max retries exceeded)
- **What you can do**:
  - View full analytics
  - View replies
  - Export data
  - Delete for cleanup
- **Cannot do**: Edit or modify anything

### Sending
- **What it means**: Actively sending emails
- **What you can do**:
  - Pause (stop sends and continue later)
  - View real-time analytics
- **Cannot do**: Edit recipients or content
- **Auto-transition**: → Completed (when all sent)

---

## Campaign Controls: Pause vs Stop vs Delete

### PAUSE (Reversible)
```
Pause a campaign to temporarily halt sends.

When you pause:
- Campaign status → "paused"
- Already-sent emails stay sent (unchanged)
- Pending sends wait (marked "pending" in campaign_sends)
- Can click Resume to continue

Best for:
- Quick break to check something
- Waiting for approval before continuing
- Testing before broader send
- Recovering from email service issues
```

**Example Flow**:
```
1. Campaign sending 1000 emails
2. After 300 sent, you pause
3. 300 emails sent ✓
4. 700 emails pending (waiting)
5. Click Resume → continues from email #301
```

### STOP (Permanent)
```
Stop a campaign to cancel it permanently.

When you stop:
- Campaign status → "stopped"
- Already-sent emails stay sent (unchanged)
- All pending sends marked "skipped"
- Cannot resume (this action is permanent)
- Logged in status_history table

Best for:
- Campaign completed but you missed the end date
- Legal/compliance issues require immediate halt
- Recipient list was wrong
- Email content had critical error detected
```

**Example Flow**:
```
1. Campaign queued to send 1000 emails
2. You click Stop for compliance reason
3. 0 emails sent (was queued, not started)
4. 1000 emails marked "skipped" (not sent)
5. Campaign archived with "stopped" status
```

### DELETE (Remove From System)
```
Delete removes campaign entirely from database.

Use after:
- Campaign is completed and archived
- Stopped campaign is old and no longer needed
- Cleanup for old test campaigns
```

---

## Campaign Sequences (Drip Campaigns)

Run multi-email campaigns automatically. Send 1 email today, another in 3 days, a third in 7 days.

### How Sequences Work

Each campaign can have multiple "sequences" - sequential emails:

```
Sequence Email #1
└─ Send immediately when campaign launches
   └─ If opens within 2 days: continue to #2
      
Sequence Email #2
└─ Wait 3 days after #1 sent
└─ Send follow-up email
   └─ If no reply after 1 day: continue to #3
   
Sequence Email #3
└─ Wait 2 days after #2 sent
└─ Final follow-up
└─ If no reply: mark as complete
```

### Creating a Sequence Campaign

**Step 1**: Create campaign (Draft)

**Step 2**: Add recipients (who will receive the sequence)

**Step 3**: Add sequences
- Call `POST /api/campaigns/[id]/sequences`
- Define first email with delay_days/delay_hours
- Add second email with its delay
- Add third email with its delay

**Example Request**:
```bash
POST /api/campaigns/abc123/sequences

{
  "sequence_number": 1,
  "email_subject": "Quick Question: {{firstName}}",
  "email_body": "Hi {{firstName}},\n\nI wanted to reach...",
  "delay_days": 0,
  "delay_hours": 0,
  "enabled": true,
  "notes": "Initial outreach"
}

# Then add sequence 2
{
  "sequence_number": 2,
  "email_subject": "Following up on my earlier message",
  "email_body": "Hi {{firstName}},\n\nJust wanted to check...",
  "delay_days": 3,
  "delay_hours": 0,
  "enabled": true,
  "notes": "First follow-up"
}

# Then add sequence 3
{
  "sequence_number": 3,
  "email_subject": "Final thoughts from {{companyName}}",
  "email_body": "Hi {{firstName}},\n\nLast message...",
  "delay_days": 5,
  "delay_hours": 0,
  "enabled": true,
  "notes": "Final follow-up"
}
```

### Sequence Send Schedule

When campaign launches:

```
Contact: john@example.com

Timeline:
├─ Day 0, 9:00 AM  → Sequence #1 (initial outreach)
│                     ↓ (waits 3 days)
├─ Day 3, 9:00 AM  → Sequence #2 (follow-up)
│                     ↓ (waits 5 days)
├─ Day 8, 9:00 AM  → Sequence #3 (final)
│                     ↓ Complete

Database Tracking:
campaign_sequence_sends table:
- Row 1: contact=john, sequence=1, status=sent, sent_at=2024-01-01 09:00
- Row 2: contact=john, sequence=2, status=sent, sent_at=2024-01-04 09:00
- Row 3: contact=john, sequence=3, status=sent, sent_at=2024-01-09 09:00
```

### Sequence Delay Options

```
delay_days: 3        → wait 3 full days
delay_hours: 4       → additional 4 hours
send_on_day_of_week: "Monday"  → wait until Monday
send_at_time: "09:00"          → send at 9 AM (user's timezone)
```

**Examples**:
```
delay_days: 1, delay_hours: 0
→ Send exactly 24 hours later

delay_days: 0, delay_hours: 12
→ Send 12 hours later

delay_days: 3, send_on_day_of_week: "Monday"
→ Wait 3 days, but ensure it's a Monday

delay_days: 0, delay_hours: 0
→ Send immediately when previous email sent
```

### Sequence Analytics

Get per-sequence stats:

```bash
GET /api/campaigns/[id]/status

Response includes sequence_stats:
{
  "sequences": [
    {
      "sequence_number": 1,
      "total": 500,
      "sent": 500,
      "delivered": 485,
      "opened": 312,  ← 64% open rate on sequence 1
      "clicked": 47,
      "bounced": 15,
      "skipped": 0
    },
    {
      "sequence_number": 2,
      "total": 500,
      "sent": 312,   ← only 312 recipients (others didn't open #1)
      "delivered": 301,
      "opened": 156,  ← 50% open rate on sequence 2
      "clicked": 23,
      "bounced": 11,
      "skipped": 0
    },
    {
      "sequence_number": 3,
      "total": 500,
      "sent": 156,   ← only 156 recipients made it here
      "delivered": 148,
      "opened": 89,   ← 57% open rate on sequence 3
      "clicked": 18,
      "bounced": 8,
      "skipped": 0
    }
  ]
}
```

---

## REST API Endpoints

### Campaign Core Operations

**Create Campaign** (draft)
```bash
POST /api/campaigns
{
  "name": "Q1 Outreach",
  "email_subject": "Let's connect",
  "email_body": "Hi {{firstName}}..."
}
```

**Send Campaign** (launch queued or scheduled)
```bash
POST /api/campaigns/[id]/send
{
  "scheduled_at": "2024-02-15T09:00:00Z"  # optional
}
```

**Get Campaign Details**
```bash
GET /api/campaigns/[id]
→ Full campaign with all settings
```

**Get Campaign Status & Progress**
```bash
GET /api/campaigns/[id]/status
→ Status, send stats, sequence progress, action availability
```

**Update Campaign Settings**
```bash
PUT /api/campaigns/[id]
{
  "name": "Updated Name",
  "from_email": "sender@company.com",
  "reply_to": "replies@company.com"
}
```

### Campaign Controls

**Pause Campaign**
```bash
POST /api/campaigns/[id]/pause
→ Status: draft, queued, sending, scheduled
← Response: { "status": "paused", "paused_at": "..." }
```

**Resume Campaign**
```bash
POST /api/campaigns/[id]/resume
→ Status: paused (only)
← Response: { "status": "queued", "resumed_at": "..." }
```

**Stop Campaign**
```bash
POST /api/campaigns/[id]/stop
{
  "reason": "Compliance hold"  # optional
}
→ Status: Any except completed
← Response: { "status": "stopped", "skipped_count": 847 }
```

**Delete Campaign**
```bash
DELETE /api/campaigns/[id]
→ Status: draft, completed, stopped (not sending/queued/scheduled)
```

### Sequence Management

**List All Sequences**
```bash
GET /api/campaigns/[id]/sequences
← [ { sequence_number: 1, enabled: true, ... }, ... ]
```

**Add New Sequence**
```bash
POST /api/campaigns/[id]/sequences
{
  "sequence_number": 2,
  "email_subject": "Follow-up",
  "email_body": "Hi {{firstName}}...",
  "delay_days": 3,
  "delay_hours": 0,
  "enabled": true
}
```

**Get Sequence Details**
```bash
GET /api/campaigns/[id]/sequences/[sequenceNumber]
← { sequence: {...}, stats: { total: 500, sent: 312, ... } }
```

**Update Sequence**
```bash
PUT /api/campaigns/[id]/sequences/[sequenceNumber]
{
  "email_subject": "Updated subject",
  "delay_days": 4,
  "enabled": true
}
```

**Delete Sequence**
```bash
DELETE /api/campaigns/[id]/sequences/[sequenceNumber]
```

---

## Database Schema

### campaigns (main table)
```sql
id UUID
user_id UUID
name VARCHAR(255)
status VARCHAR(50)      -- draft|queued|scheduled|sending|completed|paused|stopped
is_sequence BOOLEAN
sequence_type VARCHAR(50) -- sequential|branch|conditional
paused_at TIMESTAMP
stopped_at TIMESTAMP
scheduled_for TIMESTAMP
sent_count INTEGER
delivered_count INTEGER
opened_count INTEGER
clicked_count INTEGER
bounced_count INTEGER
unsubscribed_count INTEGER
created_at TIMESTAMP
updated_at TIMESTAMP
```

### campaign_sends (per-contact tracking for single-email campaigns)
```sql
id UUID
campaign_id UUID
contact_id UUID
status VARCHAR(50)    -- pending|sent|delivered|bounced|opened|clicked|replied
sent_at TIMESTAMP
delivered_at TIMESTAMP
opened_at TIMESTAMP
clicked_at TIMESTAMP
replied_at TIMESTAMP
message_id TEXT
bounce_reason TEXT
created_at TIMESTAMP
```

### campaign_sequences (for drip campaigns)
```sql
id UUID
campaign_id UUID
sequence_number INTEGER
email_subject TEXT
email_body TEXT
delay_days INTEGER
delay_hours INTEGER
send_on_day_of_week VARCHAR(10)  -- Monday, Tuesday, etc.
send_at_time TIME
enabled BOOLEAN
notes TEXT
created_at TIMESTAMP
```

### campaign_sequence_sends (per-contact-per-sequence tracking)
```sql
id UUID
campaign_id UUID
contact_id UUID
sequence_number INTEGER
status VARCHAR(50)     -- pending|scheduled|sent|delivered|bounced|skipped
scheduled_for TIMESTAMP
sent_at TIMESTAMP
skip_reason TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### campaign_status_history (audit trail)
```sql
id UUID
campaign_id UUID
user_id UUID
old_status VARCHAR(50)
new_status VARCHAR(50)
action VARCHAR(50)     -- pause|resume|stop|send|complete
reason TEXT
created_at TIMESTAMP
```

---

## Common Workflows

### Workflow 1: Send a Simple Email Campaign

```bash
# 1. Create campaign (draft)
POST /api/campaigns
Body: { "name": "Q1 Outreach", "subject": "Hi {{firstName}}", ... }
Response: { campaign: { id: "abc123", status: "draft" } }

# 2. Add recipients
POST /api/campaigns/abc123/recipients
Body: { contact_ids: [id1, id2, id3, ...] }

# 3. Review and send
POST /api/campaigns/abc123/send
Response: { status: "queued", message: "Campaign queued for immediate send" }

# 4. Monitor in real-time
GET /api/campaigns/abc123/status
Response: { send_stats: { total: 500, sent: 127, delivered: 125, opened: 31 } }

# 5. If needed, pause
POST /api/campaigns/abc123/pause
→ Status changes to "paused", sends halt

# 6. Resume later
POST /api/campaigns/abc123/resume
→ Status changes back to "queued", continues sending
```

### Workflow 2: Create a 3-Step Drip Campaign

```bash
# 1. Create campaign (draft)
POST /api/campaigns
Body: { "name": "Sales Sequence", "is_sequence": true, ... }
Response: { campaign: { id: "seq123", status: "draft" } }

# 2. Add recipients
POST /api/campaigns/seq123/recipients
Body: { contact_ids: [id1, id2, ...] }

# 3. Add sequence #1 (send immediately)
POST /api/campaigns/seq123/sequences
{
  "sequence_number": 1,
  "email_subject": "Quick question: {{firstName}}",
  "email_body": "...",
  "delay_days": 0,
  "delay_hours": 0
}

# 4. Add sequence #2 (send 3 days later)
POST /api/campaigns/seq123/sequences
{
  "sequence_number": 2,
  "email_subject": "Following up...",
  "email_body": "...",
  "delay_days": 3,
  "delay_hours": 0
}

# 5. Add sequence #3 (send 5 days after #2)
POST /api/campaigns/seq123/sequences
{
  "sequence_number": 3,
  "email_subject": "Last attempt...",
  "email_body": "...",
  "delay_days": 5,
  "delay_hours": 0
}

# 6. Launch campaign
POST /api/campaigns/seq123/send
Response: { status: "queued" }

# 7. Check progress
GET /api/campaigns/seq123/status
Response includes:
{
  sequence_stats: {
    sequences: [
      { sequence_number: 1, total: 500, sent: 500, opened: 312 },
      { sequence_number: 2, total: 312, sent: 312, opened: 156 },
      { sequence_number: 3, total: 156, sent: 89, opened: 52 }
    ]
  }
}
```

### Workflow 3: Pause, Then Resume Mid-Campaign

```bash
# Campaign is sending
GET /api/campaigns/abc123/status
→ { status: "sending", send_stats: { total: 1000, sent: 347 } }

# Something urgent comes up, pause it
POST /api/campaigns/abc123/pause
→ { status: "paused", paused_at: "2024-02-15T14:30:00Z" }

# 347 emails sent, 653 pending (waiting)
GET /api/campaigns/abc123/status
→ { status: "paused", send_stats: { total: 1000, sent: 347, pending: 653 } }

# After 2 hours, resume
POST /api/campaigns/abc123/resume
→ { status: "queued", resumed_at: "2024-02-15T16:45:00Z" }

# Campaign continues from email #348
GET /api/campaigns/abc123/status
→ { status: "sending", send_stats: { total: 1000, sent: 412, pending: 588 } }
```

### Workflow 4: Stop Campaign Permanently

```bash
# Campaign is queued but you detect a problem
GET /api/campaigns/abc123/status
→ { status: "queued", send_stats: { total: 1000, sent: 0, pending: 1000 } }

# Stop it permanently
POST /api/campaigns/abc123/stop
{
  "reason": "Email content has legal violation - escalating to compliance"
}
Response: {
  status: "stopped",
  skipped_count: 1000,
  message: "Campaign stopped. 1000 pending emails have been skipped."
}

# Now the campaign is stopped (cannot resume)
GET /api/campaigns/abc123/status
→ { status: "stopped", send_stats: { total: 1000, sent: 0, pending: 0 } }

# Can still view analytics but cannot restart
```

---

## Features Available by Plan

| Feature | Trial | Starter | Growth | Pro |
|---------|-------|---------|--------|-----|
| Campaign Limit | 3 | 50 | 500 | Unlimited |
| Pause/Resume | ✓ | ✓ | ✓ | ✓ |
| Stop Campaign | ✓ | ✓ | ✓ | ✓ |
| Sequences/Drip | ✗ | ✓ | ✓ | ✓ |
| Schedule Send | ✓ | ✓ | ✓ | ✓ |
| Recipients/Month | 500 | 5,000 | 50,000 | 500,000 |
| Warmup Domains | 0 | 1 | 5 | Unlimited |
| Team Members | 1 | 1 | 3 | Unlimited |

---

## Status History & Audit Trail

Every campaign status change is logged:

```bash
GET /api/campaigns/abc123/status

response.status_history = [
  {
    "id": "hist1",
    "campaign_id": "abc123",
    "user_id": "user1",
    "action": "send",
    "old_status": "draft",
    "new_status": "queued",
    "reason": "User sent campaign",
    "created_at": "2024-02-15T09:00:00Z"
  },
  {
    "id": "hist2",
    "action": "pause",
    "old_status": "queued",
    "new_status": "paused",
    "reason": "User paused campaign",
    "created_at": "2024-02-15T09:15:00Z"
  },
  {
    "id": "hist3",
    "action": "resume",
    "old_status": "paused",
    "new_status": "queued",
    "reason": "User resumed campaign",
    "created_at": "2024-02-15T09:30:00Z"
  }
]
```

Perfect for:
- Compliance audits
- Understanding campaign lifecycle
- Debugging issues
- Reporting

---

## Best Practices

### Before Sending
1. ✓ Preview email with merge tags filled in
2. ✓ Test with 1-2 test recipients first
3. ✓ Check from/reply-to addresses
4. ✓ Review recipient list for duplicates
5. ✓ Pause before sending to verify

### During Campaign
1. ✓ Monitor open/click rates hourly
2. ✓ Pause if receiving bounces
3. ✓ Check replies for blocklist notifications
4. ✓ Adjust warmup strategy if needed

### After Campaign
1. ✓ Analyze by sequence (which emails performed best?)
2. ✓ Track conversions vs opens/clicks
3. ✓ Segment engaged vs unengaged recipients
4. ✓ Follow up on high-intent signals (clicks)
5. ✓ Create next campaign based on learnings

### Sequence Best Practices
1. **Space them out**: Min 1 day, max 2 weeks between emails
2. **Respect unsubscribes**: Automatically skip remaining sequences
3. **Vary subject lines**: Each email should feel fresh
4. **Build value**: Each email adds more value than previous
5. **Clear CTA**: What action do you want in each email?

---

## Troubleshooting

**Problem**: Campaign stuck in "sending" state
- **Cause**: Edge Function crashed or network issue
- **Fix**: Pause then resume (or contact support)

**Problem**: Pause button doesn't appear
- **Cause**: Campaign not in pauseable state (draft, completed, etc)
- **Fix**: Can only pause queued/sending/scheduled campaigns

**Problem**: Resume button shows error
- **Cause**: Campaign was stopped (not paused)
- **Fix**: Stopped campaigns cannot be resumed (use status endpoint to confirm)

**Problem**: Sequence emails not scheduling
- **Cause**: Campaign is paused or stopped
- **Fix**: Resume campaign (or start a new one)

**Problem**: Recipients receiving multiple sequence #1 emails
- **Cause**: Contact added to sequence twice
- **Fix**: Use UNIQUE constraint on (campaign_id, contact_id, sequence_number)

---

## Summary

Your production campaign system now includes:

✅ **Lifecycle Management**: Draft → Queued/Scheduled → Sending → Completed/Stopped

✅ **Campaign Controls**:
- Pause: Temporarily halt sends (can resume)
- Resume: Continue from where paused
- Stop: Permanently cancel (irreversible)

✅ **Sequences/Drip Campaigns**:
- Multi-step email sequences
- Configurable delays (days, hours, time of day)
- Per-contact tracking
- Auto-skip if bounced or unsubscribed

✅ **Status Tracking**:
- Real-time send progress
- Per-sequence analytics
- Audit trail of all status changes
- Available actions for current state

✅ **Production Ready**:
- Database constraints prevent corruption
- Audit trails for compliance
- Proper error handling
- Plan-based feature gating
