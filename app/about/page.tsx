'use client';

import React from 'react';
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] font-jakarta">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Story Section */}
          <div className="max-w-4xl mx-auto mb-32">
            <h1 className="text-5xl md:text-7xl font-black text-[#101828] mb-12 tracking-tighter leading-[1.1]">
              We fix <span className="text-[#745DF3]">outbound.</span>
            </h1>
            <div className="space-y-8 text-xl text-gray-500 font-medium leading-[1.8]">
              <p>
                LeadFlow was born out of frustration. For years, outreach teams have struggled with fragmented tools, messy data, and the constant fear of landing in the spam folder.
              </p>
              <p>
                We decided to build the platform we always wanted. A unified system that handles everything from deliverability to response management, powered by intelligent automation but focused on human connections.
              </p>
              <p>
                Today, thousands of founders and sales professionals use LeadFlow to grow their businesses without burning through domains or losing their sanity.
              </p>
            </div>
          </div>

          {/* Values Section - High Impact Horizontal Scrolling Feel */}
          <div className="mb-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div className="max-w-xl">
                <h2 className="text-4xl md:text-6xl font-black text-[#101828] tracking-tighter uppercase leading-[1.05]">
                  The values <br /><span className="text-[#745DF3]">driving the mission.</span>
                </h2>
              </div>
              <p className="text-lg text-gray-400 font-medium max-w-xs uppercase tracking-widest leading-relaxed">
                We're building for the next decade of sales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { 
                  label: "Precision", 
                  detail: "Focusing on quality over quantity in every campaign. We believe in high-intent outreach over mass-spam tactics.",
                  bg: "bg-white",
                  text: "text-[#101828]"
                },
                { 
                  label: "Trust", 
                  detail: "Protecting your sender reputation like it's our own. Deliverability isn't a feature; it's our foundation.",
                  bg: "bg-[#745DF3]",
                  text: "text-white"
                },
                { 
                  label: "Security", 
                  detail: "Building a safe environment for your company data. Enterprise-grade protection for every user.",
                  bg: "bg-[#101828]",
                  text: "text-white"
                },
                { 
                  label: "Community", 
                  detail: "Creating tools that bring people together. LeadFlow is built for teams that win together.",
                  bg: "bg-gray-50",
                  text: "text-[#101828]"
                }
              ].map((value, i) => (
                <motion.div 
                  key={value.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`${value.bg} ${value.text} p-12 md:p-16 rounded-[3.5rem] border border-gray-100 flex flex-col justify-between min-h-[400px] group hover:scale-[0.99] transition-all duration-500`}
                >
                  <div className="flex justify-end items-start">
                    <span className="text-6xl font-black opacity-10 tracking-tighter uppercase">0{i + 1}</span>
                  </div>
                  <div>
                    <h3 className={`text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter ${value.text}`}>
                      {value.label}
                    </h3>
                    <p className={`text-lg font-medium leading-relaxed max-w-sm opacity-70 ${value.text}`}>
                      {value.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-[#101828] rounded-[3rem] p-12 md:p-20 text-white flex flex-col md:flex-row justify-around items-center gap-12">
             <div className="text-center group">
                <span className="block text-4xl md:text-6xl font-black mb-2 tracking-tighter text-[#745DF3] group-hover:scale-110 transition-transform uppercase">2026</span>
                <span className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Built For The Future</span>
             </div>
             <div className="text-center group">
                <span className="block text-4xl md:text-6xl font-black mb-2 tracking-tighter text-[#745DF3] group-hover:scale-110 transition-transform uppercase">Beta</span>
                <span className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Platform Status</span>
             </div>
             <div className="text-center group">
                <span className="block text-4xl md:text-6xl font-black mb-2 tracking-tighter text-[#745DF3] group-hover:scale-110 transition-transform uppercase">100%</span>
                <span className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Founder Commitment</span>
             </div>
          </div>
        </div>
      </main>

      <CTASection />
      <Footer />
    </div>
  );
}
