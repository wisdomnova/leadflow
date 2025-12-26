# Subscription Plans & Feature Gating - Production Documentation

## Overview

This document describes how subscription plans are integrated with campaigns, warmup, messages, and other features in the production system. All tier gates are enforced at both API and UI levels.

## Pricing Plans

### Trial Plan (Free)
- **Price**: $0/month
- **Monthly Emails**: 1,000
- **Contacts Limit**: 100
- **Users**: 1
- **Features**:
  - ✓ Basic email templates
  - ✓ Up to 3 campaigns (limited)
  - ✓ Central inbox (Messages)
  - ✗ Email warmup (not available)

### Starter Plan ($29/month)
- **Price**: $29/month (or $278/year with 20% discount)
- **Monthly Emails**: 10,000
- **Contacts Limit**: 5,000
- **Users**: 1
- **Features**:
  - ✓ Unlimited AI generator & personalization
  - ✓ AI subject lines & follow-up suggestions
  - ✓ Up to 50 campaigns
  - ✓ Email warmup (1 domain)
  - ✓ Central inbox (Messages)
  - ✓ Advanced analytics dashboard
  - ✓ Email & chat support

### Growth Plan ($99/month)
- **Price**: $99/month (or $950/year with 20% discount)
- **Monthly Emails**: 100,000
- **Contacts Limit**: 50,000
- **Users**: 3
- **Features**:
  - ✓ All Starter features
  - ✓ Up to 500 campaigns
  - ✓ Email warmup (5 domains)
  - ✓ Priority support (chat + email)

### Pro Plan ($299/month)
- **Price**: $299/month (or $2,870/year with 20% discount)
- **Monthly Emails**: 500,000 (effectively unlimited)
- **Contacts Limit**: Unlimited
- **Users**: 10
- **Features**:
  - ✓ All Growth features
  - ✓ Unlimited campaigns
  - ✓ Unlimited warmup domains
  - ✓ API access for integrations
  - ✓ Dedicated account manager
  - ✓ Priority 24/7 support
  - ✓ Custom integrations

## Implementation Details

### Key Files
- `/lib/plans.ts` - Plan definitions
- `/lib/plan-features.ts` - Feature matrix and access control
- `/lib/user-plan.ts` - User plan lookup utilities
- `/components/feature-gate.tsx` - UI components for gating
- `/app/api/campaigns/route.ts` - Campaign limit enforcement
- `/app/(default)/campaigns/page.tsx` - Campaign list with plan info
- `/app/(default)/warmup/page.tsx` - Warmup feature with gating

### Plan Features Matrix

```typescript
PLAN_FEATURES = {
  trial: {
    campaignsEnabled: true,
    campaignsLimit: 3,
    warmupEnabled: false,
    warmupDomainsLimit: 0,
    emailsPerMonth: 1000,
    contactsLimit: 100,
    users: 1,
  },
  starter: {
    campaignsEnabled: true,
    campaignsLimit: 50,
    warmupEnabled: true,
    warmupDomainsLimit: 1,
    emailsPerMonth: 10000,
    contactsLimit: 5000,
    users: 1,
  },
  growth: {
    campaignsEnabled: true,
    campaignsLimit: 500,
    warmupEnabled: true,
    warmupDomainsLimit: 5,
    emailsPerMonth: 100000,
    contactsLimit: 50000,
    users: 3,
  },
  pro: {
    campaignsEnabled: true,
    campaignsLimit: -1, // unlimited
    warmupEnabled: true,
    warmupDomainsLimit: -1, // unlimited
    emailsPerMonth: 500000,
    contactsLimit: -1, // unlimited
    users: 10,
  },
}
```

## Feature Gating Enforcement

### Campaigns
- **API Level**: `POST /api/campaigns` checks campaign count and rejects if limit reached
- **UI Level**: 
  - Campaigns page shows current plan
  - Trial users see warning when approaching 3-campaign limit
  - Create button shows alert if at limit
  - Status code 403 returned with `CAMPAIGN_LIMIT_REACHED` on API

### Email Warmup
- **Available On**: Starter, Growth, Pro (not on Trial)
- **Implementation**: `/app/(default)/warmup/page.tsx` shows feature gate prompt
- **UI**: Users see "Upgrade to Starter" message with billing link

### Messages/Inbox
- **Available On**: All plans (Trial, Starter, Growth, Pro)
- **Sidebar Integration**: Always visible and accessible

### Contacts
- **Limits**:
  - Trial: 100 contacts
  - Starter: 5,000 contacts
  - Growth: 50,000 contacts
  - Pro: Unlimited

## Sign-up Flow with Plan Selection

1. User selects plan during signup
2. Plan features are displayed (first 3 features highlighted)
3. For paid plans, user selects billing cycle (monthly/yearly)
4. On submit:
   - Trial: Skips Stripe, goes to email setup
   - Paid plans: Creates Stripe checkout session

## Database Integration

### Users Table
- `plan_id` field stores current plan (trial, starter, growth, pro)
- `stripe_subscription_id` links to Stripe subscription
- `stripe_customer_id` for Stripe customer record
- `payment_status` tracks payment state (pending, completed, cancelled)

### Getting User's Current Plan
```typescript
// In API routes
const planId = await getUserPlanId(userId) // returns 'trial' if not set

// Check feature availability
const hasWarmup = hasFeature(planId, 'warmupEnabled')
const campaignLimit = getFeatureLimit(planId, 'campaignsLimit')
```

## API Responses

### Campaign Creation with Limit Exceeded
```json
{
  "error": "Campaign limit reached (3 campaigns)",
  "code": "CAMPAIGN_LIMIT_REACHED",
  "limit": 3,
  "current": 3
}
```

Status Code: `403 Forbidden`

## UI Components

### Feature Gate Prompt
```tsx
<FeatureGatePrompt 
  feature="Email Warmup" 
  currentPlan="trial" 
  requiredPlan="Starter"
/>
```

### Limit Warning
```tsx
<LimitWarning 
  current={2} 
  limit={3} 
  featureName="campaigns"
/>
```

## Production Considerations

1. **Plan Verification**: Always check user's plan in API endpoints before granting access
2. **Graceful Degradation**: Show helpful upgrade prompts instead of errors
3. **Limit Enforcement**: Enforce limits at both API and database levels
4. **Audit Logging**: Log feature access attempts for audit trails
5. **Stripe Sync**: Ensure plan_id stays in sync with Stripe subscription status
6. **Trial Expiration**: Not currently implemented - set expiration date in future

## Testing Plan Limits

```bash
# Test campaign limit
curl -X POST /api/campaigns \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign"}'

# Expected response for trial user with 3 campaigns:
# 403 Forbidden with CAMPAIGN_LIMIT_REACHED error
```

## Future Enhancements

1. **Trial Expiration**: Add expiration date and automatic downgrade
2. **Seat Management**: Allow upgrading user count within Growth/Pro
3. **Usage Alerts**: Email users when approaching limits
4. **Flexible Billing**: Support monthly to yearly upgrades mid-cycle
5. **Team Features**: Growth/Pro should support team collaboration
6. **API Rate Limiting**: Enforce API calls per plan tier
