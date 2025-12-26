# Campaign Creation & Launch Process - Step by Step

## Overview

This document outlines the complete process for creating and launching email campaigns in the production system, from initial setup through deployment and monitoring.

---

## STEP 1: Navigate to Campaign Creation

### User Action
- Click **"Create Campaign"** button on `/campaigns` page
- Or navigate directly to `/campaigns/new`

### What Happens
1. Campaign form loads with three-step wizard
2. Templates and contacts are fetched from database
3. Default values set:
   - Provider: AWS SES (configurable)
   - Template mode: ON (can toggle to custom email mode)

---

## STEP 2: Campaign Details (Step 1 of 3)

### 2.1 Campaign Name
- **Field**: `campaign.name`
- **Required**: YES
- **Example**: "Q1 Tech Outreach" or "Follow-up to Demo"
- **Purpose**: Identifies campaign in dashboard, used for internal reference

### 2.2 Template vs Custom Email Selection
User chooses composition method:

#### Option A: Use Template (**Default**)
- **What**: Select from pre-built email templates
- **Templates Loaded From**: `/api/templates` endpoint
- **Auto-Fill**: Subject and body populated from selected template
- **Benefits**: Faster, consistent formatting, tested conversions

#### Option B: Write Custom Email
- **What**: Compose email from scratch
- **Mode**: Textarea editor with real-time preview
- **Merge Tags**: Full support for {{firstName}}, {{lastName}}, {{company}}, etc.
- **AI Assistance**: Button to generate suggestions based on campaign name/context

### 2.3 Email Body (Custom Mode Only)
- **Field**: `campaign.body`
- **Required**: YES (if not using template)
- **Format**: HTML or plain text with merge tag placeholders
- **AI Features**:
  - Click **"✨ Get AI Suggestions"** button
  - System generates 2 variations using OpenAI GPT-4o-mini
  - Each suggestion includes:
    - Professional email body (100-150 words)
    - Best practices tips (e.g., "Use personalization sparingly")
  - Click suggestion to auto-populate field
  - Can regenerate unlimited times

### 2.4 Subject Line
- **Field**: `campaign.subject`
- **Required**: YES
- **Character Limit**: Recommended 50-65 characters
- **Merge Tags**: Supported (e.g., `{{firstName}} - Quick Thought on {{company}}`)
- **AI Features**:
  - Click **"✨ Get AI Suggestions"** button
  - System generates 3 subject lines using campaign name and email body
  - Each suggestion includes:
    - Personalized, high-conversion subject line
    - Tips about open rates, personalization, urgency
  - Click suggestion to auto-populate
  - Can iterate and regenerate as needed

### 2.5 Preview Text
- **Field**: `campaign.preview_text`
- **Optional**: YES
- **Purpose**: Text shown in email client previews (mobile, desktop)
- **Best Practice**: 40-60 characters to complete subject line narrative
- **Example**: If subject is "New Solution for Your Sales Team", preview could be "See how we increased conversions by 40%"

### 2.6 Campaign Notes
- **Field**: `campaign.notes`
- **Optional**: YES
- **Purpose**: Internal-only annotations (NOT sent to recipients)
- **Use Cases**:
  - Campaign goals: "Aim for 20% response rate"
  - Strategy notes: "Follow up if no reply in 5 days"
  - A/B testing: "Testing personalization depth"
  - Success metrics: "Target: 50 meetings booked"

### 2.7 Merge Tags Reference
- **Always Visible**: Blue reference box at bottom
- **Standard Fields** (10 available):
  - {{firstName}}, {{lastName}}, {{fullName}}
  - {{email}}, {{company}}, {{phone}}
  - {{jobTitle}}, {{website}}, {{city}}, {{country}}
- **Custom Fields**: Any field from contact metadata
- **Example Custom**: {{department}}, {{budget}}, {{timeline}}

### AI Suggestion Engine Details

**Endpoint**: `POST /api/campaigns/ai-suggestions`

**For Subject Lines**:
- Reads: Campaign name, email body (if exists)
- Generates: 3 compelling subject lines + tips
- Model: OpenAI GPT-4o-mini
- Temperature: 0.7 (balanced creativity/consistency)

**For Email Bodies**:
- Reads: Subject line, campaign name
- Generates: 2 body variations + tips
- Constraints: 100-150 words, includes merge tag placeholders
- Output includes professional sales language, CTA suggestions

---

## STEP 3: Select Recipients (Step 2 of 3)

### 3.1 Contact Selection
- **What**: Choose which contacts receive this campaign
- **Source**: Loaded from `/api/contacts` endpoint
- **Display**: List or grid of all user's contacts
- **Selection**: Multi-select checkboxes

### 3.2 Contact Details Visible
For each contact:
- Name (first + last)
- Email address
- Company
- Status (from metadata)
- Last activity (from metadata)

### 3.3 Selection Options
- **Select All**: Button to select all visible contacts
- **Deselect All**: Button to clear all selections
- **Smart Selection**: Could filter by company, tag, status (future enhancement)

### 3.4 Campaign Recipient Limits (Plan-Based)
- **Trial Plan**: Up to 3 campaigns total (not per-campaign limit)
- **Starter Plan**: No recipient limit per campaign, but only 50 campaigns total
- **Growth Plan**: No recipient limit per campaign, 500 campaigns total
- **Pro Plan**: Unlimited recipients and campaigns

---

## STEP 4: Email Provider Configuration (Step 3 of 3)

### 4.1 From Name
- **Field**: `campaign.from_name`
- **Optional**: YES
- **Example**: "John Smith" or "Sales Team"
- **Purpose**: Display name in recipient's inbox
- **Default**: User's account name

### 4.2 From Email
- **Field**: `campaign.from_email`
- **Optional**: YES (but recommended)
- **Example**: "sales@yourdomain.com" or "john@company.com"
- **Validation**: Must be domain verified in email provider settings
- **Default**: Primary email provider's address

### 4.3 Reply-To Email
- **Field**: `campaign.reply_to`
- **Optional**: YES
- **Example**: "replies@company.com"
- **Purpose**: Where replies are routed (different from from_email)
- **Best Practice**: Dedicated inbox for campaign replies

### 4.4 Email Provider Selection
- **Field**: `campaign.provider`
- **Options**: 
  - aws_ses (default, highest volume)
  - gmail (personal/small batch)
  - resend (modern, good deliverability)
  - smtp (custom configured)

### 4.5 Sending Domain
- **Field**: `campaign.domain`
- **Required**: YES
- **Format**: Verified domain from email provider
- **Example**: "yourdomain.com"
- **Verification**: Must be verified in Settings > Email Provider

---

## STEP 5: Review & Create Campaign

### 5.1 Validation Before Submit
System checks:
- ✓ Campaign name provided
- ✓ Subject line provided
- ✓ Email body provided (if custom mode)
- ✓ At least one recipient selected (recommended)
- ✓ From email is valid (if provided)
- ✓ Plan limits not exceeded (campaign count)

### 5.2 Campaign Creation
**API Call**: `POST /api/campaigns`

**Payload**:
```json
{
  "name": "Q1 Outreach Campaign",
  "template_id": "uuid-or-null",
  "subject": "{{firstName}} - Let's talk growth",
  "preview_text": "Your company is in our target market",
  "body": "Hi {{firstName}},\n\nI noticed {{company}} is in the {{industry}}...",
  "from_name": "Sales Team",
  "from_email": "sales@company.com",
  "reply_to": "replies@company.com",
  "provider": "aws_ses",
  "domain": "company.com",
  "settings": { /* provider-specific settings */ },
  "notes": "Target: 100 responses, Follow up after 5 days"
}
```

**Response**:
```json
{
  "campaign": {
    "id": "campaign-uuid",
    "user_id": "user-uuid",
    "name": "Q1 Outreach Campaign",
    "status": "draft",
    "created_at": "2025-12-24T10:30:00Z",
    "total_recipients": 0,
    "sent_count": 0,
    "opened_count": 0,
    "replied_count": 0
  }
}
```

### 5.3 Add Recipients
**API Call**: `POST /api/campaigns/{campaign_id}/recipients`

**Payload**:
```json
{
  "contact_ids": ["contact-uuid-1", "contact-uuid-2", "contact-uuid-3"]
}
```

**What Happens**:
1. For each contact, merge tag data prepared:
   - {{firstName}}: contact.first_name
   - {{company}}: contact.company
   - {{custom}}: contact.metadata fields
2. Rows inserted into `campaign_recipients` table
3. Campaign's `total_recipients` count updated

### 5.4 Status After Creation
- **Campaign Status**: "draft"
- **Can Edit**: YES
- **Can Add/Remove Recipients**: YES
- **Ready to Send**: YES (can send immediately or schedule)

---

## STEP 6: Campaign Dashboard & Details Page

### 6.1 Campaign Details View
**Route**: `/campaigns/{id}`

**Displays**:
- Campaign name, status, created date
- Subject line and preview text
- Email body preview
- Template used (if applicable)
- Total recipients count
- Merge tags reference

### 6.2 Campaign Notes
- Visible in campaign detail view
- Editable in campaign settings
- Internal-only (never sent in emails)

### 6.3 Analytics Summary
Shows real-time metrics:
- **Sent**: Number of emails dispatched
- **Delivered**: Number of emails successfully received
- **Opened**: Number of times email was opened
- **Clicked**: Number of times links were clicked
- **Replied**: Number of replies received (with AI classification)
- **Bounced**: Number of undeliverable emails

### 6.4 Recipients List
- Table showing each contact + send status
- Status options:
  - pending (not yet sent)
  - sent (dispatched to email provider)
  - delivered (confirmed by provider)
  - bounced (rejected by recipient server)
  - opened (recipient opened email)
  - clicked (recipient clicked link)
  - replied (recipient sent reply)
  - unsubscribed
  - complained (marked as spam)

---

## STEP 7: Launch Campaign (Send)

### 7.1 Send Preparation
User clicks **"Send Campaign"** button on campaign detail page

**Validation**:
- Campaign has recipients
- All required fields filled
- User's plan allows active campaigns
- Email provider is configured
- Sending domain is verified

### 7.2 Send Initiation
**API Call**: `POST /api/campaigns/{id}/send`

**Process**:
1. Campaign status changed from "draft" to "queued"
2. Send job created in queue system
3. Each recipient gets:
   - Merge tags personalized with their contact data
   - Unique message ID for tracking
   - Recorded in `campaign_sends` table

### 7.3 Actual Email Delivery
**Edge Function**: Supabase Function `send-queue`

**What It Does**:
1. Polls for pending campaign sends
2. For each pending send:
   - Fetch contact data + campaign content
   - Replace merge tags with actual values
   - Call email provider API (SES, Gmail, Resend, SMTP)
   - Record send timestamp and provider response
   - Log any delivery errors
3. Updates campaign counters (sent_count, delivery_count)

### 7.4 Delivery Status Updates
**Email Provider Webhooks** notify system of:
- **Delivered**: Email reached recipient's mailbox
- **Opened**: Recipient opened email (pixel tracking)
- **Clicked**: Recipient clicked link (URL tracking)
- **Bounced**: Recipient's email invalid or rejected
- **Complained**: Recipient marked as spam

### 7.5 Real-Time Analytics
Dashboard updates as events arrive:
- Sent count increases as messages leave system
- Opened count increases as pixels fire
- Reply count updates as emails arrive
- AI classifier processes replies for sentiment/intent

---

## STEP 8: Monitor & Respond

### 8.1 Campaign Performance
View on campaign detail page:
- Send rate (% of recipients who received)
- Open rate (% of sent that were opened)
- Click rate (% of sent with at least one click)
- Reply rate (% of sent that replied)
- Response time distribution

### 8.2 View Replies
**Route**: `/messages`

**Features**:
- All campaign replies appear in Messages inbox
- AI classification shows intent:
  - interested (positive signal)
  - not_interested (clear objection)
  - question (engaged but needs info)
  - out_of_office (auto-reply)
  - meeting_request (conversion signal)
  - objection (handled in follow-up)
  - other (unclear)

### 8.3 Reply Sentiment
- **Sentiment Score**: -1.0 to 1.0
  - Positive (0.5-1.0): Enthusiastic, interested
  - Neutral (0-0.5): Curious, informational
  - Negative (-1.0 to 0): Rejecting, complaining

### 8.4 Manage Bounces
- Bounced addresses logged automatically
- Can unsubscribe or mark invalid
- Prevents re-sending to bad addresses

---

## STEP 9: Follow-up Campaigns

### 9.1 Create Follow-up
**Recommended**: 5-7 days after initial campaign

Create new campaign with:
- Reference to original campaign name
- Adjusted message (reference previous email)
- Same or filtered recipient list
- Different subject line (variations in AI suggestions help)
- Note in campaign notes section

### 9.2 Smart Recipient Selection
For follow-ups, filter to:
- **No Response**: Recipients who didn't reply
- **Opened but No Click**: Recipients who showed interest
- **Specific Companies**: Retry if low volume from key accounts

### 9.3 Follow-up Timing
- **1st Follow-up**: 3-5 days
- **2nd Follow-up**: 5-7 days
- **3rd Follow-up**: 7-10 days
- **Pause After**: 3 sends without response

---

## STEP 10: Measure Results

### 10.1 Key Metrics
- **Response Rate**: (Replies / Sent) × 100
- **Open Rate**: (Opened / Sent) × 100
- **Click Rate**: (Clicked / Sent) × 100
- **Engagement Rate**: (Opened OR Clicked) / Sent
- **Conversion Rate**: (Meetings Booked / Sent) × 100

### 10.2 Cost Per Metric
- **Cost per Email**: Monthly plan cost / emails per month
- **Cost per Response**: Campaign cost / replies
- **ROI**: (Revenue from responses - cost) / cost

### 10.3 Compare Campaigns
- See which campaign performed best
- A/B test subject lines (use AI suggestions)
- A/B test email bodies (use AI variations)
- Identify winning templates

---

## Advanced Features

### AI Enhancements (In Development)
- [ ] Subject line A/B testing with auto-recommendation
- [ ] Send time optimization (when recipients are most likely to open)
- [ ] Best day to send (Tuesday/Wednesday peaks)
- [ ] Content recommendations based on industry
- [ ] Reply tone detection (detect angry replies automatically)

### Automation (In Development)
- [ ] Auto-follow-up sequences
- [ ] Pause campaign if bounce rate > 5%
- [ ] Auto-unsubscribe bounced addresses
- [ ] Smart follow-up timing based on open time
- [ ] Lead scoring based on reply patterns

### Team Features (Growth/Pro Plans)
- [ ] Assign campaigns to team members
- [ ] Shared reply inbox with assignments
- [ ] Campaign approval workflow
- [ ] Collaboration notes on campaigns
- [ ] Shared templates per team

---

## Troubleshooting

### Campaign Won't Send
**Issue**: Campaign stuck in "draft" status

**Solutions**:
1. Check recipients count > 0
2. Verify from email is configured
3. Check sending domain is verified
4. Ensure plan allows campaign send
5. Check API error response

### Low Open Rates (< 10%)
**Common Causes**:
1. Generic subject line
2. Sending at wrong time (off-business hours)
3. Email looks like spam
4. Wrong audience

**Solutions**:
1. Use AI to generate subject lines
2. Test different sending times
3. Verify DKIM/SPF setup
4. Segment audience better

### High Bounce Rate (> 5%)
**Common Causes**:
1. Old/stale contact list
2. Email list sourced from bad quality
3. Domain reputation issues
4. Email format problems

**Solutions**:
1. Clean contact list
2. Verify email addresses before sending
3. Warm up domain using warmup feature
4. Check email provider bounce reports

### No Replies
**Common Causes**:
1. Email perceived as promotional
2. No clear CTA (call-to-action)
3. Not reaching right decision maker
4. Email ends up in spam/promotions folder

**Solutions**:
1. Use AI to improve email body
2. Add explicit reply request
3. Segment to decision makers only
4. Check spam folder delivery
5. Try different value proposition

---

## Security & Compliance

### Data Privacy
- Merge tags only replaced in actual send (data never logged)
- Contact data secured with encryption
- Campaign content encrypted in transit

### Compliance
- **CAN-SPAM**: Reply-to required, unsubscribe mechanism
- **GDPR**: Contact consent verification, data retention policies
- **SMS Regulations**: Not applicable (email only)

### Best Practices
1. Always get explicit consent to email
2. Include unsubscribe option
3. Honor unsubscribe requests immediately
4. Monitor reputation metrics
5. Maintain sender reputation > 95%

---

## API Reference

### Create Campaign
```
POST /api/campaigns
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": string,
  "template_id": string | null,
  "subject": string,
  "body": string,
  "from_name": string,
  "from_email": string,
  "reply_to": string,
  "provider": "aws_ses" | "gmail" | "resend" | "smtp",
  "domain": string,
  "notes": string
}

Response: 201 Created
{ "campaign": { ...campaign object } }
```

### Get AI Suggestions
```
POST /api/campaigns/ai-suggestions
Authorization: Bearer {token}
Content-Type: application/json

{
  "campaign_name": string,
  "subject": string | null,  // for body suggestions
  "body": string | null      // for subject suggestions
}

Response: 200 OK
{
  "suggestions": ["suggestion1", "suggestion2", ...],
  "tips": ["tip1", "tip2"]
}
```

### Send Campaign
```
POST /api/campaigns/{id}/send
Authorization: Bearer {token}

Response: 200 OK
{ "message": "Campaign queued for sending" }
```

### Get Campaign Details
```
GET /api/campaigns/{id}
Authorization: Bearer {token}

Response: 200 OK
{ "campaign": { ...full campaign object with analytics } }
```

---

## Summary

The campaign creation process is designed to be **fast, intelligent, and powerful**:

1. **Fast**: 3-step wizard gets you from blank to launch-ready in < 5 minutes
2. **Intelligent**: AI suggestions for subject lines and email bodies
3. **Powerful**: Full merge tag support, multiple email providers, real-time analytics
4. **Production-Ready**: Plan-based limits, comprehensive tracking, compliance built-in

Users can go from idea → compose → send → analyze in a single flow, with AI assistance throughout to maximize response rates.
