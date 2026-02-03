'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { Layout, Columns, Rows, Grid, MousePointer2, Plus, ArrowRight } from 'lucide-react';

const layoutTemplates = [
  { name: 'Classic Single Column', type: 'Email', icon: Rows, preview: <div className="bg-gray-100 h-24 rounded-xl" /> },
  { 
    name: 'Two-Column Product', 
    type: 'Newsletter', 
    icon: Columns, 
    preview: (
      <div className="bg-gray-100 h-24 rounded-xl flex gap-2 p-2">
        <div className="w-1/2 bg-gray-200 rounded-lg"></div>
        <div className="w-1/2 bg-gray-200 rounded-lg"></div>
      </div>
    ) 
  },
  { 
    name: 'Dashboard Style', 
    type: 'Transactional', 
    icon: Layout, 
    preview: (
      <div className="bg-gray-100 h-24 rounded-xl p-2">
        <div className="w-full h-4 bg-gray-200 rounded-md mb-2"></div>
        <div className="flex gap-2">
          <div className="w-1/4 h-12 bg-gray-200 rounded-md"></div>
          <div className="w-3/4 h-12 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    ) 
  },
];

export default function LayoutsPage() {
  return (
    <div className="flex h-screen bg-[#FBFBFB] font-jakarta overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black text-[#101828] tracking-tight">Email Layouts</h1>
                <p className="text-gray-500 font-medium mt-1">Design and manage reusable structural templates for your emails.</p>
              </div>
              <button className="flex items-center gap-3 px-8 py-4 bg-[#745DF3] text-white rounded-2xl text-sm font-black hover:scale-105 transition-all shadow-xl shadow-[#745DF3]/25">
                <Plus className="w-5 h-5" />
                Create New Layout
              </button>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {layoutTemplates.map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-[#745DF3]/5 transition-all cursor-pointer border-b-4 border-b-transparent hover:border-b-[#745DF3]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-4 bg-gray-50 rounded-2xl text-[#101828] group-hover:bg-[#745DF3] group-hover:text-white transition-all">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-[#745DF3] bg-[#745DF3]/5 px-3 py-1 rounded-full uppercase tracking-widest">{item.type}</span>
                  </div>
                  
                  <div className="mb-6 pointer-events-none">
                    {typeof item.preview === 'string' ? <div className={item.preview} /> : item.preview}
                  </div>

                  <h3 className="text-lg font-black text-[#101828] mb-2">{item.name}</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    Used in 24 campaigns <ArrowRight className="w-3 h-3" />
                  </p>
                </motion.div>
              ))}

              {/* Empty State / Custom */}
              <div className="bg-dashed border-2 border-dashed border-gray-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group hover:border-[#745DF3] transition-all cursor-pointer">
                <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4 group-hover:scale-110 transition-transform">
                  <Grid className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-[#101828] mb-1">Custom Builder</h3>
                <p className="text-gray-400 text-sm font-medium">Build your own structure from scratch.</p>
              </div>
            </div>

            {/* Visual Editor Preview */}
            <div className="bg-[#101828] rounded-[3rem] p-12 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-[#745DF3]/10 blur-[120px] rounded-full" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-[#745DF3] text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">
                    <MousePointer2 className="w-3 h-3" />
                    Next-Gen Editor
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tight mb-6">Drag, Drop, Scale. <br/>The LeadFlow way.</h2>
                  <p className="text-gray-400 font-medium mb-10 max-w-md">Our visual builder allows you to create high-converting email layouts without writing a single line of MJML or HTML.</p>
                  <button className="px-8 py-4 bg-white text-[#101828] rounded-2xl text-sm font-black hover:bg-gray-100 transition-all">
                    Open Visual Editor
                  </button>
                </div>
                <div className="bg-white/5 rounded-[2rem] border border-white/10 p-4 aspect-video flex items-center justify-center">
                   <div className="w-full h-full border border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/20 font-black ">
                    [ Interactive Canvas Preview ]
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
