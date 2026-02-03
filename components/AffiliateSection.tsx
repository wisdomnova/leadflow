'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Share2, Zap, Award, Target, Gift, ArrowRight } from 'lucide-react';

const tiers = [
  { name: 'Bronze', referrals: '1 Referral', discount: '20% OFF', color: 'bg-orange-400', icon: Target },
  { name: 'Silver', referrals: '3 Referrals', discount: '50% OFF', color: 'bg-slate-400', icon: Award },
  { name: 'Gold', referrals: '10 Referrals', discount: '80% OFF', color: 'bg-amber-400', icon: Gift },
  { name: 'Platinum', referrals: '25 Referrals', discount: '100% FREE', color: 'bg-[#745DF3]', icon: Zap },
];

const AffiliateSection = () => {
  return (
    <section className="py-24 md:py-32 bg-[#FBFBFB]" id="affiliates">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Main Content Card */}
        <div className="bg-[#101828] rounded-[2.5rem] p-10 md:p-20 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Share2 className="w-96 h-96 text-white" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-sm text-xs font-bold text-[#745DF3] mb-8 uppercase tracking-widest">
              <Share2 className="w-3.5 h-3.5 fill-[#745DF3]" />
              <span>Partner Program</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-[1.05]">
              Get LeadFlow for free <br />
              <span className="text-[#745DF3]">by referring others.</span>
            </h2>
            
            <p className="text-lg md:text-xl text-white/50 font-medium mb-12 max-w-2xl leading-relaxed">
              Join our referral community. As you bring new people to LeadFlow, your monthly cost drops. Refer 25 people and your account is free forever.
            </p>

            {/* Tiers Grid - Simplified */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {tiers.map((tier, i) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:bg-white/[0.06] transition-all group/tier overflow-hidden relative"
                >
                  <div className="relative z-10">
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{tier.name}</p>
                    <p className="text-[#745DF3] font-black text-3xl tracking-tighter mb-1">{tier.discount}</p>
                    <p className="text-white/60 text-xs font-bold">{tier.referrals}</p>
                  </div>
                  
                  {/* Subtle Gradient Accent */}
                  <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 -mr-12 -mt-12 transition-opacity group-hover/tier:opacity-40 ${tier.color}`} />
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-6 border-t border-white/5">
              <Link 
                href="/signup"
                className="w-full sm:w-auto px-8 py-5 bg-[#745DF3] text-white rounded-[2rem] font-black text-sm hover:bg-[#745DF3]/90 transition-all shadow-xl shadow-[#745DF3]/10 flex items-center justify-center gap-2 group"
              >
                Apply for Referral Account
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
                Trusted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AffiliateSection;
