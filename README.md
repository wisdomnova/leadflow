This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Email Infrastructure (Production)

- Database: SQL migration `database/009_email_infra.sql` creates:
	- `user_ses_accounts`: stores encrypted SES credentials per user.
	- `verified_domains`: tracks domain + SPF/DKIM/DMARC statuses.
	- `user_warmup_schedule` and `warmup_daily_log`: warmup plan and daily limits.
	- `campaigns` and `email_events`: scaffolding for campaign/send telemetry.

- APIs:
  - `app/api/email/ses/connect`: POST `{ accessKeyId, secretAccessKey, region }` to save SES.
  - `app/api/email/domains`: GET list; POST `{ domain }` to create SES identity and fetch DKIM tokens.
  - `app/api/email/domains/[id]/verify`: POST to check DNS (SPF/DKIM/DMARC) and update statuses.
  - `app/api/email/warmup/status`: GET current schedules.
  - `app/api/email/warmup/start`: POST `{ provider, domain }` to start 14-day warmup.

- Supabase Edge Function:
  - `supabase/functions/reset-warmup`: Daily cron job to advance warmup schedules and log new daily limits.- UI:
	- `app/(default)/email/page.tsx`: Onboarding dashboard with checklist, domain status, warmup summary.
	- `app/(default)/email/connect-ses/page.tsx`: SES credentials form.
	- `app/(default)/email/verify-domain/page.tsx`: Domain creation + DKIM display + verification.

- Warmup Plan:
	- Default 14-day plan ramp: 25 → 1200 daily.
	- Enforced via `user_warmup_schedule.enforced` and checked in send endpoints.

- AWS SDK:
	- Dependency `@aws-sdk/client-sesv2` added in `package.json`.
	- SES identity creation returns DKIM tokens for CNAME records.

### Cron Setup (Supabase)

1. Deploy the Edge Function:
```bash
cd /Users/user/mosaic-next
supabase functions deploy reset-warmup
```

2. Run the SQL in `supabase/cron-setup.sql` via Supabase SQL Editor to schedule daily execution at midnight UTC.

3. Verify the cron job is scheduled:
```sql
SELECT * FROM cron.job;
```

The Edge Function is at `supabase/functions/reset-warmup/index.ts` and runs daily to advance warmup schedules.### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for Supabase access.
- `SES_ENCRYPTION_SECRET` (recommended) or `JWT_SECRET` used for AES-256-GCM encryption of SES keys.
- Edge Function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (set automatically in Supabase Functions environment).

### DNS Records

- SPF: `TXT` on root `v=spf1 include:amazonses.com ~all`.
- DKIM: 3 `CNAME` records from SES tokens: `<token>._domainkey.<domain> → <token>.dkim.amazonses.com`.
- DMARC: `TXT` `_dmarc.<domain>` with `v=DMARC1; p=none` (adjust policy over time).

## Campaign System

- Database: `database/010_campaigns.sql` creates:
  - Extended `campaigns` table with analytics columns
  - `campaign_sends`: per-contact tracking (status, timestamps, message_id)
  - `campaign_recipients`: selection snapshot
  - `email_replies`: AI-classified replies with sentiment

- APIs:
  - `app/api/campaigns`: GET list, POST create
  - `app/api/campaigns/[id]`: GET/PUT/DELETE single campaign
  - `app/api/campaigns/[id]/recipients`: POST add, GET list
  - `app/api/campaigns/[id]/send`: POST queue/send campaign (checks warmup)
  - `app/api/campaigns/[id]/analytics`: GET detailed metrics
  - `app/api/webhooks/email-reply`: POST webhook for reply capture and AI classification

- UI:
  - `app/(default)/campaigns`: Campaign list with status filter
  - `app/(default)/campaigns/new`: 3-step wizard (template → contacts → settings)
  - `app/(default)/campaigns/[id]`: Campaign detail + analytics + recipient table

- Supabase Edge Function:
  - `supabase/functions/send-queue`: Processes queued campaigns, enforces warmup limits, logs events
  - Schedule via pg_cron every 5 minutes for near real-time sending

- AI Reply Classification:
  - Uses OpenAI gpt-4o-mini to categorize replies (interested, question, objection, etc.)
  - Sentiment scoring -1.0 to 1.0
  - Replies visible in `/messages` page

### Setup Instructions

1. Get OpenAI API key:
   - Visit https://platform.openai.com/api-keys
   - Create new key, add to `OPENAI_API_KEY` env var

2. Generate webhook secret:
```zsh
openssl rand -hex 32
```
   - Add to `EMAIL_WEBHOOK_SECRET`

3. Deploy send queue Edge Function:
```zsh
supabase functions deploy send-queue
```

4. Schedule send queue (add to `supabase/cron-setup.sql`):
```sql
SELECT cron.schedule(
  'send-queue-every-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  ) AS request_id;
  $$
);
```

### Reply Capture Setup

- **Gmail**: Configure Gmail Pub/Sub webhook to call `/api/webhooks/email-reply` with `x-webhook-secret` header
- **AWS SES**: Set up SES receipt rules → SNS → webhook to `/api/webhooks/email-reply`
- **Resend**: Configure inbound email parsing webhook
- **SMTP**: Poll IMAP inbox periodically (separate cron job)

### Next Steps

- Implement provider-specific sending logic in send-queue (currently simplified)
- Add A/B testing variants
- Build follow-up sequences based on reply classification
