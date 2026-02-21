'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Share2, Zap, Award, Target, Gift, ArrowRight } from 'lucide-react';

const benefits = [
  { label: 'Your Reward', value: '20% OFF', description: 'Forever discount on your subscription.' },
  { label: 'Friend Reward', value: '20% OFF', description: 'They get rewarded for joining via you.' },
  { label: 'No Limits', value: 'UNLIMITED', description: 'The more you refer, the more you help.' },
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
              <Gift className="w-3.5 h-3.5 fill-[#745DF3]" />
              <span>Referral Program</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-[1.05]">
              Both get 20% off <br />
              <span className="text-[#745DF3]">forever.</span>
            </h2>
            
            <p className="text-lg md:text-xl text-white/50 font-medium mb-12 max-w-2xl leading-relaxed">
              Invite your friends to LeadFlow and you&apos;ll both receive a 20% discount on your subscription for as long as you remain members.
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={benefit.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:bg-white/[0.06] transition-all group/tier"
                >
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{benefit.label}</p>
                  <p className="text-[#745DF3] font-black text-3xl tracking-tighter mb-1">{benefit.value}</p>
                  <p className="text-white/60 text-xs font-bold">{benefit.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-6 border-t border-white/5">
              <Link 
                href="/signup"
                className="w-full sm:w-auto px-8 py-5 bg-[#745DF3] text-white rounded-[2rem] font-black text-sm hover:bg-[#745DF3]/90 transition-all shadow-xl shadow-[#745DF3]/10 flex items-center justify-center gap-2 group"
              >
                Join Referral Program
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
