'use client';

import React from 'react';
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Lock, Eye, Server } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] font-jakarta">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-black text-[#101828] mb-4 tracking-tighter uppercase text-center">
              Security <span className="text-[#745DF3]">at LeadFlow</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg text-center max-w-xl mx-auto leading-relaxed">
              Your data is your most valuable asset. We treat it with the highest level of security and compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
             {[
               { icon: Lock, title: "Data Encryption", desc: "All data is encrypted using AES-256 at rest and TLS 1.3 in transit." },
               { icon: ShieldCheck, title: "SOC2 Compliance", desc: "We adhere to strict SOC2 Type II standards for data security and privacy." },
               { icon: Eye, title: "Regular Audits", desc: "We perform weekly vulnerability scans and quarterly penetration tests." },
               { icon: Server, title: "Secure Hosting", desc: "Our infrastructure runs on AWS with multi-region redundancy and DDoS protection." }
             ].map((item, idx) => (
               <div key={idx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#745DF3]/5 transition-all">
                 <div className="w-12 h-12 bg-[#745DF3]/5 rounded-xl flex items-center justify-center text-[#745DF3] mb-6">
                   <item.icon className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-black text-[#101828] mb-3 uppercase tracking-tight">{item.title}</h3>
                 <p className="text-gray-500 font-medium text-sm leading-relaxed">{item.desc}</p>
               </div>
             ))}
          </div>

          <div className="bg-[#101828] text-white p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
            <h2 className="text-3xl font-black mb-6 uppercase tracking-tighter relative z-10 text-white">Vulnerability Reporting</h2>
            <p className="text-white/60 font-medium mb-8 leading-relaxed relative z-10">
              Found a security issue? We operate a responsible disclosure policy. Please report any vulnerabilities to <span className="text-[#745DF3] font-bold">security@leadflow.xyz</span>. We aim to respond to all reports within 24 hours.
            </p>
            <div className="flex items-center gap-4 relative z-10">
               <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
               <span className="text-sm font-black uppercase tracking-widest text-white/40">Status: All Systems Secure</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
