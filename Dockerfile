# Build stage
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

WORKDIR /app

# All env vars needed at build time (dummy values for Next.js static analysis)
# Real values are injected at runtime via ECS task definition
ENV JWT_SECRET=build-placeholder \
    NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key \
    SUPABASE_SERVICE_ROLE_KEY=placeholder-service-key \
    NEXT_PUBLIC_APP_URL=https://placeholder.app \
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
    HUBSPOT_REDIRECT_URI=https://placeholder.app/api/crm/hubspot/callback \
    PIPEDRIVE_CLIENT_ID=placeholder \
    PIPEDRIVE_CLIENT_SECRET=placeholder \
    PIPEDRIVE_REDIRECT_URI=https://placeholder.app/api/crm/pipedrive/callback \
    SALESFORCE_CLIENT_ID=placeholder \
    SALESFORCE_CLIENT_SECRET=placeholder \
    SALESFORCE_LOGIN_URL=https://login.salesforce.com \
    SALESFORCE_REDIRECT_URI=https://placeholder.app/api/crm/salesforce/callback \
    AWS_ACCESS_KEY_ID=placeholder \
    AWS_SECRET_ACCESS_KEY=placeholder \
    AWS_REGION=us-east-1 \
    AWS_SES_FROM_EMAIL=noreply@placeholder.app

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
