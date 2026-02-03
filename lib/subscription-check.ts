import { createClient } from '@supabase/supabase-js';
import { getSessionContext } from './auth-utils';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkSubscription() {
  const context = await getSessionContext();
  if (!context) return { active: false, error: 'Unauthorized' };

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('subscription_status')
    .eq('id', context.orgId)
    .single();

  if (!org || org.subscription_status !== 'active') {
    return { active: false, status: org?.subscription_status };
  }

  return { active: true };
}
