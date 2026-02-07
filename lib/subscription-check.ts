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
    .select('subscription_status, plan_tier, smart_sending_enabled, ai_usage_current, ai_usage_limit')
    .eq('id', targetOrgId)
    .single();

  if (!org) return { active: false, error: 'Organization not found' };

  // Determine active status
  const isActive = org.subscription_status === 'active' || org.subscription_status === 'trialing';

  return { 
    active: isActive, 
    status: org.subscription_status,
    tier: org.plan_tier as 'starter' | 'pro' | 'enterprise',
    smartEnabled: org.smart_sending_enabled,
    usage: {
      current: org.ai_usage_current,
      limit: org.ai_usage_limit,
      isOver: (org.ai_usage_current || 0) >= (org.ai_usage_limit || 500)
    }
  };
}
