'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Lock, Globe } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#FBFBFB] pt-24 pb-12 px-6 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 pointer-events-none select-none">
        <h1 className="text-[25vw] font-black text-[#745DF3] opacity-[0.03] whitespace-nowrap tracking-tighter">
          LeadFlow
        </h1>
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-16 mb-24">
          {/* Logo and Tagline */}
          <div className="lg:col-span-5">
            <div className="mb-8">
              <Image 
                src="/leadflow-black.png" 
                alt="LeadFlow" 
                width={140} 
                height={35} 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-[#101828]/50 text-xl mb-10 font-medium max-w-sm leading-relaxed">
              Scale high-touch outreach with AI. The all-in-one platform for modern sales teams.
            </p>
            <div className="flex gap-4">
              {['X', 'LinkedIn', 'Instagram'].map((social) => (
                <div key={social} className="px-5 py-2 border border-gray-100 rounded-xl flex items-center justify-center text-[#101828]/40 text-sm font-bold hover:bg-white hover:text-[#745DF3] hover:border-[#745DF3]/20 cursor-pointer transition-all bg-white shadow-sm">
                  {social}
                </div>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="lg:col-span-3">
            <h4 className="font-black text-[#101828] text-lg mb-8 tracking-tight">Legal</h4>
            <ul className="space-y-5">
              <li><Link href="/terms" className="text-[#101828]/40 hover:text-[#745DF3] font-bold text-sm transition-colors uppercase tracking-widest">Terms</Link></li>
              <li><Link href="/privacy" className="text-[#101828]/40 hover:text-[#745DF3] font-bold text-sm transition-colors uppercase tracking-widest">Privacy</Link></li>
              <li><Link href="/cookies" className="text-[#101828]/40 hover:text-[#745DF3] font-bold text-sm transition-colors uppercase tracking-widest">Cookies</Link></li>
              <li><Link href="/security" className="text-[#101828]/40 hover:text-[#745DF3] font-bold text-sm transition-colors uppercase tracking-widest">Security</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h4 className="font-black text-[#101828] text-lg mb-8 tracking-tight">Support</h4>
            <div className="space-y-6">
              <p className="text-[#101828]/40 font-bold text-lg">
                contact@tryleadflow.ai
              </p>
              <div className="flex flex-wrap gap-4">
                {/* Security Badges */}
                <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#101828]/60">GDPR Compliant</span>
                </div>
                <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-2">
                   <Lock className="w-3 h-3 text-[#745DF3]" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#101828]/60">SSL Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[#101828]/30 text-sm font-bold uppercase tracking-[0.2em]">
            ©2026 LeadFlow. All Rights Reserved.
          </p>
          <div className="flex items-center gap-2 text-[#101828]/20 font-medium ">
             <span>Crafted for high-performing teams</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
