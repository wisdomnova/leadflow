'use client';

import React from 'react';
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FBFBFB] font-jakarta">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-[#101828] mb-4 tracking-tighter uppercase">
              Privacy <span className="text-[#745DF3]">Policy</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
              Last Updated: {currentDate}
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-600 font-medium leading-relaxed">
            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase tracking-tight">1. Information We Collect</h2>
              <p className="mb-4">
                We collect information you provide directly to us when you create an account, such as your name, email address, and billing information.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase">2. How We Use Your Data</h2>
              <p className="mb-4">
                We use your information to provide, maintain, and improve our services, process payments, and communicate with you about your account.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase">3. Data Sharing</h2>
              <p className="mb-4">
                We do not sell your personal data. We only share data with trusted third-party service providers (like Stripe for payments) necessary to operate the platform.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase">4. Security</h2>
              <p className="mb-4">
                We implement industry-standard security measures to protect your data, including encryption at rest and in transit.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase">5. Your Rights</h2>
              <p className="mb-4">
                You have the right to access, correct, or delete your personal information at any time through your account settings.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
