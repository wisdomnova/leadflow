// lib/affiliate/affiliate-manager.ts
import { supabase } from '@/lib/supabase'
import { createHash } from 'crypto'

export interface Affiliate {
  id: string
  user_id: string
  affiliate_code: string
  program_id: string
  status: 'pending' | 'active' | 'suspended' | 'terminated'
  referral_link: string
  total_referrals: number
  total_earnings: number
  paid_earnings: number
  pending_earnings: number
  payment_email?: string
  payment_method: 'stripe' | 'paypal' | 'bank_transfer'
  payment_details: Record<string, any>
  approved_at?: string
  last_payout_at?: string
  created_at: string
  updated_at: string
}

export interface Referral {
  id: string
  affiliate_id: string
  referred_user_id?: string
  referred_organization_id?: string
  referral_code: string
  email?: string
  ip_address?: string
  user_agent?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  landing_page?: string
  conversion_type: 'click' | 'signup' | 'subscription'
  converted_at?: string
  subscription_id?: string
  status: 'pending' | 'converted' | 'cancelled'
  created_at: string
}

export interface CommissionTransaction {
  id: string
  affiliate_id: string
  referral_id: string
  transaction_type: 'commission' | 'bonus' | 'adjustment' | 'chargeback'
  amount: number
  commission_rate?: number
  base_amount?: number
  currency: string
  stripe_payment_intent_id?: string
  stripe_subscription_id?: string
  billing_period_start?: string
  billing_period_end?: string
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled'
  paid_at?: string
  metadata: Record<string, any>
  created_at: string
}

export class AffiliateManager {
  
  // Create new affiliate account
  static async createAffiliate(
    userId: string,
    data: {
      payment_email: string
      payment_method: 'stripe' | 'paypal' | 'bank_transfer'
      payment_details?: Record<string, any>
    }
  ): Promise<Affiliate> {
    try {
      // Generate unique affiliate code
      const { data: codeResult } = await supabase.rpc('generate_affiliate_code')
      const affiliateCode = codeResult

      // Create referral link
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tryleadflow.ai'
      const referralLink = `${baseUrl}/api/track/referral?ref=${affiliateCode}`

      // Insert affiliate record
      const { data: affiliate, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: userId,
          affiliate_code: affiliateCode,
          referral_link: referralLink,
          payment_email: data.payment_email,
          payment_method: data.payment_method,
          payment_details: data.payment_details || {},
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create affiliate: ${error.message}`)
      }

      return affiliate

    } catch (error) {
      console.error('Failed to create affiliate:', error)
      throw error
    }
  }

  // Get affiliate by user ID
  static async getAffiliateByUserId(userId: string): Promise<Affiliate | null> {
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Failed to get affiliate: ${error.message}`)
    }

    return affiliate
  }

  // Get affiliate by code
  static async getAffiliateByCode(code: string): Promise<Affiliate | null> {
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('affiliate_code', code)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get affiliate: ${error.message}`)
    }

    return affiliate
  }

  // Track affiliate link click
  static async trackClick(
    referralCode: string,
    clickData: {
      ip_address?: string
      user_agent?: string
      referer?: string
      utm_source?: string
      utm_medium?: string
      utm_campaign?: string
      country?: string
      device_type?: string
      browser?: string
      os?: string
    }
  ): Promise<void> {
    try {
      // Get affiliate by code
      const affiliate = await this.getAffiliateByCode(referralCode)
      if (!affiliate) {
        console.warn(`Invalid referral code: ${referralCode}`)
        return
      }

      // Track the click
      await supabase
        .from('affiliate_clicks')
        .insert({
          affiliate_id: affiliate.id,
          referral_code: referralCode,
          ip_address: clickData.ip_address,
          user_agent: clickData.user_agent,
          referer: clickData.referer,
          utm_source: clickData.utm_source,
          utm_medium: clickData.utm_medium,
          utm_campaign: clickData.utm_campaign,
          country: clickData.country,
          device_type: clickData.device_type,
          browser: clickData.browser,
          os: clickData.os
        })

    } catch (error) {
      console.error('Failed to track click:', error)
    }
  }

  // Track signup referral
  static async trackSignup(
    referralCode: string,
    newUserId: string,
    organizationId: string,
    signupData: {
      email: string
      ip_address?: string
      user_agent?: string
      utm_source?: string
      utm_medium?: string
      utm_campaign?: string
      landing_page?: string
    }
  ): Promise<void> {
    try {
      // Get affiliate by code
      const affiliate = await this.getAffiliateByCode(referralCode)
      if (!affiliate) {
        console.warn(`Invalid referral code for signup: ${referralCode}`)
        return
      }

      // Create referral record
      const { data: referral, error } = await supabase
        .from('referrals')
        .insert({
          affiliate_id: affiliate.id,
          referred_user_id: newUserId,
          referred_organization_id: organizationId,
          referral_code: referralCode,
          email: signupData.email,
          ip_address: signupData.ip_address,
          user_agent: signupData.user_agent,
          utm_source: signupData.utm_source,
          utm_medium: signupData.utm_medium,
          utm_campaign: signupData.utm_campaign,
          landing_page: signupData.landing_page,
          conversion_type: 'signup',
          converted_at: new Date().toISOString(),
          status: 'converted'
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to track signup: ${error.message}`)
      }

      // Update affiliate total referrals
      await supabase
        .from('affiliates')
        .update({
          total_referrals: affiliate.total_referrals + 1
        })
        .eq('id', affiliate.id)

      // Mark affiliate click as converted if exists
      await supabase
        .from('affiliate_clicks')
        .update({ converted: true })
        .eq('referral_code', referralCode)
        .eq('ip_address', signupData.ip_address)
        .is('converted', false)

      console.log(`Tracked signup referral for ${signupData.email} via ${referralCode}`)

    } catch (error) {
      console.error('Failed to track signup:', error)
    }
  }

  // Track subscription conversion (when user subscribes)
  static async trackSubscription(
    userId: string,
    subscriptionId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<void> {
    try {
      // Find referral for this user
      const { data: referral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_user_id', userId)
        .eq('status', 'converted')
        .single()

      if (!referral) {
        console.log(`No referral found for user subscription: ${userId}`)
        return
      }

      // Update referral with subscription info
      await supabase
        .from('referrals')
        .update({
          subscription_id: subscriptionId,
          conversion_type: 'subscription'
        })
        .eq('id', referral.id)

      // Calculate commission (15%)
      const commissionAmount = amount * 0.15

      // Create commission transaction
      await supabase
        .from('commission_transactions')
        .insert({
          affiliate_id: referral.affiliate_id,
          referral_id: referral.id,
          transaction_type: 'commission',
          amount: commissionAmount,
          commission_rate: 0.15,
          base_amount: amount,
          currency: currency,
          stripe_subscription_id: subscriptionId,
          billing_period_start: new Date().toISOString().split('T')[0],
          billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending'
        })

      // Update affiliate earnings
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('pending_earnings, total_earnings')
        .eq('id', referral.affiliate_id)
        .single()

      if (affiliate) {
        await supabase
          .from('affiliates')
          .update({
            pending_earnings: affiliate.pending_earnings + commissionAmount,
            total_earnings: affiliate.total_earnings + commissionAmount
          })
          .eq('id', referral.affiliate_id)
      }

      console.log(`Tracked subscription commission: $${commissionAmount} for affiliate ${referral.affiliate_id}`)

    } catch (error) {
      console.error('Failed to track subscription:', error)
    }
  }

  // Process recurring commission (for monthly subscriptions)
  static async processRecurringCommission(
    subscriptionId: string,
    amount: number,
    paymentIntentId: string,
    billingPeriodStart: string,
    billingPeriodEnd: string
  ): Promise<void> {
    try {
      // Find referral by subscription ID
      const { data: referral } = await supabase
        .from('referrals')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .single()

      if (!referral) {
        console.log(`No referral found for subscription: ${subscriptionId}`)
        return
      }

      // Check if commission already processed for this billing period
      const { data: existingCommission } = await supabase
        .from('commission_transactions')
        .select('id')
        .eq('referral_id', referral.id)
        .eq('stripe_subscription_id', subscriptionId)
        .eq('billing_period_start', billingPeriodStart)
        .single()

      if (existingCommission) {
        console.log(`Commission already processed for period: ${billingPeriodStart}`)
        return
      }

      // Calculate commission (15%)
      const commissionAmount = amount * 0.15

      // Create commission transaction
      await supabase
        .from('commission_transactions')
        .insert({
          affiliate_id: referral.affiliate_id,
          referral_id: referral.id,
          transaction_type: 'commission',
          amount: commissionAmount,
          commission_rate: 0.15,
          base_amount: amount,
          currency: 'USD',
          stripe_payment_intent_id: paymentIntentId,
          stripe_subscription_id: subscriptionId,
          billing_period_start: billingPeriodStart,
          billing_period_end: billingPeriodEnd,
          status: 'confirmed'
        })

      // Update affiliate earnings
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('pending_earnings, total_earnings')
        .eq('id', referral.affiliate_id)
        .single()

      if (affiliate) {
        await supabase
          .from('affiliates')
          .update({
            pending_earnings: affiliate.pending_earnings + commissionAmount,
            total_earnings: affiliate.total_earnings + commissionAmount
          })
          .eq('id', referral.affiliate_id)
      }

      console.log(`Processed recurring commission: $${commissionAmount} for subscription ${subscriptionId}`)

    } catch (error) {
      console.error('Failed to process recurring commission:', error)
    }
  }

  // Get affiliate dashboard data
  static async getAffiliateDashboard(
    affiliateId: string,
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<{
    stats: {
      totalClicks: number
      totalReferrals: number
      conversionRate: number
      totalEarnings: number
      pendingEarnings: number
      paidEarnings: number
    }
    recentReferrals: Referral[]
    recentCommissions: CommissionTransaction[]
    chartData: Array<{
      date: string
      clicks: number
      signups: number
      earnings: number
    }>
  }> {
    try {
      // Calculate date range
      const now = new Date()
      let startDate = new Date()
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }

      // Get affiliate data
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('*')
        .eq('id', affiliateId)
        .single()

      if (!affiliate) {
        throw new Error('Affiliate not found')
      }

      // Get clicks for timeframe
      const { data: clicks } = await supabase
        .from('affiliate_clicks')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .gte('created_at', startDate.toISOString())

      // Get referrals for timeframe
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .gte('created_at', startDate.toISOString())

      // Get recent referrals (last 10)
      const { data: recentReferrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Get commissions for timeframe
      const { data: commissions } = await supabase
        .from('commission_transactions')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .gte('created_at', startDate.toISOString())

      // Get recent commissions (last 10)
      const { data: recentCommissions } = await supabase
        .from('commission_transactions')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Calculate stats
      const totalClicks = clicks?.length || 0
      const totalReferrals = referrals?.filter(r => r.status === 'converted').length || 0
      const conversionRate = totalClicks > 0 ? (totalReferrals / totalClicks) * 100 : 0
      const totalEarnings = commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0

      // Generate chart data
      const chartData = []
      const days = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const dayClicks = clicks?.filter(c => c.created_at.startsWith(dateStr)).length || 0
        const daySignups = referrals?.filter(r => r.created_at.startsWith(dateStr) && r.status === 'converted').length || 0
        const dayEarnings = commissions?.filter(c => c.created_at.startsWith(dateStr)).reduce((sum, c) => sum + Number(c.amount), 0) || 0

        chartData.push({
          date: dateStr,
          clicks: dayClicks,
          signups: daySignups,
          earnings: dayEarnings
        })
      }

      return {
        stats: {
          totalClicks,
          totalReferrals,
          conversionRate,
          totalEarnings,
          pendingEarnings: affiliate.pending_earnings,
          paidEarnings: affiliate.paid_earnings
        },
        recentReferrals: recentReferrals || [],
        recentCommissions: recentCommissions || [],
        chartData
      }

    } catch (error) {
      console.error('Failed to get affiliate dashboard:', error)
      throw error
    }
  }

  // Approve affiliate
  static async approveAffiliate(affiliateId: string): Promise<void> {
    const { error } = await supabase
      .from('affiliates')
      .update({
        status: 'active',
        approved_at: new Date().toISOString()
      })
      .eq('id', affiliateId)

    if (error) {
      throw new Error(`Failed to approve affiliate: ${error.message}`)
    }
  }

  // Update affiliate payment details
  static async updatePaymentDetails(
    affiliateId: string,
    paymentData: {
      payment_email?: string
      payment_method?: 'stripe' | 'paypal' | 'bank_transfer'
      payment_details?: Record<string, any>
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('affiliates')
      .update({
        ...paymentData,
        updated_at: new Date().toISOString()
      })
      .eq('id', affiliateId)

    if (error) {
      throw new Error(`Failed to update payment details: ${error.message}`)
    }
  }
}