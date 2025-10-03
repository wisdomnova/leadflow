import { useTrialStatus } from './useTrialStatus'

export function useFeatureAccess() {
  const { isTrialActive, subscriptionStatus } = useTrialStatus()
  
  const hasAccess = isTrialActive || subscriptionStatus === 'active'
  
  const canAddContacts = hasAccess
  const canCreateCampaigns = hasAccess
  const canExportData = hasAccess
  const canAccessAnalytics = hasAccess
  
  return {
    hasAccess,
    canAddContacts,
    canCreateCampaigns,
    canExportData,
    canAccessAnalytics,
    isTrialExpired: !isTrialActive && subscriptionStatus === 'trial'
  } 
}