# Build stage
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

WORKDIR /app

# NEXT_PUBLIC_* vars are inlined at build time by Next.js (both client & server bundles).
# They MUST be real values here. All other secrets use runtime env vars from ECS task definition.
ENV NEXT_PUBLIC_SUPABASE_URL=https://eqksgmbcyvfllcaeqgbj.supabase.co \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa3NnbWJjeXZmbGxjYWVxZ2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE0NjAsImV4cCI6MjA4NTQyNzQ2MH0.zCs_fM-_RpY4fd8NKKCekI3fNvB9vMgSG3ti84qYrHw \
    NEXT_PUBLIC_APP_URL=https://tryleadflow.ai \
    JWT_SECRET=build-placeholder \
    SUPABASE_SERVICE_ROLE_KEY=placeholder-service-key \
    OPENAI_API_KEY=sk-placeholder \
    RESEND_API_KEY=re_placeholder \
    STRIPE_SECRET_KEY=sk_test_placeholder \
    STRIPE_WEBHOOK_SECRET=whsec_placeholder \
    STRIPE_PRICE_STARTER_MONTHLY=price_placeholder \
    STRIPE_PRICE_STARTER_ANNUAL=price_placeholder \
    STRIPE_PRICE_PRO_MONTHLY=price_placeholder \
    STRIPE_PRICE_PRO_ANNUAL=price_placeholder \
    STRIPE_PRICE_ENTERPRISE_MONTHLY=price_placeholder \
    STRIPE_PRICE_ENTERPRISE_ANNUAL=price_placeholder \
    INNGEST_SIGNING_KEY=signkey-placeholder \
    GOOGLE_CLIENT_ID=placeholder \
    GOOGLE_CLIENT_SECRET=placeholder \
    MICROSOFT_CLIENT_ID=placeholder \
    MICROSOFT_CLIENT_SECRET=placeholder \
    AZURE_CLIENT_ID=placeholder \
    AZURE_CLIENT_SECRET=placeholder \
    HUBSPOT_CLIENT_ID=placeholder \
    HUBSPOT_CLIENT_SECRET=placeholder \
    HUBSPOT_REDIRECT_URI=https://tryleadflow.ai/api/crm/hubspot/callback \
    PIPEDRIVE_CLIENT_ID=placeholder \
    PIPEDRIVE_CLIENT_SECRET=placeholder \
    PIPEDRIVE_REDIRECT_URI=https://tryleadflow.ai/api/crm/pipedrive/callback \
    SALESFORCE_CLIENT_ID=placeholder \
    SALESFORCE_CLIENT_SECRET=placeholder \
    SALESFORCE_LOGIN_URL=https://login.salesforce.com \
    SALESFORCE_REDIRECT_URI=https://tryleadflow.ai/api/crm/salesforce/callback \
    AWS_ACCESS_KEY_ID=placeholder \
    AWS_SECRET_ACCESS_KEY=placeholder \
    AWS_REGION=us-east-1 \
    AWS_SES_FROM_EMAIL=noreply@tryleadflow.ai

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js
RUN pnpm run build

# Production stage
FROM public.ecr.aws/docker/library/node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["pnpm", "start"]
