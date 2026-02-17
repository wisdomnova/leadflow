'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Zap, ArrowRight } from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: '$39', annual: '$468' },
    description: 'Perfect for individual founders and solo sales reps.',
    features: ['10,000 Monthly Emails', 'Unlimited Sending Domains', 'Warm-up & Unibox', 'Full CRM Access', 'AI Personalization (Limited)', 'Basic Analytics'],
    color: 'gray'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: '$99', annual: '$1,188' },
    description: 'Best for growing teams and scaling outbound efforts.',
    features: ['100,000 Monthly Emails', 'PowerSend Unlocked (Add-on)', 'Unlimited AI Personalization', 'Team Dashboard', 'Advanced Analytics', 'Priority Support'],
    popular: true,
    color: 'purple'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: '$319', annual: '$3,828' },
    description: 'For large agencies and enterprise sales organizations.',
    features: ['500,000 Monthly Emails', '1 PowerSend Node Included', 'Custom API Access', 'SSO & Advanced Security', 'White-labeling', 'Dedicated Manager'],
    color: 'black'
  }
];

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <section className="py-24 md:py-32 bg-white" id="pricing">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-white shadow-sm text-xs font-bold text-[#745DF3] mb-8 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 fill-[#745DF3]" />
            <span>Pricing Plans</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-[#101828] mb-6 tracking-tighter leading-[1.05]">
            Simple, transparent <br />
            <span className="text-[#745DF3]">pricing for every stage.</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
            Choose the plan that fits your current needs. <br />
            Switch or cancel anytime. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="mt-12 flex items-center justify-center gap-4">
            <span className={`text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'text-[#101828]' : 'text-gray-400'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-14 h-8 bg-gray-100 rounded-full p-1 relative flex items-center transition-all focus:outline-none"
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all absolute ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold transition-all ${billingCycle === 'annual' ? 'text-[#101828]' : 'text-gray-400'}`}>Annually</span>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative bg-[#FBFBFB] rounded-[2.5rem] p-10 border transition-all hover:shadow-2xl hover:shadow-[#745DF3]/5 flex flex-col min-h-[600px] ${
                plan.popular ? 'border-[#745DF3] ring-1 ring-[#745DF3]/20 bg-white scale-[1.02] shadow-xl shadow-[#745DF3]/5 z-10' : 'border-gray-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#745DF3] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-black text-[#101828] mb-2 uppercase tracking-tight">{plan.name}</h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-10 flex items-baseline gap-1">
                <span className="text-4xl font-black text-[#101828] tracking-tighter">
                  {billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual}
                </span>
                <span className="text-gray-400 font-bold text-sm">
                  {billingCycle === 'monthly' ? '/month' : '/year'}
                </span>
              </div>

              <div className="space-y-4 mb-12 flex-1">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-[#745DF3] text-white' : 'bg-gray-100 text-[#101828]'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              <Link 
                href="/signup"
                className={`w-full py-5 rounded-[2rem] font-black text-sm transition-all group overflow-hidden relative flex items-center justify-center gap-2 ${
                  plan.popular 
                    ? 'bg-[#101828] text-white hover:bg-black shadow-xl shadow-[#101828]/10' 
                    : 'bg-white border border-gray-100 text-[#101828] hover:border-[#745DF3]/30'
                }`}
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
