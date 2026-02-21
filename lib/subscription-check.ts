import { createClient } from '@supabase/supabase-js';
import { getSessionContext } from './auth-utils';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkSubscription(orgIdParam?: string) {
  let targetOrgId;
  
  if (orgIdParam) {
    targetOrgId = orgIdParam;
  } else {
    const context = await getSessionContext();
    if (!context) return { active: false, error: 'Unauthorized' };
    targetOrgId = context.orgId;
  }

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('subscription_status, plan_tier, smart_sending_enabled, ai_usage_current, ai_usage_limit, trial_ends_at')
    .eq('id', targetOrgId)
    .single();

  if (!org) return { 
    active: false, 
    error: 'Organization not found',
    tier: 'starter' as const,
    smartEnabled: false,
    usage: { current: 0, limit: 500, isOver: false },
    limits: { emails: 10000, ai: 500, powersend: 0 }
  };

  // Determine active status
  const trialExpired = org.trial_ends_at ? new Date(org.trial_ends_at) < new Date() : false;
  const isActive = org.subscription_status === 'active' || org.subscription_status === 'canceling' || (org.subscription_status === 'trialing' && !trialExpired);

  // Define limits per tier
  const tierLimits = {
    starter: { emails: 10000, ai: 500, powersend: 0 },
    pro: { emails: 100000, ai: 1000000, powersend: 0 },
    enterprise: { emails: 500000, ai: 1000000, powersend: 3 }
  };

  const tier = (org.plan_tier || 'starter') as keyof typeof tierLimits;
  const limits = tierLimits[tier] || tierLimits.starter;

  return { 
    active: isActive, 
    status: org.subscription_status,
    tier,
    smartEnabled: org.smart_sending_enabled || (tier !== 'starter'),
    usage: {
      current: org.ai_usage_current,
      limit: limits.ai,
      isOver: (org.ai_usage_current || 0) >= limits.ai
    },
    limits
  };
}
