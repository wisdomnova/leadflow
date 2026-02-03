'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Plus, 
  Mail, 
  Zap,
  TrendingUp,
  ChevronRight,
  Loader2
} from 'lucide-react';

const libraryTemplates = [
  {
    id: 'lib-1',
    name: 'Problem-Centric Founder Outreach',
    subject: 'Question regarding {{company_name}}\'s growth strategy',
    body: "Hi {{first_name}},\n\nI've been following {{company_name}} and noticed you're expanding your engineering team. Usually, when founders are hiring this fast, lead generation starts to become a bottleneck for the sales team.\n\nWe recently helped a similar company scale their outbound without increasing their head count.\n\nWould you be open to a 5-minute chat about how we could automate some of that for you?\n\nBest,\n{{my_name}}",
    category: 'Cold Outreach',
    open_rate: 72,
    reply_rate: 14
  },
  {
    id: 'lib-2',
    name: 'Post-Connection Follow-up (LinkedIn)',
    subject: 'Great connecting on LinkedIn',
    body: "Hi {{first_name}},\n\nGreat connecting with you on LinkedIn earlier. I really enjoyed your thoughts on {{topic}}.\n\nI noticed you mentioned working on {{project}}. We actually have some data on how other teams in your space are approaching that.\n\nHappy to share it if you're interested?\n\nCheers,\n{{my_name}}",
    category: 'Follow-up',
    open_rate: 58,
    reply_rate: 19
  },
  {
    id: 'lib-3',
    name: 'The "No-Pressure" Demo Invite',
    subject: 'Thought you might find this interesting {{first_name}}',
    body: "Hi {{first_name}},\n\nI promise this isn't a high-pressure sales pitch.\n\nI saw that {{company_name}} is working on {{initiative}}. We built a tool that handles the manual overhead of {{process}} which seems like it might be relevant to what you're doing.\n\nWould you like a 2-minute video walkthrough of how it works? No strings attached.\n\nBest,\n{{my_name}}",
    category: 'Cold Outreach',
    open_rate: 64,
    reply_rate: 9
  },
  {
    id: 'lib-4',
    name: 'Classic Break-up Email',
    subject: 'Should I stay or should I go?',
    body: "Hi {{first_name}},\n\nI've reached out a few times and haven't heard back, so I'm assuming that {{problem}} isn't a priority for you right now.\n\nI'll go ahead and close your file for now. If things change in the future and you're looking to revisit this, feel free to reach out.\n\nAll the best,\n{{my_name}}",
    category: 'Follow-up',
    open_rate: 42,
    reply_rate: 26
  },
  {
    id: 'lib-5',
    name: 'Executive Value Proposition',
    subject: 'Reducing overhead at {{company_name}}',
    body: "Hi {{first_name}},\n\nWriting to you because you're leading the {{department}} team at {{company_name}}.\n\nWe helped the team at {{competitor}} reduce their manual data entry by 40% while increasing their output by 2x.\n\nIf you're looking for ways to optimize your team's workflow this quarter, I'd love to share our framework.\n\nBest,\n{{my_name}}",
    category: 'Cold Outreach',
    open_rate: 51,
    reply_rate: 11
  },
  {
    id: 'lib-6',
    name: 'Content-Led Outreach',
    subject: 'Recent report on {{industry}} trends',
    body: "Hi {{first_name}},\n\nMy team just finished a research report on the state of {{industry}} in 2024. Given your role at {{company_name}}, I thought you'd find our findings on {{specific_stat}} particularly useful.\n\nI've attached a summary below.\n\nIf you have any questions or want to dive deeper into the data, I'm happy to hop on a quick call.\n\nBest,\n{{my_name}}",
    category: 'Cold Outreach',
    open_rate: 76,
    reply_rate: 7
  },
  {
    id: 'lib-7',
    name: 'Founder-to-Founder Connection',
    subject: 'Fellow founder reaching out',
    body: "Hi {{first_name}},\n\nI'm the founder of LeadFlow, and I've been watching {{company_name}} grow for a while now. \n\nI noticed you just hit {{milestone}}. Usually, at this stage, the biggest challenge is maintaining quality in your {{process}} while scaling.\n\nWe've navigated this ourselves and helped a few other founders in our network do the same.\n\nWould love to swap war stories if you're open to it?\n\nBest,\n{{my_name}}",
    category: 'Cold Outreach',
    open_rate: 81,
    reply_rate: 15
  },
  {
    id: 'lib-8',
    name: 'Competitive Alternative',
    subject: 'Better way to handle {{process}} at {{company_name}}?',
    body: "Hi {{first_name}},\n\nI noticed {{company_name}} is currently using {{competitor}} for your {{process}}. \n\nMost teams we talk to find that while {{competitor}} is great for basics, it falls short when you need to {{specific_deficiency}}.\n\nWe built LeadFlow specifically to solve that. We're consistently seeing 3x better {{metric}} for teams moving over.\n\nWorth a quick look?\n\nBest,\n{{my_name}}",
    category: 'Sales',
    open_rate: 49,
    reply_rate: 12
  },
  {
    id: 'lib-9',
    name: 'Case Study Outreach',
    subject: 'How {{similar_company}} optimized their {{department}}',
    body: "Hi {{first_name}},\n\nI just published a case study on how {{similar_company}} managed to {{result}} in under 3 months.\n\nGiven your focus on {{initiative}} at {{company_name}}, I thought this might spark some ideas for your team.\n\nI can send over the PDF if you'd like to take a look?\n\nBest,\n{{my_name}}",
    category: 'Marketing',
    open_rate: 68,
    reply_rate: 10
  },
  {
    id: 'lib-10',
    name: 'Unconventional 5-Min Ask',
    subject: 'Quick 5-minute question?',
    body: "Hi {{first_name}},\n\nI'll be brief. I have one specific question about how {{company_name}} handles {{process}}.\n\nBased on what I've seen, you might be missing out on {{opportunity}} because of how {{current_method}} works.\n\nDo you have 5 minutes this Thursday for me to show you what I mean? I promise I won't ask for a second longer unless you want to keep talking.\n\nBest,\n{{my_name}}",
    category: 'Cold Outreach',
    open_rate: 74,
    reply_rate: 16
  }
];

interface InternalLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (template: any) => void;
}

export default function InternalLibraryModal({ isOpen, onClose, onAdd }: InternalLibraryModalProps) {
  const [search, setSearch] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(libraryTemplates[0]);

  const filtered = libraryTemplates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (template: any) => {
    setAddingId(template.id);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          subject: template.subject,
          body: template.body,
          category: template.category
        })
      });

      if (res.ok) {
        const newTemplate = await res.json();
        onAdd(newTemplate);
      }
    } catch (err) {
      console.error("Failed to add template from library:", err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative w-full max-w-[1400px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[85vh]"
          >
            {/* Header */}
            <div className="px-10 py-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-[#101828]">Internal Template Library</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Verified High-Performing Sequences</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group/search">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/search:text-[#745DF3] transition-colors" />
                  <input 
                      type="text"
                      placeholder="Search by name or subject..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-12 pr-6 py-3 bg-gray-50 border border-transparent focus:border-[#745DF3] focus:bg-white rounded-xl text-sm font-bold underline-offset-4 outline-none transition-all w-80 shadow-inner"
                  />
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 text-gray-400 hover:text-[#101828] bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split Content Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Scrollable Templates Grid */}
                <div className="flex-1 overflow-y-auto p-10 no-scrollbar bg-[#FBFBFB]/50">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {filtered.map((template) => (
                            <button 
                                key={template.id}
                                onClick={() => setPreviewTemplate(template)}
                                className={`text-left bg-white border rounded-[1.5rem] p-6 transition-all group flex flex-col ${
                                  previewTemplate?.id === template.id 
                                    ? 'border-[#745DF3] shadow-lg shadow-[#745DF3]/5 ring-1 ring-[#745DF3]' 
                                    : 'border-gray-100 hover:border-[#745DF3]/40 hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4 w-full">
                                    <span className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:bg-[#745DF3]/5 group-hover:text-[#745DF3] transition-colors">
                                        {template.category}
                                    </span>
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1.5">
                                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                                          <span className="text-[10px] font-black text-[#101828] uppercase">{template.open_rate}%</span>
                                      </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="text-lg font-black text-[#101828] mb-1 group-hover:text-[#745DF3] transition-colors">{template.name}</h4>
                                    <p className="text-xs font-bold text-gray-400 line-clamp-1 ">{template.subject}</p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 w-full">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Click to view preview
                                    </span>
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-[#745DF3]/10 group-hover:text-[#745DF3] transition-all">
                                      <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Constant Preview Table */}
                <div className="w-[500px] border-l border-gray-100 bg-white p-10 flex flex-col">
                    {previewTemplate ? (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={previewTemplate.id}
                        className="h-full flex flex-col"
                      >
                        <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
                          <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Template Breakdown</h4>
                            <h2 className="text-2xl font-black text-[#101828] leading-tight mb-2">{previewTemplate.name}</h2>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">
                                <TrendingUp className="w-3 h-3" />
                                {previewTemplate.open_rate}% Avg. Open
                              </div>
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#745DF3]/5 text-[#745DF3] rounded-lg text-[10px] font-black uppercase">
                                <Zap className="w-3 h-3" />
                                {previewTemplate.reply_rate}% Avg. Reply
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Subject Line</label>
                              <p className="text-sm font-bold text-[#101828]">{previewTemplate.subject}</p>
                            </div>
                            
                            <div className="p-6 border border-gray-100 rounded-2xl bg-white relative">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Email Body</label>
                              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                                {previewTemplate.body}
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#101828] p-6 rounded-2xl text-white">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#745DF3] mb-2">Why this works</h5>
                            <p className="text-xs text-gray-400 leading-relaxed font-medium">
                              This template focuses on {previewTemplate.category.toLowerCase()} and psychological triggers like social proof and specific industry relevance. It maintains a low-friction call to action to maximize response rates.
                            </p>
                          </div>
                        </div>

                        <div className="pt-8 mt-auto border-t border-gray-50">
                           <button 
                              disabled={addingId === previewTemplate.id}
                              onClick={() => handleAdd(previewTemplate)}
                              className="w-full py-5 bg-[#101828] text-white rounded-[1.5rem] font-black text-sm hover:bg-[#745DF3] transition-all shadow-xl shadow-[#101828]/10 flex items-center justify-center gap-3 active:scale-[0.98] outline-none"
                           >
                              {addingId === previewTemplate.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Plus className="w-5 h-5" />
                              )}
                              {addingId === previewTemplate.id ? 'Importing...' : 'Add to My Templates'}
                           </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center px-10">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Mail className="w-8 h-8 text-gray-200" />
                        </div>
                        <h3 className="text-lg font-black text-[#101828]">Select a Template</h3>
                        <p className="text-sm text-gray-400 font-medium mt-2">
                            Choose a template from the library to see a full preview and performance metrics.
                        </p>
                      </div>
                    )}
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
