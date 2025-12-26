# Campaign Management - Quick Start Guide

## Campaign States at a Glance

```
CREATION          LAUNCHING         MONITORING        COMPLETION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Draft             Queued            Sending           Completed
(composing)       (ready)           (active)          (done)
                  
                  Scheduled         
                  (future)          
                  
                              Paused
                              (temporarily halted)
                              ↓ (Resume)
                              
                  ┌──────────────────────────────────┐
                  │ STOPPED (permanently cancelled)  │
                  │ (cannot resume)                  │
                  └──────────────────────────────────┘
```

## Actions Available Per State

```
┌──────────┬─────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ STATE    │ DRAFT   │ QUEUED   │ SENDING  │ PAUSED   │ STOPPED  │ COMPLETE │
├──────────┼─────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ PAUSE    │         │ ✓        │ ✓        │          │          │          │
│ RESUME   │         │          │          │ ✓        │          │          │
│ STOP     │ ✓       │ ✓        │ ✓        │ ✓        │          │          │
│ SEND     │ ✓       │          │          │          │          │          │
│ EDIT     │ ✓       │          │          │          │          │          │
│ DELETE   │ ✓       │          │          │          │ ✓        │ ✓        │
│ VIEW     │ ✓       │ ✓        │ ✓        │ ✓        │ ✓        │ ✓        │
│ REPLIES  │         │          │ ✓        │ ✓        │ ✓        │ ✓        │
└──────────┴─────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

## Pause vs Stop

### PAUSE
```
Status: campaign.status = "paused"
When:   Click "Pause" during sending/queued
Result: 
  ✓ Sends STOP immediately
  ✓ Already-sent emails: stay sent
  ✓ Pending sends: stay in "pending" status
  ✓ Can RESUME later to continue

Use case: "I need to check something, then continue"
```

### STOP
```
Status: campaign.status = "stopped"
When:   Click "Stop" anytime except completed
Result:
  ✓ Sends STOP immediately (never resume)
  ✓ Already-sent emails: stay sent
  ✓ Pending sends: marked "skipped"
  ✗ CANNOT resume (permanent)

Use case: "Cancel this campaign, don't ever send"
```

## Single Email Campaign (Simple)

```
┌─────────────────────────────────────────┐
│ 1. CREATE CAMPAIGN (Draft)              │
│    • Name: Q1 Outreach                  │
│    • Subject: Hi {{firstName}}          │
│    • Body: Our latest product...        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 2. ADD RECIPIENTS                       │
│    • Select contacts/segments           │
│    • Total: 1,247 contacts              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 3. REVIEW & CONFIGURE                   │
│    • From: sales@company.com            │
│    • Reply-to: support@company.com      │
│    • Provider: AWS SES                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 4. SEND CAMPAIGN                        │
│    POST /api/campaigns/[id]/send        │
│    Status: DRAFT → QUEUED               │
│    (immediately starts sending)         │
└─────────────────────────────────────────┘
                  ↓
        ┌─────────┴──────────┐
        │                    │
        ↓ (if needed)        ↓ (let it run)
    PAUSE                  SENDING
        │                    │
        └────→ RESUME        │
               │             │
               │             ↓
               └──→ COMPLETED
                   (all sent)
```

## Drip Campaign (Multi-Email Sequence)

```
┌──────────────────────────────┐
│ 1. CREATE CAMPAIGN (Draft)   │
│    is_sequence: true         │
│    sequence_type: sequential │
└──────────────────────────────┘
         ↓
┌──────────────────────────────┐
│ 2. ADD RECIPIENTS (500)      │
│    Who will receive sequence │
└──────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ 3. ADD SEQUENCE EMAILS                   │
│                                          │
│ Sequence #1 (IMMEDIATE)                  │
│ ├─ Subject: "Quick question?"            │
│ ├─ Delay: 0 days                         │
│ └─ Status: enabled                       │
│                                          │
│ Sequence #2 (3 DAYS LATER)               │
│ ├─ Subject: "Following up..."            │
│ ├─ Delay: 3 days                         │
│ └─ Status: enabled                       │
│                                          │
│ Sequence #3 (5 DAYS AFTER #2)            │
│ ├─ Subject: "Last message"               │
│ ├─ Delay: 5 days                         │
│ └─ Status: enabled                       │
└──────────────────────────────────────────┘
         ↓
┌────────────────────────┐
│ 4. LAUNCH CAMPAIGN     │
│ POST /api/campaigns/   │
│ [id]/send              │
└────────────────────────┘
         ↓
    TIMELINE (per recipient)
    
    john@example.com
    ├─ Day 0, 9:00 AM → Email #1 (open rate: 64%)
    │
    ├─ Day 3, 9:00 AM → Email #2 (open rate: 50%)
    │  (only sent to people who got #1)
    │
    └─ Day 8, 9:00 AM → Email #3 (open rate: 57%)
       (only sent to people who got #1 & #2)
```

## API Calls Reference

### Simple Campaign

```bash
# 1. Create
POST /api/campaigns
{"name": "Q1", "subject": "Hi {{firstName}}", ...}

# 2. Add recipients
POST /api/campaigns/[id]/recipients
{"contact_ids": [id1, id2, id3]}

# 3. Send
POST /api/campaigns/[id]/send
→ Status changes: DRAFT → QUEUED

# 4. Pause (if needed)
POST /api/campaigns/[id]/pause
→ Status changes: QUEUED → PAUSED

# 5. Resume
POST /api/campaigns/[id]/resume
→ Status changes: PAUSED → QUEUED

# 6. OR Stop
POST /api/campaigns/[id]/stop
→ Status changes: ANY → STOPPED (permanent)
```

### Drip Campaign

```bash
# 1. Create
POST /api/campaigns
{"name": "Sales Sequence", "is_sequence": true}

# 2. Add recipients
POST /api/campaigns/[id]/recipients
{"contact_ids": [id1, id2, id3]}

# 3. Add sequence email #1
POST /api/campaigns/[id]/sequences
{
  "sequence_number": 1,
  "email_subject": "Question?",
  "email_body": "...",
  "delay_days": 0,
  "delay_hours": 0
}

# 4. Add sequence email #2
POST /api/campaigns/[id]/sequences
{
  "sequence_number": 2,
  "email_subject": "Following up",
  "email_body": "...",
  "delay_days": 3,
  "delay_hours": 0
}

# 5. Add sequence email #3
POST /api/campaigns/[id]/sequences
{
  "sequence_number": 3,
  "email_subject": "Final thoughts",
  "email_body": "...",
  "delay_days": 5,
  "delay_hours": 0
}

# 6. Launch
POST /api/campaigns/[id]/send
→ Status: DRAFT → QUEUED
→ Sequence #1 starts sending immediately
→ Sequence #2 scheduled for 3 days later
→ Sequence #3 scheduled for 8 days later
```

## Real-Time Status Monitoring

```bash
GET /api/campaigns/[id]/status

Response:
{
  "campaign": {
    "id": "abc123",
    "name": "Q1 Outreach",
    "status": "sending",  ← current state
    "is_sequence": false
  },
  "send_stats": {
    "total_recipients": 1000,
    "sent": 347,          ← so far
    "delivered": 335,
    "opened": 98,
    "clicked": 14,
    "replied": 3,
    "pending": 653        ← still waiting
  },
  "rates": {
    "sent_percent": 34,   ← 347 of 1000 sent
    "open_rate": 28,      ← 98 of 347 opened
    "click_rate": 4,      ← 14 of 347 clicked
    "reply_rate": 0       ← 3 of 347 replied
  },
  "actions_available": {
    "pause": true,        ← can pause now
    "resume": false,
    "stop": true,         ← can stop now
    "send": false
  }
}
```

## When to Use Each Control

### PAUSE
✓ I want to check something before continuing
✓ I'm concerned about bounces and want to investigate
✓ I need approval from someone before continuing
✓ The email service is having issues
✓ I want to see open rates before sending more

→ Click Pause, then Resume later

### STOP
✓ The email has a critical error (typo, wrong URL)
✓ Legal/compliance issue detected
✓ Recipient list is wrong
✓ The campaign completed but still queued
✓ Something came up and campaign is irrelevant now

→ Click Stop (cannot undo)

### DELETE
✓ Campaign finished weeks ago
✓ Test campaign that shouldn't stay in system
✓ Campaign was stopped and archived

→ Click Delete (removes from database)

## Best Practices

### Before Sending
```
☐ Review email with merge tags
☐ Test with 1-2 test recipients
☐ Check from/reply-to addresses correct
☐ Verify warmup domain is ready
☐ Check recipient count (no duplicates?)
☐ Send from less busy time slot
```

### During Campaign
```
☐ Monitor hourly for first 3 hours
☐ Watch for bounce rate
☐ Check replies for blocklist warnings
☐ If bounces > 2%, PAUSE and investigate
☐ Pause between different segments
```

### After Campaign
```
☐ Review open rate (industry avg: 20-30%)
☐ Review click rate (industry avg: 2-5%)
☐ Check reply rate
☐ Segment: engaged vs unengaged
☐ Plan follow-up based on engagement
```

## Feature Availability

| Feature | Trial | Starter | Growth | Pro |
|---------|-------|---------|--------|-----|
| **Pause/Resume** | ✓ | ✓ | ✓ | ✓ |
| **Stop Campaign** | ✓ | ✓ | ✓ | ✓ |
| **Drip Sequences** | ✗ | ✓ | ✓ | ✓ |
| **Campaign Limit** | 3 | 50 | 500 | ∞ |
| **Max Recipients/Mo** | 500 | 5K | 50K | 500K |

---

**Quick Tip**: Always check `/api/campaigns/[id]/status` before taking action. The `actions_available` field tells you exactly what you can do in the current state.
