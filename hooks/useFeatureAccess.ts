// hooks/useFeatureAccess.ts
import { useAuth } from './useAuth';
import { PLANS } from '@/lib/plans';

export function useFeatureAccess() {
  const { subscription } = useAuth();

  const getPlanLimits = () => {
    const planId = subscription?.plan_id || 'starter';
    const plan = PLANS[planId as keyof typeof PLANS] || PLANS.starter;
    
    return {
      monthlyEmails: plan.limits.monthlyEmails,
      maxUsers: plan.limits.maxUsers,
      contacts: typeof plan.limits.contacts === 'number' ? plan.limits.contacts : Infinity,
    };
  };

  const canSendMoreEmails = () => {
    const limits = getPlanLimits();
    const sent = subscription?.monthly_emails_sent || 0;
    return sent < limits.monthlyEmails;
  };

  const getRemainingEmails = () => {
    const limits = getPlanLimits();
    const sent = subscription?.monthly_emails_sent || 0;
    return Math.max(0, limits.monthlyEmails - sent);
  };

  const getEmailUsagePercentage = () => {
    const limits = getPlanLimits();
    const sent = subscription?.monthly_emails_sent || 0;
    return (sent / limits.monthlyEmails) * 100;
  };

  const canAddMoreUsers = (currentCount: number) => {
    const limits = getPlanLimits();
    return currentCount < limits.maxUsers;
  };

  const isFeatureAvailable = (feature: string) => {
    // All features available in all plans for now
    return true;
  };

  return {
    getPlanLimits,
    canSendMoreEmails,
    getRemainingEmails,
    getEmailUsagePercentage,
    canAddMoreUsers,
    isFeatureAvailable,
  };
}