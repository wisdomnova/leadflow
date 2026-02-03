'use client';

import React from 'react';
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function CookiesPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FBFBFB] font-jakarta">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-[#101828] mb-4 tracking-tighter uppercase">
              Cookies <span className="text-[#745DF3]">Policy</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
              Last Updated: {currentDate}
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-600 font-medium leading-relaxed">
            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase tracking-tight">1. What are Cookies?</h2>
              <p className="mb-4">
                Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and improve your experience.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase">2. Types of Cookies We Use</h2>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Essential:</strong> Required for the website to function (e.g., login sessions).</li>
                <li><strong>Functional:</strong> Remember your settings and preferences.</li>
                <li><strong>Analytics:</strong> Help us understand how visitors use the site.</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase">3. Third Party Cookies</h2>
              <p className="mb-4">
                We use services like Google Analytics and Hotjar which may set their own cookies on your browser.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-black text-[#101828] mb-6 uppercase">4. Managing Cookies</h2>
              <p className="mb-4">
                You can control and/or delete cookies as you wish through your browser settings. However, disabling cookies may affect the functionality of LeadFlow.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
