# Campaign Creation Flow - Quick Reference

## User Journey: Idea → Launch in 5 Minutes

```
Start: User clicks "Create Campaign"
  ↓
STEP 1: Campaign Details (~ 2 minutes)
├─ Enter campaign name ("Q1 Sales Push")
├─ Choose: Use Template OR Write Custom Email
│  ├─ Template Mode: Select from dropdown, auto-fills subject + body
│  └─ Custom Mode: 
│     ├─ Type email body
│     ├─ ✨ Click "AI Suggestions" for 2 variations
│     └─ Click to accept or write your own
├─ Enter subject line
│  ├─ ✨ Click "AI Suggestions" for 3 options
│  └─ System suggests high-converting variations
├─ Preview text (optional, shown in email clients)
├─ Campaign notes (internal, not sent)
└─ Reference shows all available merge tags

  ↓
STEP 2: Select Recipients (~ 1 minute)
├─ Load all user's contacts from database
├─ Select which contacts receive this campaign
├─ Multi-select with "Select All" option
└─ Shows: Name, Email, Company, Status

  ↓
STEP 3: Email Configuration (~ 1 minute)
├─ From Name: "Sales Team" or person name
├─ From Email: verified@domain.com
├─ Reply-To: replies@domain.com (optional)
├─ Provider: AWS SES / Gmail / Resend / SMTP
└─ Sending Domain: Verified domain

  ↓
CLICK: "Create Campaign"
├─ API Validation:
│  ├─ ✓ Campaign name provided
│  ├─ ✓ Subject provided
│  ├─ ✓ Body provided (if custom)
│  ├─ ✓ Recipients selected (recommended)
│  ├─ ✓ Plan limits not exceeded
│  └─ ✓ Domain verified
├─ Create campaign in database (status: "draft")
├─ Add recipients to campaign_recipients table
├─ Personalize merge tags for each recipient
└─ Redirect to campaign detail page

  ↓
Campaign Created Successfully ✓
├─ View on: /campaigns/{id}
├─ See analytics: Sent, Opened, Clicked, Replied
├─ Status: "draft" (ready to send)
└─ Can still edit and add/remove recipients

  ↓
CLICK: "Send Campaign" (on detail page)
├─ Final validation
├─ Campaign status changes: "draft" → "queued"
├─ Edge Function picks up send job
├─ For each recipient:
│  ├─ Replace {{firstName}} → "John"
│  ├─ Replace {{company}} → "Acme Corp"
│  ├─ Call email provider API
│  ├─ Record send timestamp
│  └─ Log message ID for tracking
└─ Real-time updates: Sent count increments

  ↓
Emails Being Delivered
├─ Provider webhooks notify of:
│  ├─ Delivered: Email in inbox
│  ├─ Opened: Recipient opened email
│  ├─ Clicked: Recipient clicked link
│  ├─ Bounced: Failed delivery
│  └─ Complained: Marked as spam
├─ AI classifies replies:
│  ├─ interested → Hot lead
│  ├─ not_interested → Disqualified
│  ├─ question → Engaged
│  ├─ meeting_request → Conversion! 
│  └─ other → Manual review
└─ Sentiment score: -1.0 (negative) to 1.0 (positive)

  ↓
Monitor Results (in real-time)
├─ View on: /campaigns/{id}
├─ Watch metrics update live:
│  ├─ Send Rate: 100 / 100 sent
│  ├─ Open Rate: 24 / 100 opened (24%)
│  ├─ Click Rate: 8 / 100 clicked (8%)
│  ├─ Reply Rate: 5 / 100 replied (5%)
│  └─ Meetings Booked: 2 conversions
├─ View all replies in: /messages
└─ See contact status in Recipients table

  ↓
Create Follow-up Campaign (after 5-7 days)
├─ All steps repeat but with:
│  ├─ Different subject line (use AI again)
│  ├─ Same or filtered recipients (no response)
│  ├─ Reference to original campaign
│  └─ Different value proposition
└─ Measure success vs. initial campaign

  ↓
Analyze & Iterate
├─ Which subject lines got best open rates?
├─ Which email bodies got most clicks?
├─ Which follow-up timing worked best?
├─ Which companies are most responsive?
└─ Use insights for next campaign
```

---

## AI Suggestion Features

### Subject Line AI (✨ Get AI Suggestions)
```
INPUT:
  - Campaign name: "Q1 Outreach"
  - Email body: (optional) Email content
  
OUTPUT:
  - Suggestion 1: "Quick thought on your sales strategy"
  - Suggestion 2: "How [Company] is handling Q1 growth"
  - Suggestion 3: "One idea for [FirstName]'s team"
  
TIPS:
  - "Personalize with first name for +30% open rate"
  - "Questions get 15% higher open rates"
  - "Avoid all-caps and urgency words in spam folders"
```

### Email Body AI (✨ Get AI Suggestions)
```
INPUT:
  - Subject line: "Quick thought on your sales strategy"
  - Campaign name: (optional) "Q1 Outreach"
  
OUTPUT:
  - Variation 1: "Hi {{firstName}},\n\nI noticed {{company}} is..."
  - Variation 2: "{{firstName}}, quick question about {{company}}..."
  
TIPS:
  - "Keep under 150 words for mobile readability"
  - "Use merge tags for 40%+ higher response rate"
  - "End with clear CTA: 'Can we grab 15 min Thursday?'"
```

---

## Merge Tags Reference

### Standard Fields (Always Available)
| Tag | Example | Use Case |
|-----|---------|----------|
| {{firstName}} | John | "Hi {{firstName}}" |
| {{lastName}} | Smith | "Dear {{lastName}}" |
| {{fullName}} | John Smith | Formal emails |
| {{email}} | john@company.com | "Reply to..." |
| {{company}} | Acme Corp | "at {{company}}" |
| {{phone}} | 555-1234 | "Call me at {{phone}}" |
| {{jobTitle}} | VP Sales | "As a {{jobTitle}}" |
| {{website}} | acme.com | "Check out {{website}}" |
| {{city}} | San Francisco | Geographic targeting |
| {{country}} | USA | Regional relevance |

### Custom Fields (From Contact Metadata)
```
If you added custom fields in Contact creation:
- {{department}}: "Reach department head"
- {{budget}}: "For {{budget}} budget range"
- {{timeline}}: "For Q{{timeline}} implementation"
- {{competitor}}: "vs. {{competitor}}"
```

---

## Plan Limits

| Feature | Trial | Starter | Growth | Pro |
|---------|-------|---------|--------|-----|
| Campaigns Total | 3 | 50 | 500 | ∞ |
| Recipients/Campaign | ∞ | ∞ | ∞ | ∞ |
| Emails/Month | 1,000 | 10,000 | 100,000 | 500,000 |
| AI Suggestions | ✓ | ✓ | ✓ | ✓ |
| Warmup | ✗ | ✓ (1 domain) | ✓ (5 domains) | ✓ (∞) |
| Messages/Inbox | ✓ | ✓ | ✓ | ✓ |

---

## Key Files

**Frontend**:
- `/app/(default)/campaigns/new/page.tsx` - Campaign creation wizard (3-step form)
- `/app/(default)/campaigns/page.tsx` - Campaigns list with plan info
- `/app/(default)/campaigns/[id]/page.tsx` - Campaign detail & analytics
- `/components/feature-gate.tsx` - Upgrade prompts for limited features

**Backend**:
- `/app/api/campaigns/route.ts` - Create campaign, enforce plan limits
- `/app/api/campaigns/ai-suggestions/route.ts` - AI suggestions (subject + body)
- `/app/api/campaigns/[id]/send/route.ts` - Send campaign
- `/app/api/campaigns/[id]/recipients/route.ts` - Add recipients

**Supabase**:
- `campaigns` table - Main campaign records
- `campaign_recipients` table - Recipients + merge data
- `campaign_sends` table - Per-recipient send tracking
- `email_replies` table - Reply capture + AI classification

---

## Response Times

| Action | Time |
|--------|------|
| Load campaign form | < 500ms |
| Get AI subject suggestions | 3-5 seconds |
| Get AI body suggestions | 4-7 seconds |
| Send campaign (100 recipients) | < 2 seconds (queued) |
| Process queue (actual send) | 30-60 seconds (100 emails) |
| Webhook updates (open/click/reply) | 2-10 seconds |

---

## Success Metrics

### Industry Benchmarks
- **Open Rate**: 15-25% for cold outreach
- **Click Rate**: 2-5% for cold outreach
- **Reply Rate**: 1-3% for cold outreach
- **Meeting Rate**: 0.5-1.5% of sent emails

### Good Performance
- **Open Rate**: > 30% (personalization working)
- **Click Rate**: > 5% (compelling CTA)
- **Reply Rate**: > 3% (strong value prop)
- **Meeting Rate**: > 1% (qualified leads)

### Excellent Performance
- **Open Rate**: > 40% (excellent subject + timing)
- **Click Rate**: > 8% (strong email body)
- **Reply Rate**: > 5% (high engagement)
- **Meeting Rate**: > 2% (great lead quality)
