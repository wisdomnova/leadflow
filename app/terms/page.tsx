'use client';

import React from 'react';
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function TermsPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FBFBFB] font-jakarta">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-[#101828] mb-4 tracking-tighter uppercase">
              Terms of <span className="text-[#745DF3]">Service</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
              Last Updated: {currentDate}
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-600 font-medium leading-relaxed">
            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase tracking-tight">1. Agreement to Terms</h2>
              <p className="mb-4">
                By accessing or using LeadFlow, you agree to be bound by these Terms of Service. If you do not agree, you may not use our platform.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase">2. Use of Service</h2>
              <p className="mb-4">
                You are responsible for maintaining the security of your account and for all activities that occur under your account. You must not use the service for any illegal or unauthorized purpose, including spamming or violating anti-spam laws.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase">3. Subscription & Billing</h2>
              <p className="mb-4">
                LeadFlow is a subscription-based service. You agree to pay all fees associated with your plan. All payments are non-refundable unless required by law.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase">4. Data Ownership</h2>
              <p className="mb-4">
                You retain all rights to the data you upload or create within LeadFlow. We do not claim ownership of your content.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase">5. Limitation of Liability</h2>
              <p className="mb-4">
                LeadFlow shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
