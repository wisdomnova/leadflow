-- Create email_providers table to store user's email sending configuration
CREATE TABLE public.email_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  provider_type VARCHAR(50) NOT NULL,
  -- provider_type can be: 'gmail', 'resend', 'smtp', or 'none' (if skipped)
  
  -- Gmail OAuth fields
  gmail_access_token TEXT,
  gmail_refresh_token TEXT,
  gmail_token_expiry TIMESTAMP WITH TIME ZONE,
  
  -- Resend API fields
  resend_api_key VARCHAR(255),
  
  -- SMTP fields
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_username VARCHAR(255),
  smtp_password VARCHAR(255),
  smtp_from_email VARCHAR(255),
  smtp_from_name VARCHAR(255),
  
  -- General fields
  is_verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_provider_logs table for tracking send attempts
CREATE TABLE public.email_provider_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_type VARCHAR(50),
  email_to VARCHAR(255),
  subject VARCHAR(255),
  status VARCHAR(50),
  -- status: 'sent', 'failed', 'bounced', 'opened', 'clicked'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_email_providers_user_id ON public.email_providers(user_id);
CREATE INDEX idx_email_provider_logs_user_id ON public.email_provider_logs(user_id);
CREATE INDEX idx_email_provider_logs_status ON public.email_provider_logs(status);
