'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQItem = ({ question, answer, isOpen, onClick }: { question: string, answer: string, isOpen: boolean, onClick: () => void }) => {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-8 flex justify-between items-center text-left hover:opacity-70 transition-opacity"
      >
        <h3 className="text-xl md:text-2xl font-semibold text-[#101828]">
          {question}
        </h3>
        {isOpen ? (
          <ChevronUp className="w-6 h-6 text-[#101828]" />
        ) : (
          <ChevronDown className="w-6 h-6 text-[#101828]" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-8">
              <p className="text-gray-500 text-lg leading-relaxed max-w-4xl">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does LeadFlow help teams scale outbound?",
      answer: "LeadFlow is an AI-powered cold email automation platform designed to help teams scale outbound outreach. It handles personalization, follow-ups, and inbox management so you can generate more replies and close more deals with less manual effort."
    },
    {
      question: "How does LeadFlow improve reply rates?",
      answer: "LeadFlow uses AI to analyze your leads and customize outreach at scale. By sending highly personalized messages and optimizing for the best sending times, our users typically see a significant lift in both open and reply rates compared to generic sequences."
    },
    {
      question: "Does LeadFlow support multiple email providers?",
      answer: "Yes, LeadFlow is built for scale. You can connect Gmail, Outlook, and custom SMTP/IMAP providers. Our unified inbox allows you to manage all these conversations in one single place regardless of the provider."
    },
    {
      question: "Is LeadFlow safe for cold email sending?",
      answer: "Safety and deliverability are our top priorities. LeadFlow includes built-in warm-up tools, smart sending limits, and reputation monitoring to ensure your emails land in the primary inbox and your domains stay protected."
    },
    {
      question: "Do I need technical skills to use LeadFlow?",
      answer: "Not at all. LeadFlow is designed with a user-friendly interface that anyone on your sales or growth team can use. We handle the complex backend automations so you can focus on building relationships with leads."
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-24 gap-8">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-white shadow-sm text-xs font-bold text-[#745DF3] uppercase tracking-widest">
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Support</span>
          </div>
          <h2 className="text-[2.5rem] md:text-[4.5rem] font-black text-[#101828] leading-[1.05] tracking-tighter">
            Commonly asked <br />
            <span className="text-[#745DF3]">questions.</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-gray-100 last:border-0">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full py-10 flex justify-between items-center text-left group"
              >
                <h3 className={`text-xl md:text-2xl font-black tracking-tight transition-colors ${openIndex === idx ? 'text-[#745DF3]' : 'text-[#101828] group-hover:text-[#745DF3]'}`}>
                  {faq.question}
                </h3>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${openIndex === idx ? 'bg-[#745DF3] text-white rotate-180' : 'bg-gray-50 text-[#101828]'}`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-10">
                      <p className="text-[#101828]/50 text-lg md:text-xl font-medium leading-relaxed max-w-3xl">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
