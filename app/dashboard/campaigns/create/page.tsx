'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Mail, 
  Settings, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Save,
  List,
  Type,
  Layout,
  UserPlus,
  Loader2,
  AlertCircle,
  LogOut,
  Sparkles,
  X
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const steps = [
  { id: 1, name: 'Setup', icon: Settings },
  { id: 2, name: 'Leads', icon: UserPlus },
  { id: 3, name: 'Template', icon: Layout },
  { id: 4, name: 'Sequence', icon: List },
  { id: 5, name: 'Review', icon: Check },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showDraftNotification, setShowDraftNotification] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [emailSteps, setEmailSteps] = useState([
    { id: 1, type: 'Initial Email', wait: 0, subject: '', body: '' }
  ]);
  
  // Leads States
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  
  // Real Data States
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isSmartSending, setIsSmartSending] = useState(true);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // AI States
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isOptimizingAI, setIsOptimizingAI] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [aiAudience, setAiAudience] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, tempRes, leadRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/templates'),
          fetch('/api/leads')
        ]);
        
        const accData = await accRes.json();
        const tempData = await tempRes.json();
        const leadData = await leadRes.json();
        
        const validatedAccounts = Array.isArray(accData) ? accData : [];
        setAccounts(validatedAccounts);
        
        if (validatedAccounts.length > 0) {
          setSelectedAccountId(validatedAccounts[0].id);
        }
        setSavedTemplates(Array.isArray(tempData) ? tempData : []);
        setAvailableLeads(Array.isArray(leadData) ? leadData : []);
      } catch (err) {
        console.error("Error loading campaign data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoadingData && accounts.length === 0) {
      router.push('/dashboard/campaigns');
    }
  }, [isLoadingData, accounts, router]);

  const handleGenerateAI = async () => {
    if (!aiGoal || !aiAudience) return alert("Please specify your goal and audience");
    
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/campaigns/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: aiGoal, audience: aiAudience })
      });
      
      const data = await res.json();
      if (data.subject && data.body) {
        updateStepContent(activeStepIndex, 'subject', data.subject);
        updateStepContent(activeStepIndex, 'body', data.body);
        setShowAiModal(false);
      }
    } catch (err) {
      console.error("AI Generation error:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAIOptimize = async () => {
    const currentStepData = emailSteps[activeStepIndex];
    if (!currentStepData.body) return alert("Write something first to optimize");
    
    setIsOptimizingAI(true);
    try {
      const res = await fetch('/api/campaigns/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            goal: "Optimize this existing cold email for higher response rates", 
            audience: "The current contact",
            existingContent: currentStepData.body,
            tone: "Professional but engaging"
        })
      });
      
      const data = await res.json();
      if (data.subject || data.body) {
        if (data.subject) updateStepContent(activeStepIndex, 'subject', data.subject);
        if (data.body) updateStepContent(activeStepIndex, 'body', data.body);
      }
    } catch (err) {
      console.error("AI Optimization error:", err);
    } finally {
      setIsOptimizingAI(false);
    }
  };

  const addStep = () => {
    const newId = Date.now();
    setEmailSteps([...emailSteps, { 
      id: newId, 
      type: `Follow-up #${emailSteps.length}`, 
      wait: 2, 
      subject: '', 
      body: '' 
    }]);
    setActiveStepIndex(emailSteps.length);
  };

  const removeStep = (id: number) => {
    if (emailSteps.length > 1) {
      const index = emailSteps.findIndex(s => s.id === id);
      const newSteps = emailSteps.filter(step => step.id !== id);
      setEmailSteps(newSteps);
      if (activeStepIndex >= newSteps.length) {
        setActiveStepIndex(newSteps.length - 1);
      }
    }
  };

  const updateStepContent = (index: number, field: string, value: any) => {
    const newSteps = [...emailSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEmailSteps(newSteps);
  };

  const nextStep = () => {
    if (currentStep === steps.length) {
      handleLaunch();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };
  
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleLaunch = async () => {
    if (!campaignName) return alert("Please enter a campaign name");
    if (!selectedAccountId) return alert("Please select a sender profile");
    if (selectedLeadIds.length === 0) return alert("Please select at least one lead");
    if (emailSteps.length === 0 || !emailSteps[0].subject || !emailSteps[0].body) {
      return alert("Please complete at least the first email in your sequence");
    }
    
    setIsLaunching(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          sender_id: selectedAccountId,
          lead_ids: selectedLeadIds,
          steps: emailSteps,
          status: 'running',
          config: {
            smart_sending: isSmartSending
          }
        })
      });

      if (res.ok) {
        router.push('/dashboard/campaigns');
      } else {
        const err = await res.json();
        alert(err.error || "Failed to launch campaign");
      }
    } catch (err) {
      console.error("Launch error:", err);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!campaignName) return alert("Please enter a campaign name");

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          sender_id: selectedAccountId || null,
          lead_ids: selectedLeadIds,
          steps: emailSteps,
          status: 'draft',
          config: {
            smart_sending: isSmartSending
          }
        })
      });

      if (res.ok) {
        setShowDraftNotification(true);
        setTimeout(() => setShowDraftNotification(false), 3000);
      }
    } catch (err) {
      console.error("Save draft error:", err);
    }
  };

  const isLaunchDisabled = currentStep === 5 && (
    !campaignName || 
    !selectedAccountId || 
    selectedLeadIds.length === 0 ||
    emailSteps.length === 0 || 
    !emailSteps[0].subject || 
    !emailSteps[0].body
  );

  return (
    <div className="flex h-screen bg-[#FBFBFB] font-jakarta overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Account Warning Banner */}
          {!isLoadingData && accounts.length === 0 && (
            <div className="bg-amber-50 border-b border-amber-100 px-8 py-3">
              <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-amber-900">
                    You haven't connected any sender profiles yet. You need at least one to launch a campaign.
                  </p>
                </div>
                <Link 
                  href="/dashboard/providers"
                  className="px-4 py-2 bg-[#101828] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                >
                  Connect Profile
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Create Header */}
          <div className="bg-white border-b border-gray-100 px-8 py-6 sticky top-0 z-20">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link 
                  href="/dashboard/campaigns"
                  className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#101828] hover:bg-gray-100 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-8">
                  <div>
                    <h1 className="text-xl font-black text-[#101828] tracking-tight">Create New Campaign</h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-0.5">Step {currentStep} of {steps.length}: {steps[currentStep-1].name}</p>
                  </div>
                  
                  {/* Step Navigation Icons */}
                  <div className="hidden md:flex items-center gap-2">
                    {steps.map((step) => {
                      const Icon = step.icon;
                      const isActive = currentStep === step.id;
                      const isCompleted = currentStep > step.id;
                      return (
                        <button
                          key={step.id}
                          onClick={() => setCurrentStep(step.id)}
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                            ${isActive ? 'bg-[#745DF3]/10 text-[#745DF3]' : 'text-gray-400 hover:bg-gray-50'}
                          `}
                        >
                          <div className={`
                            w-6 h-6 rounded-lg flex items-center justify-center
                            ${isActive ? 'bg-[#745DF3] text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-100'}
                          `}>
                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{step.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSaveDraft}
                  className="px-6 py-2.5 text-sm font-black text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
                >
                  Save as Draft
                </button>
                <button 
                  onClick={nextStep}
                  disabled={isLaunching || (currentStep === steps.length && isLaunchDisabled)}
                  className={`px-8 py-2.5 bg-[#745DF3] text-white rounded-xl text-sm font-black shadow-xl shadow-[#745DF3]/20 hover:scale-105 transition-all flex items-center gap-2 ${isLaunching || (currentStep === steps.length && isLaunchDisabled) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      {currentStep === steps.length ? 'Launch Campaign' : 'Continue'}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showDraftNotification && (
              <motion.div 
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className="fixed top-24 left-1/2 z-50 bg-[#101828] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-bold tracking-tight">Campaign saved to drafts.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-[1400px] mx-auto p-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-xl mx-auto"
                >
                  <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm">
                    <h2 className="text-2xl font-black text-[#101828] mb-8">Campaign Details</h2>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Campaign Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. SaaS Founders - Summer Outreach"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Sender Profile</label>
                        <select 
                          value={selectedAccountId}
                          onChange={(e) => setSelectedAccountId(e.target.value)}
                          className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none appearance-none"
                        >
                          {!Array.isArray(accounts) || accounts.length === 0 ? (
                            <option value="">No sender profiles found</option>
                          ) : (
                            accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.email} ({acc.provider})
                              </option>
                            ))
                          )}
                        </select>
                        {!Array.isArray(accounts) || accounts.length === 0 ? (
                          <div className="mt-2 pl-2">
                             <Link href="/dashboard/providers" className="text-[#745DF3] text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                                <Plus className="w-3 h-3" />
                                Connect your first profile
                             </Link>
                          </div>
                        ) : null}
                      </div>
                      <div className="pt-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div 
                            onClick={() => setIsSmartSending(!isSmartSending)}
                            className={`w-12 h-6 rounded-full relative transition-all ${isSmartSending ? 'bg-[#745DF3]' : 'bg-gray-200'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isSmartSending ? 'right-1' : 'left-1'}`} />
                          </div>
                          <span className="text-sm font-bold text-[#101828]">Enable Smart Sending (AI-Optimization)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-black text-[#101828]">Select Contacts</h2>
                        <p className="text-gray-500 text-sm font-medium">Choose who will receive this campaign.</p>
                      </div>
                      <div className="px-4 py-2 bg-[#745DF3]/10 text-[#745DF3] rounded-xl text-xs font-black">
                        {selectedLeadIds.length} Selected
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
                      {availableLeads.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">No contacts found</h3>
                          <Link href="/dashboard/contacts" className="text-[#745DF3] text-xs font-black mt-2 hover:underline inline-block">Import your first contacts →</Link>
                        </div>
                      ) : (
                        availableLeads.map((lead) => (
                          <div 
                            key={lead.id}
                            onClick={() => {
                              setSelectedLeadIds(prev => 
                                prev.includes(lead.id) 
                                  ? prev.filter(id => id !== lead.id) 
                                  : [...prev, lead.id]
                              );
                            }}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              selectedLeadIds.includes(lead.id) 
                                ? 'border-[#745DF3] bg-[#745DF3]/5 shadow-sm' 
                                : 'border-gray-50 hover:border-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                                selectedLeadIds.includes(lead.id) ? 'bg-[#745DF3] text-white' : 'bg-gray-100 text-[#101828]'
                              }`}>
                                {lead.first_name?.[0] || lead.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-black text-[#101828]">{lead.first_name} {lead.last_name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lead.email}</p>
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              selectedLeadIds.includes(lead.id) ? 'bg-[#745DF3] border-[#745DF3] text-white' : 'border-gray-200'
                            }`}>
                              {selectedLeadIds.includes(lead.id) && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="mt-8 flex items-center justify-between pt-8 border-t border-gray-50">
                      <button 
                         onClick={() => setSelectedLeadIds(availableLeads.map(l => l.id))}
                         className="text-xs font-black text-gray-400 hover:text-[#745DF3] transition-all"
                      >
                         Select All Leads ({availableLeads.length})
                      </button>
                      <button 
                         onClick={() => setSelectedLeadIds([])}
                         className="text-xs font-black text-gray-400 hover:text-red-500 transition-all"
                      >
                         Clear Selection
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-[#101828] mb-2">Choose a Start</h2>
                    <p className="text-gray-500 font-medium">Select a optimized template or start with a blank sequence.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                    <div 
                      onClick={() => {
                        setSelectedTemplate('blank');
                        setEmailSteps([{ id: Date.now(), type: 'Initial Email', wait: 0, subject: '', body: '' }]);
                        setCurrentStep(4);
                      }}
                      className={`rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group cursor-pointer transition-all border-2 h-[220px] ${
                        selectedTemplate === 'blank' ? 'bg-[#101828] text-white border-[#745DF3] scale-105' : 'bg-white text-[#101828] border-gray-100'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-colors ${selectedTemplate === 'blank' ? 'bg-[#745DF3]' : 'bg-gray-100 group-hover:bg-[#745DF3]'}`}>
                        <Plus className={`w-8 h-8 ${selectedTemplate === 'blank' ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                      </div>
                      <h3 className="text-lg font-black mb-1">Blank Sequence</h3>
                      <p className={`text-xs font-medium ${selectedTemplate === 'blank' ? 'text-white/70' : 'text-gray-400'}`}>Start completely from scratch</p>
                    </div>

                    {savedTemplates.map((temp) => (
                      <div 
                        key={temp.id} 
                        onClick={() => {
                          setSelectedTemplate(temp.id);
                          // Populate steps from template
                          if (temp.steps && Array.isArray(temp.steps)) {
                             setEmailSteps(temp.steps.map((s: any, idx: number) => ({
                               ...s,
                               id: Date.now() + idx
                             })));
                          } else {
                             setEmailSteps([{ 
                                id: Date.now(), 
                                type: 'Initial Email', 
                                wait: 0, 
                                subject: temp.subject || '', 
                                body: temp.body || '' 
                             }]);
                          }
                          setCurrentStep(4);
                        }}
                        className={`bg-white rounded-[2.5rem] border-2 p-8 flex flex-col items-center justify-center text-center group cursor-pointer transition-all h-[220px] ${
                          selectedTemplate === temp.id ? 'border-[#745DF3] shadow-xl scale-105' : 'border-gray-100 hover:border-[#745DF3]/20'
                        }`}
                      >
                        <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
                          <FileText className="w-8 h-8 text-[#101828]" />
                        </div>
                        <h3 className="text-lg font-black text-[#101828] mb-1 line-clamp-1">{temp.name}</h3>
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">{temp.category}</p>
                      </div>
                    ))}
                    
                    {savedTemplates.length === 0 && !isLoadingData && (
                      <div className="md:col-span-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8">
                        <Layout className="w-10 h-10 text-gray-300 mb-4" />
                        <h3 className="text-sm font-black text-gray-400">No saved templates found</h3>
                        <Link href="/dashboard/templates" className="text-[#745DF3] text-xs font-bold mt-2 hover:underline">Create your first template →</Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                  {/* Sequence Steps Sidebar */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm overflow-hidden">
                      <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-4 mb-6">Sequence Workflow</h3>
                      
                      <div className="space-y-4 relative">
                        {emailSteps.map((step, i) => (
                          <div key={step.id} className="relative">
                            {/* Wait Logic - Placed between steps */}
                            {i > 0 && (
                              <div className="flex items-center gap-4 pl-[4.25rem] mb-4 group/wait" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2 bg-[#745DF3]/5 hover:bg-[#745DF3]/10 px-3 py-1.5 rounded-full border border-[#745DF3]/20 hover:border-[#745DF3] transition-all shadow-sm">
                                  <Clock className="w-3 h-3 text-[#745DF3]" />
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="number" 
                                      min="1"
                                      value={step.wait} 
                                      onChange={(e) => updateStepContent(i, 'wait', parseInt(e.target.value) || 0)}
                                      className="w-5 bg-transparent text-[11px] font-black text-[#745DF3] border-none p-0 focus:ring-0 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="text-[10px] text-[#745DF3] font-black uppercase tracking-tight">d</span>
                                  </div>
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-[#745DF3]/20 to-transparent" />
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Wait Period</span>
                              </div>
                            )}

                            <div 
                              onClick={() => setActiveStepIndex(i)}
                              className={`flex items-center gap-4 group cursor-pointer p-2 rounded-2xl transition-all ${activeStepIndex === i ? 'bg-[#745DF3]/5 border border-[#745DF3]/10' : 'border border-transparent hover:bg-gray-50'}`}
                            >
                              <div className={`
                                w-12 h-12 rounded-2xl flex items-center justify-center z-10 
                                ${activeStepIndex === i ? 'bg-[#745DF3] text-white shadow-lg shadow-[#745DF3]/20' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 transition-all'}
                              `}>
                                <Mail className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-black text-[#101828]">{step.type}</p>
                                <p className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">
                                  {step.subject || "No subject set"}
                                </p>
                              </div>
                              {i > 0 && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeStep(step.id);
                                  }}
                                  className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={addStep}
                        className="w-full mt-10 py-4 bg-gray-50 text-[#101828] rounded-2xl text-xs font-black hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Follow-up
                      </button>
                    </div>
                  </div>

                  {/* WYSIWYG Editor */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                      {/* Editor Toolbar */}
                      <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setShowAiModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#745DF3] to-[#9281f7] text-white rounded-lg text-xs font-black shadow-lg shadow-[#745DF3]/20 hover:scale-105 transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Rewrite
                          </button>
                          
                          {/* Dynamic Variable Selector */}
                          <div className="relative group/vars ml-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#101828] rounded-lg text-xs font-black border border-gray-100 group-hover/vars:border-[#745DF3]/20 transition-all">
                              <UserPlus className="w-3.5 h-3.5 text-[#745DF3]" />
                              Insert Variable
                            </button>
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 opacity-0 invisible group-hover/vars:opacity-100 group-hover/vars:visible transition-all z-[60] max-h-64 overflow-y-auto no-scrollbar">
                              {(() => {
                                // Extract unique keys from available leads, excluding metadata
                                const skipKeys = ['id', 'org_id', 'created_at', 'status', 'last_contacted_at', 'updated_at', 'metadata'];
                                const dynamicKeys = new Set(['first_name', 'last_name', 'company', 'email']); // Defaults
                                
                                availableLeads.forEach(lead => {
                                  Object.keys(lead).forEach(key => {
                                    if (!skipKeys.includes(key)) dynamicKeys.add(key);
                                  });
                                });

                                return Array.from(dynamicKeys).map((key) => {
                                  const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                  return (
                                    <button
                                      key={key}
                                      onClick={() => {
                                        updateStepContent(activeStepIndex, 'body', (emailSteps[activeStepIndex]?.body || '') + `{{${key}}}`);
                                      }}
                                      className="w-full px-5 py-2 text-left text-[11px] font-bold text-gray-600 hover:bg-[#745DF3]/5 hover:text-[#745DF3] transition-all"
                                    >
                                      {label} <span className="text-[9px] text-gray-300 ml-1 opacity-50">{"{{"}{key}{"}}"}</span>
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {(() => {
                            const spamWords = ['free', 'money', 'winner', 'cash', 'urgent', 'strictly', 'guarantee', 'click here', 'act now', 'limited time'];
                            const toxicWords = ['fuck', 'shit', 'asshole', 'bitch', 'idiot', 'scam', 'hate', 'stupid'];
                            
                            const subject = (emailSteps[activeStepIndex]?.subject || '').toLowerCase();
                            const body = (emailSteps[activeStepIndex]?.body || '').toLowerCase();
                            const combined = subject + ' ' + body;
                            
                            // Use regex with word boundaries to avoid false positives (e.g., "assessment" triggering "ass")
                            const hasToxic = toxicWords.some(word => {
                              const regex = new RegExp(`\\b${word}\\b`, 'i');
                              return regex.test(combined);
                            });
                            
                            const hasSpam = spamWords.some(word => {
                              const regex = new RegExp(`\\b${word}\\b`, 'i');
                              return regex.test(combined);
                            });
                            
                            if (hasToxic) {
                              return (
                                <span className="text-[10px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Risk: Toxic Content
                                </span>
                              );
                            }
                            
                            if (hasSpam) {
                              return (
                                <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                  Spam Score: Caution
                                </span>
                              );
                            }

                            return (
                              <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                Spam Score: Safe
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Editor Inputs */}
                      <div className="flex-1 flex flex-col">
                        <div className="px-8 py-6 border-b border-gray-100">
                          <input 
                            type="text" 
                            placeholder="Subject line..."
                            value={emailSteps[activeStepIndex]?.subject || ''}
                            onChange={(e) => updateStepContent(activeStepIndex, 'subject', e.target.value)}
                            className="w-full bg-transparent text-xl font-black text-[#101828] placeholder:text-gray-200 outline-none"
                          />
                        </div>
                        <textarea 
                          className="flex-1 w-full p-8 text-sm font-medium text-gray-600 leading-relaxed outline-none resize-none no-scrollbar placeholder:text-gray-200"
                          placeholder="Hey {{first_name}}, I noticed you're scaling your sales team..."
                          value={emailSteps[activeStepIndex]?.body || ''}
                          onChange={(e) => updateStepContent(activeStepIndex, 'body', e.target.value)}
                        />
                      </div>

                      {/* Editor Footer */}
                      <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#745DF3]" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                               {(emailSteps[activeStepIndex]?.body || '').length} characters
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-400" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                               Read time: {Math.ceil((emailSteps[activeStepIndex]?.body || '').split(/\s+/).length / 200 * 60)}s
                            </span>
                          </div>
                        </div>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#101828] text-white rounded-xl text-xs font-black hover:bg-[#101828]/90 transition-all">
                          <Check className="w-3.5 h-3.5" />
                          Save Content
                        </button>
                      </div>
                    </div>

                    {/* AI Suggestions Box */}
                    <div className="bg-gradient-to-r from-[#745DF3]/5 to-[#9281f7]/5 rounded-[2.5rem] border border-[#745DF3]/10 p-6 relative overflow-hidden">
                       <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#745DF3] flex items-center justify-center text-white shadow-lg">
                              <Type className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-[#101828]">AI Optimization Suggestions</h4>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by Unibox AI</p>
                            </div>
                          </div>
                          <button 
                            onClick={handleAIOptimize}
                            disabled={isOptimizingAI}
                            className="px-4 py-2 bg-[#745DF3] text-white rounded-lg text-[10px] font-black hover:scale-105 transition-all uppercase tracking-widest flex items-center gap-2"
                          >
                            {isOptimizingAI ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Optimizing...
                              </>
                            ) : (
                              'Apply Improvements'
                            )}
                          </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-4xl mx-auto space-y-8"
                >
                  <div className="text-center mb-12">
                     <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                        <Check className="w-10 h-10" />
                     </div>
                     <h2 className="text-3xl font-black text-[#101828]">Ready to Launch?</h2>
                     <p className="text-gray-500 font-medium mt-2">Double check your configuration before starting the engine.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                           <h3 className="text-sm font-black text-[#101828] uppercase tracking-[0.15em]">Campaign Summary</h3>
                           {isLaunchDisabled && (
                              <div className="flex items-center gap-1.5 text-xs font-black text-red-500 bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                 <AlertCircle className="w-3 h-3" />
                                 Action Required
                              </div>
                           )}
                        </div>
                        <div className="space-y-4">
                           <div className="flex justify-between py-2 border-b border-gray-50">
                              <span className="text-xs font-bold text-gray-400">Name</span>
                              <span className={`text-xs font-black ${campaignName ? 'text-[#101828]' : 'text-red-400'}`}>
                                 {campaignName || 'Missing name'}
                              </span>
                           </div>
                           <div className="flex justify-between py-2 border-b border-gray-50">
                              <span className="text-xs font-bold text-gray-400">Steps</span>
                              <span className="text-xs font-black text-[#101828]">{emailSteps.length} Emails</span>
                           </div>
                           <div className="flex justify-between py-2 border-b border-gray-50">
                              <span className="text-xs font-bold text-gray-400">Target Audience</span>
                              <span className={`text-xs font-black ${selectedLeadIds.length > 0 ? 'text-[#101828]' : 'text-red-400'}`}>
                                 {selectedLeadIds.length} Leads
                              </span>
                           </div>
                           <div className="flex justify-between py-2 border-b border-gray-50">
                              <span className="text-xs font-bold text-gray-400">Sender Profile</span>
                              <span className={`text-xs font-black ${selectedAccountId ? 'text-[#101828]' : 'text-red-400'}`}>
                                 {accounts.find(a => a.id === selectedAccountId)?.email || 'None selected'}
                              </span>
                           </div>
                           <div className="flex justify-between py-2 border-b border-gray-50">
                              <span className="text-xs font-bold text-gray-400">Smart Sending</span>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isSmartSending ? 'text-emerald-500' : 'text-gray-400'}`}>
                                 {isSmartSending ? 'Enabled' : 'Disabled'}
                              </span>
                           </div>
                           {!campaignName || !selectedAccountId ? (
                             <div className="pt-2">
                               <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-relaxed">
                                 Please go back to Step 1: Setup to complete the campaign details.
                               </p>
                             </div>
                           ) : null}
                        </div>
                     </div>
                     
                     <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-sm font-black text-[#101828] uppercase tracking-[0.15em] mb-6">Sequence Status</h3>
                        <div className="space-y-4">
                           <div className="flex justify-between py-2 border-b border-gray-50">
                              <span className="text-xs font-bold text-gray-400">Total Steps</span>
                              <span className="text-xs font-black text-[#101828]">{emailSteps.length} Emails</span>
                           </div>
                           <div className="flex justify-between py-2 border-b border-gray-50">
                              <span className="text-xs font-bold text-gray-400">Initial Email</span>
                              <span className={`text-xs font-black ${emailSteps[0]?.subject && emailSteps[0]?.body ? 'text-emerald-500' : 'text-red-400'}`}>
                                {emailSteps[0]?.subject && emailSteps[0]?.body ? 'Ready' : 'Incomplete'}
                              </span>
                           </div>
                        </div>
                        {(!emailSteps[0]?.subject || !emailSteps[0]?.body) && (
                          <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-relaxed">
                              Sequence Error: Your first email must have both a subject and content.
                            </p>
                            <button 
                              onClick={() => setCurrentStep(4)}
                              className="mt-3 text-[10px] font-black text-[#745DF3] uppercase tracking-widest hover:underline"
                            >
                              Go to sequence editor →
                            </button>
                          </div>
                        )}
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* AI Generation Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAiModal(false)}
              className="absolute inset-0 bg-[#101828]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#745DF3] to-[#9281f7]" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#745DF3] flex items-center justify-center text-white shadow-xl shadow-[#745DF3]/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#101828]">AI Campaign Ghostwriter</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Generate high-converting copy in seconds</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">What is your goal?</label>
                  <textarea 
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    placeholder="e.g. Book a demo for our new AI CRM tool"
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none resize-none h-24"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Who is your target audience?</label>
                  <input 
                    type="text"
                    value={aiAudience}
                    onChange={(e) => setAiAudience(e.target.value)}
                    placeholder="e.g. Sales Managers at SaaS companies"
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowAiModal(false)}
                    className="flex-1 py-4 text-sm font-black text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="flex-[2] py-4 bg-[#745DF3] text-white rounded-2xl text-sm font-black shadow-xl shadow-[#745DF3]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
