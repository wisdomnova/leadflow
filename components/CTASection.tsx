'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const CTASection = () => {
  const [sparkles, setSparkles] = useState<{ top: string, left: string, opacity: number }[]>([]);

  useEffect(() => {
    const newSparkles = [...Array(30)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      opacity: Math.random()
    }));
    setSparkles(newSparkles);
  }, []);

  return (
    <section className="py-24 md:py-32 bg-white px-6">
      <div className="max-w-[1200px] mx-auto overflow-hidden rounded-[3rem] relative bg-[#101828] border border-white/5 shadow-2xl">
        {/* Background Sparkles Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
           {sparkles.map((style, i) => (
             <div 
               key={i} 
               className="absolute w-1 h-1 bg-white rounded-full"
               style={style}
             />
           ))}
        </div>

        {/* Floating Gradient */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#745DF3]/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between px-10 py-20 md:px-24 relative z-10">
          {/* Content */}
          <div className="flex-1 text-center lg:text-left mb-16 lg:mb-0">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[2.5rem] md:text-[4.5rem] font-black text-white mb-10 leading-[1.05] tracking-tighter max-w-2xl"
            >
              Start scaling <br />
              <span className="text-[#745DF3]">outreach with AI.</span>
            </motion.h2>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start"
            >
              <Link href="/signup" className="w-full sm:w-auto">
                <button className="bg-[#745DF3] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-[#745DF3]/90 transition-all shadow-xl shadow-[#745DF3]/20 w-full sm:w-auto">
                  Start free trial
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Tilted Mockup Container */}
          <motion.div 
            initial={{ opacity: 0, x: 50, rotate: 10 }}
            whileInView={{ opacity: 1, x: 0, rotate: -5 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 relative translate-x-12 lg:translate-x-32 scale-110"
          >
            <div className="w-[600px] h-[400px] bg-white rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative rotate-[-5deg] transform-gpu">
                {/* Simplified Analytics Mockup */}
                <div className="flex h-full">
                  <div className="w-1/4 border-r border-gray-100 p-6 bg-gray-50/50">
                     <div className="w-10 h-10 bg-[#745DF3]/10 rounded-xl mb-10" />
                     <div className="space-y-6">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="h-2 bg-gray-100 rounded-full w-full" />
                        ))}
                     </div>
                  </div>
                  <div className="flex-1 p-10">
                     <div className="flex justify-between mb-12">
                        <div className="w-32 h-6 bg-gray-100 rounded-lg" />
                        <div className="w-24 h-6 bg-[#745DF3]/10 rounded-lg" />
                     </div>
                     <div className="grid grid-cols-3 gap-6 mb-12">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-24 bg-gray-50 border border-gray-100 rounded-2xl" />
                        ))}
                     </div>
                     <div className="w-full h-32 bg-gray-50/50 rounded-2xl relative overflow-hidden p-6">
                        <div className="absolute inset-0 flex items-end gap-2 px-6 pb-6 mt-12">
                           {[40, 70, 45, 90, 65, 80, 50, 85, 30, 70, 40, 60, 45, 90].map((h, i) => (
                             <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-[#745DF3]/20 rounded-t-lg" />
                           ))}
                        </div>
                     </div>
                  </div>
                </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
