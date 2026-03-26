'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Check,
  CheckCircle2,
  Save,
  List,
  Type,
  Layout,
  UserPlus,
  Loader2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  X,
  HelpCircle,
  Plus,
  Trash2,
  Clock,
  Mail,
  Settings,
  Server,
  ChevronDown,
  ChevronRight,
  Zap,
  FileText
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = use(params);
  const router = useRouter();

  // Loading & UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });

  // Campaign Data
  const [campaignName, setCampaignName] = useState('');
  const [campaignStatus, setCampaignStatus] = useState('');
  const [emailSteps, setEmailSteps] = useState<any[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Sender States
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isSmartSending, setIsSmartSending] = useState(false);
  const [showSmartSendingInfo, setShowSmartSendingInfo] = useState(false);

  // PowerSend States
  const [usePowerSend, setUsePowerSend] = useState(false);
  const [hasPowerSendNodes, setHasPowerSendNodes] = useState(false);
  const [showPowerSendInfo, setShowPowerSendInfo] = useState(false);
  const [powerSendServers, setPowerSendServers] = useState<any[]>([]);
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
  const [showServerDropdown, setShowServerDropdown] = useState(false);

  // Editor focus tracking
  const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'body'>('body');
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // AI States
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isOptimizingAI, setIsOptimizingAI] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [aiAudience, setAiAudience] = useState('');
  const [aiCompanyInfo, setAiCompanyInfo] = useState('');
  const [aiTone, setAiTone] = useState('Professional');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPreview, setAiPreview] = useState<{ subject: string; body: string; recommendation?: string } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSource, setPreviewSource] = useState<'generate' | 'optimize'>('generate');

  // Stats (read-only display)
  const [sentCount, setSentCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Load campaign + accounts + powersend
  useEffect(() => {
    const load = async () => {
      try {
        const [campRes, accRes, psRes] = await Promise.all([
          fetch(`/api/campaigns/${campaignId}`),
          fetch('/api/accounts'),
          fetch('/api/powersend'),
        ]);

        if (!campRes.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const campaign = await campRes.json();
        setCampaignName(campaign.name || '');
        setCampaignStatus(campaign.status || 'draft');
        setSentCount(campaign.sent_count || 0);
        setReplyCount(campaign.reply_count || 0);
        setOpenCount(campaign.open_count || 0);
        setIsSmartSending(campaign.config?.smart_sending || false);
        setUsePowerSend(campaign.use_powersend || false);
        setSelectedServerIds(campaign.powersend_server_ids || []);

        // Steps
        const steps = Array.isArray(campaign.steps) && campaign.steps.length > 0
          ? campaign.steps.map((s: any, i: number) => ({ ...s, id: s.id || Date.now() + i }))
          : [{ id: Date.now(), type: 'Initial Email', wait: 0, subject: '', body: '' }];
        setEmailSteps(steps);

        // Sender IDs
        if (Array.isArray(campaign.sender_ids) && campaign.sender_ids.length > 0) {
          setSelectedAccountIds(campaign.sender_ids);
        } else if (campaign.sender_id) {
          setSelectedAccountIds([campaign.sender_id]);
        }

        // Accounts
        const accData = await accRes.json();
        setAccounts(Array.isArray(accData) ? accData : []);

        // PowerSend
        try {
          const psData = await psRes.json();
          if (psData.servers && psData.servers.length > 0) {
            setHasPowerSendNodes(true);
            const usable = psData.servers.filter((s: any) => ['active', 'warming', 'paused'].includes(s.status));
            setPowerSendServers(usable);
          }
        } catch {}
      } catch (err) {
        console.error('Failed to load campaign:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [campaignId]);

  const handleSave = async () => {
    if (!campaignName.trim()) return showToast('Campaign name is required', 'error');
    if (emailSteps.length === 0) return showToast('At least one step is required', 'error');

    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          steps: emailSteps,
          sender_id: selectedAccountIds[0] || null,
          sender_ids: selectedAccountIds,
          use_powersend: usePowerSend,
          powersend_server_ids: usePowerSend ? selectedServerIds : [],
          config: { smart_sending: isSmartSending },
        }),
      });

      if (res.ok) {
        showToast('Campaign saved successfully');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Step helpers
  const addStep = () => {
    const newId = Date.now();
    setEmailSteps([...emailSteps, { id: newId, type: `Follow-up #${emailSteps.length}`, wait: 2, subject: '', body: '' }]);
    setActiveStepIndex(emailSteps.length);
  };

  const removeStep = (id: number) => {
    if (emailSteps.length > 1) {
      const newSteps = emailSteps.filter(s => s.id !== id);
      setEmailSteps(newSteps);
      if (activeStepIndex >= newSteps.length) setActiveStepIndex(newSteps.length - 1);
    }
  };

  const updateStepContent = (index: number, field: string, value: any) => {
    const newSteps = [...emailSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEmailSteps(newSteps);
  };

  // AI Handlers
  const handleGenerateAI = async () => {
    if (!aiGoal || !aiAudience) return showToast('Specify goal and audience', 'error');
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/campaigns/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: aiGoal, audience: aiAudience, companyInfo: aiCompanyInfo, tone: aiTone }),
      });
      const data = await res.json();
      if (data.subject && data.body) {
        setAiPreview({ subject: data.subject, body: data.body, recommendation: data.recommendation });
        setPreviewSource('generate');
        setShowPreviewModal(true);
        setShowAiModal(false);
      }
    } catch { showToast('AI Generation failed', 'error'); }
    finally { setIsGeneratingAI(false); }
  };

  const handleAIOptimize = async () => {
    const cur = emailSteps[activeStepIndex];
    if (!cur?.body && !cur?.subject) return showToast('Write content first', 'error');
    setIsOptimizingAI(true);
    try {
      const res = await fetch('/api/campaigns/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: 'Contextual sequence optimization',
          audience: aiAudience || 'Target Prospect',
          companyInfo: aiCompanyInfo,
          tone: aiTone,
          existingContent: cur.body,
          fullSequence: emailSteps,
          currentStepIndex: activeStepIndex,
        }),
      });
      const data = await res.json();
      if (data.subject || data.body) {
        setAiPreview({ subject: data.subject || cur.subject, body: data.body || cur.body, recommendation: data.recommendation });
        setPreviewSource('optimize');
        setShowPreviewModal(true);
      }
    } catch { showToast('Optimization failed', 'error'); }
    finally { setIsOptimizingAI(false); }
  };

  const statusColor: Record<string, string> = {
    running: 'emerald',
    paused: 'orange',
    draft: 'gray',
    completed: 'blue',
    archived: 'gray',
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#FBFBFB]">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#745DF3]" />
        </main>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen bg-[#FBFBFB]">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-gray-300" />
          <h2 className="text-xl font-black text-[#101828]">Campaign Not Found</h2>
          <p className="text-sm text-gray-400 font-medium">This campaign may have been deleted or you don&apos;t have access.</p>
          <Link href="/dashboard/campaigns" className="mt-4 px-6 py-3 bg-[#745DF3] text-white rounded-2xl text-sm font-black">
            Back to Campaigns
          </Link>
        </main>
      </div>
    );
  }

  const col = statusColor[campaignStatus] || 'gray';

  return (
    <div className="flex h-screen bg-[#FBFBFB] font-jakarta overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header />

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-100 px-8 py-6 sticky top-0 z-20">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link
                  href="/dashboard/campaigns"
                  className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#101828] hover:bg-gray-100 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-xl font-black text-[#101828] tracking-tight">Edit Campaign</h1>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                    Modify settings, sequence &amp; delivery
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-${col}-50 text-${col}-600`}>
                  {campaignStatus}
                </span>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 bg-[#745DF3] text-white rounded-2xl text-sm font-black shadow-xl shadow-[#745DF3]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-[1400px] mx-auto p-8 pb-32 space-y-10">

            {/* Campaign Stats (read-only) */}
            {sentCount > 0 && (
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Emails Sent', value: sentCount.toLocaleString() },
                  { label: 'Opens', value: openCount.toLocaleString() },
                  { label: 'Replies', value: replyCount.toLocaleString() },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{s.label}</p>
                    <p className="text-3xl font-black text-[#101828]">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Campaign Details Card */}
            <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm max-w-xl">
              <h2 className="text-lg font-black text-[#101828] mb-6">Campaign Details</h2>
              <div className="space-y-6">
                {/* Campaign Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none"
                  />
                </div>

                {/* Sender Profiles */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
                    Sender Profile{selectedAccountIds.length > 1 ? 's' : ''}
                    {usePowerSend && <span className="ml-2 text-emerald-500 normal-case">(Optional — PowerSend active)</span>}
                    {!usePowerSend && selectedAccountIds.length > 1 && (
                      <span className="ml-2 text-[#745DF3] normal-case">({selectedAccountIds.length} selected — will rotate)</span>
                    )}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none text-left flex items-center justify-between"
                    >
                      <span className="truncate">
                        {selectedAccountIds.length === 0
                          ? usePowerSend ? 'Using PowerSend' : 'Select sender profiles...'
                          : selectedAccountIds.length === 1
                            ? accounts.find(a => a.id === selectedAccountIds[0])?.email || 'Selected'
                            : `${selectedAccountIds.length} accounts selected`}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showAccountDropdown ? 'rotate-90' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showAccountDropdown && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                            <button type="button" onClick={() => setSelectedAccountIds(accounts.map(a => a.id))} className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest hover:underline">Select All</button>
                            <button type="button" onClick={() => setSelectedAccountIds([])} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:underline">Clear</button>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {accounts.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-400">No sender profiles found</div>
                            ) : accounts.map(acc => {
                              const sel = selectedAccountIds.includes(acc.id);
                              return (
                                <button key={acc.id} type="button" onClick={() => setSelectedAccountIds(prev => sel ? prev.filter(x => x !== acc.id) : [...prev, acc.id])} className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${sel ? 'bg-[#745DF3]/5' : ''}`}>
                                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${sel ? 'bg-[#745DF3] border-[#745DF3]' : 'border-gray-200'}`}>
                                    {sel && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#101828] truncate">{acc.email}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{acc.provider}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <div className="px-4 py-3 border-t border-gray-50">
                            <button type="button" onClick={() => setShowAccountDropdown(false)} className="w-full py-2 rounded-xl bg-[#745DF3] text-white text-xs font-black uppercase tracking-widest hover:bg-[#6246E0] transition-colors">Done</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Smart Sending Toggle */}
                <div className="pt-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div onClick={() => setIsSmartSending(!isSmartSending)} className={`w-12 h-6 rounded-full relative transition-all ${isSmartSending ? 'bg-[#745DF3]' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isSmartSending ? 'right-1' : 'left-1'}`} />
                      </div>
                      <span className="text-sm font-bold text-[#101828]">Smart Sending (AI-Optimization)</span>
                    </label>
                    <button onClick={(e) => { e.preventDefault(); setShowSmartSendingInfo(!showSmartSendingInfo); }} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-[#745DF3]">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <AnimatePresence>
                    {showSmartSendingInfo && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mt-4 p-4 bg-[#745DF3]/5 border border-[#745DF3]/10 rounded-2xl">
                          <p className="text-[11px] leading-relaxed text-[#745DF3] font-medium">
                            <span className="font-black uppercase tracking-widest block mb-1">What is Smart Sending?</span>
                            Our AI engine analyzes each lead&apos;s timezone and job title to calculate the perfect delivery window.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* PowerSend Toggle */}
                {hasPowerSendNodes && (
                  <div className="pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div onClick={() => { setUsePowerSend(!usePowerSend); if (usePowerSend) setShowServerDropdown(false); }} className={`w-12 h-6 rounded-full relative transition-all ${usePowerSend ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${usePowerSend ? 'right-1' : 'left-1'}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-bold text-[#101828]">Use PowerSend</span>
                        </div>
                      </label>
                      <button onClick={(e) => { e.preventDefault(); setShowPowerSendInfo(!showPowerSendInfo); }} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-emerald-500">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showPowerSendInfo && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                            <p className="text-[11px] leading-relaxed text-emerald-700 font-medium">
                              <span className="font-black uppercase tracking-widest block mb-1">What is PowerSend?</span>
                              Routes emails through your dedicated Smart Server infrastructure for high-volume delivery.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {usePowerSend && (
                        <motion.div initial={{ opacity: 0, height: 0, overflow: 'hidden' as any }} animate={{ opacity: 1, height: 'auto', overflow: 'visible' as any, transition: { overflow: { delay: 0.3 } } }} exit={{ opacity: 0, height: 0, overflow: 'hidden' as any }}>
                          <div className="mt-4 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
                              Smart Server{selectedServerIds.length > 1 ? 's' : ''}
                            </label>
                            <div className="relative">
                              <button type="button" onClick={() => setShowServerDropdown(!showServerDropdown)} className="w-full px-5 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-emerald-300/30 transition-all outline-none text-left flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Server className="w-4 h-4 text-emerald-600" />
                                  <span className="truncate">
                                    {selectedServerIds.length === 0 ? 'Select servers...' : selectedServerIds.length === 1 ? powerSendServers.find(s => s.id === selectedServerIds[0])?.name || 'Selected' : `${selectedServerIds.length} servers selected`}
                                  </span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showServerDropdown ? 'rotate-180' : ''}`} />
                              </button>
                              <AnimatePresence>
                                {showServerDropdown && (
                                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                                      <button type="button" onClick={() => setSelectedServerIds(powerSendServers.map(s => s.id))} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Select All</button>
                                      <button type="button" onClick={() => setSelectedServerIds([])} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:underline">Clear</button>
                                    </div>
                                    <div className="max-h-56 overflow-y-auto">
                                      {powerSendServers.map(server => {
                                        const sel = selectedServerIds.includes(server.id);
                                        return (
                                          <button key={server.id} type="button" onClick={() => setSelectedServerIds(prev => sel ? prev.filter(x => x !== server.id) : [...prev, server.id])} className={`w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${sel ? 'bg-emerald-50' : ''}`}>
                                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${sel ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'}`}>
                                              {sel && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <Server className={`w-4 h-4 flex-shrink-0 ${sel ? 'text-emerald-600' : 'text-gray-400'}`} />
                                            <div className="flex-1 min-w-0">
                                              <p className={`text-sm font-bold truncate ${sel ? 'text-emerald-700' : 'text-[#101828]'}`}>{server.name}</p>
                                              <p className="text-[10px] font-medium text-gray-400 truncate">{server.provider} · {server.status === 'warming' ? 'Warming Up' : server.status} · Rep: {server.reputation_score ?? 100}</p>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <div className="px-5 py-3 border-t border-gray-50">
                                      <button type="button" onClick={() => setShowServerDropdown(false)} className="w-full py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors">Done</button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Sequence Editor */}
            <div>
              <h2 className="text-lg font-black text-[#101828] mb-6">Email Sequence</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sequence Steps Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm overflow-hidden">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-4 mb-6">Sequence Workflow</h3>
                    <div className="space-y-4 relative">
                      {emailSteps.map((step, i) => (
                        <div key={step.id} className="relative">
                          {i > 0 && (
                            <div className="flex items-center gap-4 pl-[4.25rem] mb-4">
                              <div className="flex items-center gap-2 bg-[#745DF3]/5 hover:bg-[#745DF3]/10 px-3 py-1.5 rounded-full border border-[#745DF3]/20 hover:border-[#745DF3] transition-all shadow-sm">
                                <Clock className="w-3 h-3 text-[#745DF3]" />
                                <div className="flex items-center gap-1">
                                  <input type="number" min="1" value={step.wait} onChange={(e) => updateStepContent(i, 'wait', parseInt(e.target.value) || 0)} className="w-5 bg-transparent text-[11px] font-black text-[#745DF3] border-none p-0 focus:ring-0 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                  <span className="text-[10px] text-[#745DF3] font-black uppercase tracking-tight">d</span>
                                </div>
                              </div>
                              <div className="h-px flex-1 bg-gradient-to-r from-[#745DF3]/20 to-transparent" />
                              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Wait Period</span>
                            </div>
                          )}
                          <div onClick={() => setActiveStepIndex(i)} className={`flex items-center gap-4 group cursor-pointer p-2 rounded-2xl transition-all ${activeStepIndex === i ? 'bg-[#745DF3]/5 border border-[#745DF3]/10' : 'border border-transparent hover:bg-gray-50'}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 ${activeStepIndex === i ? 'bg-[#745DF3] text-white shadow-lg shadow-[#745DF3]/20' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 transition-all'}`}>
                              <Mail className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-black text-[#101828]">{step.type}</p>
                              <p className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{step.subject || 'No subject set'}</p>
                            </div>
                            {i > 0 && (
                              <button onClick={(e) => { e.stopPropagation(); removeStep(step.id); }} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={addStep} className="w-full mt-10 py-4 bg-gray-50 text-[#101828] rounded-2xl text-xs font-black hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Follow-up
                    </button>
                  </div>
                </div>

                {/* WYSIWYG Editor */}
                <div className="lg:col-span-2 space-y-6">
                  {/* AI Bar */}
                  <div className="bg-gradient-to-r from-[#745DF3]/5 to-[#9281f7]/5 rounded-[2rem] border border-[#745DF3]/10 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#745DF3]/20 flex items-center justify-center text-[#745DF3] shadow-sm">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#101828] uppercase tracking-wider">AI Writing Assistant</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Optimize or generate content</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={handleAIOptimize} disabled={isOptimizingAI || (!emailSteps[activeStepIndex]?.body && !emailSteps[activeStepIndex]?.subject)} className={`px-4 py-2 bg-white text-[#745DF3] border border-[#745DF3]/20 rounded-xl text-[10px] font-black hover:border-[#745DF3] transition-all uppercase tracking-widest flex items-center gap-2 ${(!emailSteps[activeStepIndex]?.body && !emailSteps[activeStepIndex]?.subject) ? 'opacity-30 cursor-not-allowed' : ''}`}>
                        {isOptimizingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Type className="w-3 h-3" />}
                        Suggest Improvements
                      </button>
                      <button onClick={() => setShowAiModal(true)} className="px-4 py-2 bg-[#745DF3] text-white rounded-xl text-[10px] font-black hover:scale-105 transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#745DF3]/10">
                        <Sparkles className="w-3 h-3" />
                        AI Rewrite
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    {/* Toolbar */}
                    <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative group/vars">
                          <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#101828] rounded-lg text-[10px] font-black border border-gray-100 group-hover/vars:border-[#745DF3]/20 transition-all uppercase tracking-widest">
                            <UserPlus className="w-3.5 h-3.5 text-[#745DF3]" />
                            Insert Variable
                          </button>
                          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 opacity-0 invisible group-hover/vars:opacity-100 group-hover/vars:visible transition-all z-[60] max-h-64 overflow-y-auto no-scrollbar">
                            {['first_name', 'last_name', 'company', 'email', 'title', 'phone', 'city', 'state', 'country', 'website', 'linkedin_url', 'industry'].map((key) => {
                              const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                              return (
                                <button
                                  key={key}
                                  onClick={() => {
                                    const field = lastFocusedField;
                                    const ref = field === 'subject' ? subjectRef.current : bodyRef.current;
                                    const currentValue = emailSteps[activeStepIndex]?.[field] || '';
                                    const cursorPos = ref?.selectionStart ?? currentValue.length;
                                    const newValue = currentValue.slice(0, cursorPos) + `{{${key}}}` + currentValue.slice(cursorPos);
                                    updateStepContent(activeStepIndex, field, newValue);
                                    setTimeout(() => {
                                      if (ref) {
                                        ref.focus();
                                        const newPos = cursorPos + key.length + 4;
                                        ref.setSelectionRange(newPos, newPos);
                                      }
                                    }, 0);
                                  }}
                                  className="w-full px-5 py-2 text-left text-[11px] font-bold text-gray-600 hover:bg-[#745DF3]/5 hover:text-[#745DF3] transition-all"
                                >
                                  {label} <span className="text-[9px] text-gray-300 ml-1 opacity-50">{"{{"}{key}{"}}"}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const spamWords = ['free', 'money', 'winner', 'cash', 'urgent', 'guarantee', 'click here', 'act now', 'limited time'];
                          const curS = (emailSteps[activeStepIndex]?.subject || '').toLowerCase();
                          const curB = (emailSteps[activeStepIndex]?.body || '').toLowerCase();
                          const combined = curS + ' ' + curB;
                          const hasSpam = spamWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(combined));
                          return hasSpam ? (
                            <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-widest">Spam Score: Caution</span>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Spam Score: Safe</span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Subject + Body */}
                    <div className="flex-1 flex flex-col">
                      <div className="px-8 py-6 border-b border-gray-100">
                        <input ref={subjectRef} type="text" placeholder="Subject line..." value={emailSteps[activeStepIndex]?.subject || ''} onChange={(e) => updateStepContent(activeStepIndex, 'subject', e.target.value)} onFocus={() => setLastFocusedField('subject')} className="w-full bg-transparent text-xl font-black text-[#101828] placeholder:text-gray-200 outline-none" />
                      </div>
                      <textarea
                        ref={bodyRef}
                        className="flex-1 w-full p-8 text-sm font-medium text-gray-600 leading-relaxed outline-none resize-none no-scrollbar placeholder:text-gray-200"
                        placeholder="Hey {{first_name}}, I noticed you're scaling your sales team..."
                        value={emailSteps[activeStepIndex]?.body || ''}
                        onChange={(e) => updateStepContent(activeStepIndex, 'body', e.target.value)}
                        onFocus={() => setLastFocusedField('body')}
                      />
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#745DF3]" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{(emailSteps[activeStepIndex]?.body || '').length} characters</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-400" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Read time: {Math.ceil((emailSteps[activeStepIndex]?.body || '').split(/\s+/).length / 200 * 60)}s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Generation Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAiModal(false)} className="absolute inset-0 bg-[#101828]/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#745DF3] to-[#9281f7]" />
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#745DF3] flex items-center justify-center text-white shadow-xl shadow-[#745DF3]/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#101828]">AI Campaign Ghostwriter</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Generate high-converting copy</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">What is your goal?</label>
                  <textarea value={aiGoal} onChange={(e) => setAiGoal(e.target.value)} placeholder="e.g. Book a demo for our new AI CRM tool" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none resize-none h-24" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Who is your target audience?</label>
                  <input type="text" value={aiAudience} onChange={(e) => setAiAudience(e.target.value)} placeholder="e.g. Sales Managers at SaaS companies" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Tone</label>
                    <select value={aiTone} onChange={(e) => setAiTone(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none appearance-none">
                      <option value="Professional">Professional</option>
                      <option value="Casual">Casual</option>
                      <option value="Direct">Direct</option>
                      <option value="Witty">Witty</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Company Context</label>
                    <input type="text" value={aiCompanyInfo} onChange={(e) => setAiCompanyInfo(e.target.value)} placeholder="e.g. LeadFlow AI" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowAiModal(false)} className="flex-1 py-4 text-sm font-black text-gray-500 hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                  <button onClick={handleGenerateAI} disabled={isGeneratingAI} className="flex-[2] py-4 bg-[#745DF3] text-white rounded-2xl text-sm font-black shadow-xl shadow-[#745DF3]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    {isGeneratingAI ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate Copy</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && aiPreview && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPreviewModal(false)} className="absolute inset-0 bg-[#101828]/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#745DF3] flex items-center justify-center text-white shadow-xl shadow-[#745DF3]/20"><Sparkles className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-black text-[#101828]">Review AI Suggestions</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Powered by Unibox AI</p>
                  </div>
                </div>
                <button onClick={() => setShowPreviewModal(false)} className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shadow-sm"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between"><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Original Version</h4><span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[9px] font-black uppercase tracking-widest">Current</span></div>
                  <div className="space-y-4 opacity-50">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100"><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Subject</p><p className="text-sm font-bold text-[#101828]">{emailSteps[activeStepIndex]?.subject || '(No subject)'}</p></div>
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 min-h-[200px]"><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Body</p><p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">{emailSteps[activeStepIndex]?.body || '(No content)'}</p></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between"><h4 className="text-[10px] font-black text-[#745DF3] uppercase tracking-[0.2em]">AI Improved Version</h4><span className="px-3 py-1 bg-[#745DF3]/10 text-[#745DF3] rounded-full text-[9px] font-black uppercase tracking-widest">Recommended</span></div>
                  <div className="space-y-4">
                    {aiPreview.recommendation && (
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4">
                        <div className="flex items-center gap-2 mb-1"><Check className="w-3 h-3 text-emerald-600" /><p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">AI Strategist Note</p></div>
                        <p className="text-[11px] font-bold text-emerald-900 leading-relaxed italic">&quot;{aiPreview.recommendation}&quot;</p>
                      </div>
                    )}
                    <div className="p-6 bg-[#745DF3]/5 rounded-2xl border border-[#745DF3]/20 shadow-sm"><p className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest mb-1">Subject</p><p className="text-sm font-bold text-[#101828]">{aiPreview.subject}</p></div>
                    <div className="p-6 bg-[#745DF3]/5 rounded-3xl border border-[#745DF3]/20 shadow-sm min-h-[200px]"><p className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest mb-1">Body</p><p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">{aiPreview.body}</p></div>
                  </div>
                </div>
              </div>
              <div className="px-10 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => { if (previewSource === 'generate') handleGenerateAI(); else handleAIOptimize(); }} disabled={isGeneratingAI || isOptimizingAI} className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-[#101828] rounded-2xl text-xs font-black hover:border-[#745DF3] transition-all">
                    <RotateCcw className={`w-4 h-4 ${(isGeneratingAI || isOptimizingAI) ? 'animate-spin' : ''}`} />Redo
                  </button>
                  <button onClick={() => setShowPreviewModal(false)} className="text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-all">Discard</button>
                </div>
                <button onClick={() => { updateStepContent(activeStepIndex, 'subject', aiPreview.subject); updateStepContent(activeStepIndex, 'body', aiPreview.body); setShowPreviewModal(false); setAiPreview(null); }} className="flex items-center gap-2 px-10 py-4 bg-[#745DF3] text-white rounded-2xl text-sm font-black shadow-xl shadow-[#745DF3]/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Check className="w-4 h-4" />Accept & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]">
            <div className={`px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 min-w-[320px] backdrop-blur-xl border ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 'bg-red-500/90 border-red-400 text-white'}`}>
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-white" /> : <AlertCircle className="w-6 h-6 text-white" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{toast.type === 'success' ? 'Success' : 'Attention'}</p>
                <p className="text-sm font-bold">{toast.msg}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
