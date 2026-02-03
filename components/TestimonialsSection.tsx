'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, User } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      author: "Alex Morgan",
      role: "Head of Growth",
      quote: "Before LeadFlow, outbound felt fragmented. We had one tool for sending, another one for replies, and the CRM lived in its own world. LeadFlow changed that by connecting everything into a single workflow. We can launch campaigns and sync everything without effort.",
    },
    {
      author: "Sarah Klein",
      role: "Revenue Operations Manager",
      quote: "What stood out immediately was the CRM integration. Interested replies are automatically turned into deals, stages are updated correctly, and our sales team never has to ask where a lead came from. This removed a lot of friction from our process.",
    },
    {
      author: "Michael Chen",
      role: "Founder & CEO",
      quote: "Most outbound tools focus heavily on sending volume, but very few help you understand what happens after someone replies. Leadflow goes further. The unified inbox, reply classification, and AI insights help us decide quality at scale.",
    },
    {
      author: "Emily Carter",
      role: "Sales Lead",
      quote: "The unified inbox completely changed our daily workflow. Instead of digging through replies, we immediately see who is interested, who needs a follow-up, and who is not a fit. This makes prioritization effortless and keeps us closing.",
    },
    {
      author: "Markus Weber",
      role: "Director of Sales",
      quote: "We send at high volume across multiple domains and providers, so deliverability is critical for us. Leadflow’s multi-provider setup and warmup infrastructure gave us confidence to scale without risking sender reputation. The results were instant.",
    },
    {
      author: "Jason Liu",
      role: "CEO",
      quote: "Leadflow doesn’t feel like a collection of features. Campaigns, templates, AI insights, inbox, and CRM handoff are clearly designed as parts of one platform. That consistency is rare in outbound tools and makes onboarding simple.",
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-[#FBFBFB] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-3xl">
            <h2 className="text-[2.5rem] md:text-[5.5rem] font-black text-[#101828] leading-[1.05] tracking-tighter uppercase mb-4">
              Validated by <br />
              <span className="text-[#745DF3]">High-Growth Teams.</span>
            </h2>
          </div>
          <p className="text-sm font-black text-[#101828]/40 uppercase tracking-[0.2em] mb-4">
            Scroll to explore →
          </p>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
        <div className="flex overflow-x-auto pb-12 px-6 gap-6 no-scrollbar snap-x snap-mandatory lg:px-[calc((100vw-1200px)/2)]">
          {testimonials.map((item, idx) => (
            <motion.div 
              key={idx}
              className="flex-shrink-0 w-[85vw] md:w-[450px] bg-white border border-gray-100 p-10 md:p-12 rounded-[3rem] shadow-sm flex flex-col justify-between snap-center"
            >
              <div>
                <div className="flex gap-1 mb-10">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#745DF3] text-[#745DF3]" />
                  ))}
                </div>

                <p className="text-[#101828] text-xl md:text-2xl leading-[1.6] font-bold tracking-tight mb-12">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center gap-5 pt-10 border-t border-gray-50">
                <div className="w-14 h-14 rounded-2xl bg-[#745DF3]/5 flex items-center justify-center text-[#745DF3]">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-[#101828] text-xl uppercase tracking-tighter leading-none mb-1">
                    {item.author}
                  </h4>
                  <p className="text-[#101828]/40 text-xs font-black uppercase tracking-widest">
                    {item.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;
