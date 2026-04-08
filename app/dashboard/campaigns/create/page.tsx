'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
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
  CheckCircle2,
  Save,
  List,
  Type,
  Layout,
  UserPlus,
  Loader2,
  AlertCircle,
  LogOut,
  Sparkles,
  RotateCcw,
  ArrowRight,
  X,
  HelpCircle,
  Search,
  Filter,
  Tag as TagIcon,
  Server,
  ChevronDown,
  Zap,
  Upload,
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
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [selectAllProgress, setSelectAllProgress] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 10;

  // List States
  const [lists, setLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  // Real Data States
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isSmartSending, setIsSmartSending] = useState(false);
  const [showSmartSendingInfo, setShowSmartSendingInfo] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
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
  
  // AI Preview States
  const [aiPreview, setAiPreview] = useState<{ subject: string, body: string, recommendation?: string } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSource, setPreviewSource] = useState<'generate' | 'optimize'>('generate');

  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });

  // CSV Upload States
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvUploadProgress, setCsvUploadProgress] = useState(0);
  const [csvUploadStats, setCsvUploadStats] = useState({ parsed: 0, imported: 0, errors: 0 });
  const csvAbortRef = useRef(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // ---- CSV header normalization ----
  const normalizeHeader = (raw: string): string | null => {
    const h = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const map: Record<string, string> = {
      email: 'email', email_address: 'email', e_mail: 'email',
      first_name: 'first_name', firstname: 'first_name', first: 'first_name', given_name: 'first_name',
      last_name: 'last_name', lastname: 'last_name', last: 'last_name', surname: 'last_name', family_name: 'last_name',
      company: 'company', company_name: 'company', organization: 'company', organisation: 'company',
      job_title: 'job_title', jobtitle: 'job_title', title: 'job_title', position: 'job_title', role: 'job_title',
      phone: 'phone', phone_number: 'phone', telephone: 'phone', mobile: 'phone',
      linkedin: 'linkedin', linkedin_url: 'linkedin',
      website: 'website', url: 'website', web: 'website',
      city: 'city', state: 'state', country: 'country',
      tags: 'tags', tag: 'tags', label: 'tags',
    };
    return map[h] || null;
  };

  // ---- Send a batch of leads to the import API ----
  const sendCSVBatch = async (leads: any[]): Promise<{ imported: number; errors: number }> => {
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      });
      if (res.ok) {
        const data = await res.json();
        return { imported: data.count || leads.length, errors: 0 };
      }
      return { imported: 0, errors: leads.length };
    } catch {
      return { imported: 0, errors: leads.length };
    }
  };

  // ---- CSV upload handler for campaign create ----
  const handleCSVUpload = useCallback(async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }

    setIsUploadingCSV(true);
    setCsvUploadProgress(0);
    setCsvUploadStats({ parsed: 0, imported: 0, errors: 0 });
    csvAbortRef.current = false;

    const BATCH_SIZE = 1000;
    let headerMap: Record<number, string> = {};
    let batch: any[] = [];
    let totalParsed = 0;
    let totalImported = 0;
    let totalErrors = 0;
    const rowEstimate = Math.max(1, Math.round(file.size / 120));

    await new Promise<void>((resolve) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        chunkSize: 1024 * 512,
        chunk: async (results: Papa.ParseResult<string[]>, parser: Papa.Parser) => {
          if (csvAbortRef.current) { parser.abort(); resolve(); return; }

          const rows = results.data as string[][];
          for (const row of rows) {
            if (Object.keys(headerMap).length === 0) {
              row.forEach((cell, i) => {
                const mapped = normalizeHeader(cell);
                if (mapped) headerMap[i] = mapped;
              });
              if (!Object.values(headerMap).includes('email')) {
                showToast('CSV must have an "email" column', 'error');
                parser.abort();
                setIsUploadingCSV(false);
                resolve();
                return;
              }
              continue;
            }

            const lead: any = {};
            row.forEach((cell, i) => {
              const field = headerMap[i];
              if (field && cell?.trim()) {
                if (field === 'tags') {
                  lead.tags = cell.split(';').map((t: string) => t.trim()).filter(Boolean);
                } else {
                  lead[field] = cell.trim();
                }
              }
            });

            if (!lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) continue;

            batch.push(lead);
            totalParsed++;

            if (batch.length >= BATCH_SIZE) {
              parser.pause();
              const result = await sendCSVBatch(batch);
              totalImported += result.imported;
              totalErrors += result.errors;
              batch = [];
              setCsvUploadProgress(Math.min(95, Math.round((totalParsed / rowEstimate) * 100)));
              setCsvUploadStats({ parsed: totalParsed, imported: totalImported, errors: totalErrors });
              parser.resume();
            }
          }
        },
        complete: async () => {
          if (batch.length > 0) {
            const result = await sendCSVBatch(batch);
            totalImported += result.imported;
            totalErrors += result.errors;
          }
          setCsvUploadProgress(100);
          setCsvUploadStats({ parsed: totalParsed, imported: totalImported, errors: totalErrors });

          setTimeout(async () => {
            setIsUploadingCSV(false);
            if (totalImported > 0) {
              showToast(`Imported ${totalImported.toLocaleString()} contacts — now select them below`);
              await fetchLeads(1, '', '', '');
              setCurrentPage(1);
            } else if (totalErrors > 0) {
              showToast(`Import failed for ${totalErrors.toLocaleString()} contacts`, 'error');
            }
          }, 600);
          resolve();
        },
        error: (err: Error) => {
          console.error('CSV parse error:', err);
          showToast('Failed to parse CSV file', 'error');
          setIsUploadingCSV(false);
          resolve();
        },
      });
    });
  }, []);

  const fetchLeads = async (page: number, search: string, tag: string, source?: string) => {
    setIsLoadingLeads(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: leadsPerPage.toString(),
      });
      if (search) params.append('search', search);
      if (tag) params.append('tag', tag);
      if (source) params.append('source', source);
      if (selectedListId) params.append('list_id', selectedListId);
      
      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      setAvailableLeads(data.leads || []);
      setTotalLeads(data.total || 0);
    } catch (err) {
      console.error("Error fetching leads:", err);
      showToast("Failed to load leads", "error");
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, tempRes, psRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/templates'),
          fetch('/api/powersend')
        ]);
        
        const accData = await accRes.json();
        const tempData = await tempRes.json();
        
        const validatedAccounts = Array.isArray(accData) ? accData : [];
        setAccounts(validatedAccounts);
        
        if (validatedAccounts.length > 0) {
          setSelectedAccountId(validatedAccounts[0].id);
          setSelectedAccountIds([validatedAccounts[0].id]);
        }
        setSavedTemplates(Array.isArray(tempData) ? tempData : []);
        
        // Fetch lists
        try {
          const listsRes = await fetch('/api/lists');
          if (listsRes.ok) {
            const listsData = await listsRes.json();
            setLists(Array.isArray(listsData) ? listsData : []);
          }
        } catch {}
        
        // Check if user has PowerSend nodes available
        try {
          const psData = await psRes.json();
          if (psData.servers && psData.servers.length > 0) {
            setHasPowerSendNodes(true);
            const usableServers = psData.servers.filter((s: any) => ['active', 'warming', 'paused'].includes(s.status));
            setPowerSendServers(usableServers);
            if (usableServers.length > 0) {
              setSelectedServerIds(usableServers.map((s: any) => s.id));
            }
          }
        } catch {}
        
        // Initial leads fetch
        await fetchLeads(1, '', '', '');
      } catch (err) {
        console.error("Error loading campaign data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  // Sync leads when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoadingData) {
        fetchLeads(currentPage, searchQuery, tagFilter, sourceFilter);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, tagFilter, sourceFilter, currentPage, selectedListId]);

  useEffect(() => {
    if (!isLoadingData && accounts.length === 0 && !hasPowerSendNodes) {
      router.push('/dashboard/campaigns');
    }
  }, [isLoadingData, accounts, hasPowerSendNodes, router]);

  const handleGenerateAI = async () => {
    if (!aiGoal || !aiAudience) return showToast("Please specify your goal and audience", "error");
    
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/campaigns/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          goal: aiGoal, 
          audience: aiAudience,
          companyInfo: aiCompanyInfo,
          tone: aiTone
        })
      });
      
      const data = await res.json();
      if (data.subject && data.body) {
        setAiPreview({ 
          subject: data.subject, 
          body: data.body,
          recommendation: data.recommendation 
        });
        setPreviewSource('generate');
        setShowPreviewModal(true);
        setShowAiModal(false);
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      showToast("AI Generation failed", "error");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAIOptimize = async () => {
    const currentStepData = emailSteps[activeStepIndex];
    if (!currentStepData?.body && !currentStepData?.subject) {
      return showToast("Write a subject or body first", "error");
    }
    
    setIsOptimizingAI(true);
    try {
      const res = await fetch('/api/campaigns/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            goal: "Contextual sequence optimization", 
            audience: aiAudience || "Target Prospect",
            companyInfo: aiCompanyInfo,
            tone: aiTone,
            existingContent: currentStepData.body,
            fullSequence: emailSteps,
            currentStepIndex: activeStepIndex
        })
      });
      
      const data = await res.json();
      if (data.subject || data.body) {
        setAiPreview({ 
          subject: data.subject || currentStepData.subject, 
          body: data.body || currentStepData.body,
          recommendation: data.recommendation
        });
        setPreviewSource('optimize');
        setShowPreviewModal(true);
      }
    } catch (err) {
      console.error("AI Optimization error:", err);
      showToast("Optimization failed", "error");
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

  const getMissingVariables = (text: string) => {
    const matches = text.match(/{{(.*?)}}/g);
    if (!matches) return [];
    
    const usedVars = Array.from(new Set(matches.map(m => m.slice(2, -2).trim())));
    
    const leadsToCheck = selectedLeadIds.length > 0 
      ? availableLeads.filter(l => selectedLeadIds.includes(l.id))
      : availableLeads;
      
    if (leadsToCheck.length === 0) return usedVars;

    const availableKeys = new Set<string>();
    leadsToCheck.forEach(lead => {
      Object.keys(lead).forEach(key => availableKeys.add(key));
      if (lead.custom_fields && typeof lead.custom_fields === 'object') {
        Object.keys(lead.custom_fields).forEach(key => availableKeys.add(key));
      }
    });

    return usedVars.filter(v => !availableKeys.has(v));
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
    if (!campaignName) return showToast("Please enter a campaign name", "error");
    if (selectedAccountIds.length === 0 && !usePowerSend) return showToast("Please select at least one sender profile or enable PowerSend", "error");
    if (selectedLeadIds.length === 0) return showToast("Please select at least one lead", "error");
    if (emailSteps.length === 0 || !emailSteps[0].subject || !emailSteps[0].body) {
      return showToast("Please complete at least the first email in your sequence", "error");
    }
    
    setIsLaunching(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          sender_id: selectedAccountIds[0],
          sender_ids: selectedAccountIds,
          lead_ids: selectedLeadIds,
          list_id: selectedListId || undefined,
          steps: emailSteps,
          status: 'running',
          use_powersend: usePowerSend,
          powersend_server_ids: usePowerSend ? selectedServerIds : [],
          config: {
            smart_sending: isSmartSending
          }
        })
      });

      if (res.ok) {
        showToast("Campaign launched successfully!");
        router.push('/dashboard/campaigns');
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to launch campaign", "error");
      }
    } catch (err) {
      console.error("Launch error:", err);
      showToast("Something went wrong", "error");
    } finally {
      setIsLaunching(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!campaignName) return showToast("Please enter a campaign name", "error");

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          sender_id: selectedAccountIds[0] || null,
          sender_ids: selectedAccountIds,
          lead_ids: selectedLeadIds,
          list_id: selectedListId || undefined,
          steps: emailSteps,
          status: 'draft',
          use_powersend: usePowerSend,
          powersend_server_ids: usePowerSend ? selectedServerIds : [],
          config: {
            smart_sending: isSmartSending
          }
        })
      });

      if (res.ok) {
        showToast("Campaign saved as draft");
      }
    } catch (err) {
      console.error("Save draft error:", err);
      showToast("Failed to save draft", "error");
    }
  };

  const hasSendingMethod = selectedAccountIds.length > 0 || usePowerSend;
  const isLaunchDisabled = currentStep === 5 && (
    !campaignName || 
    !hasSendingMethod || 
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
          {!isLoadingData && accounts.length === 0 && !hasPowerSendNodes && (
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

          <div className="max-w-[1400px] mx-auto p-8 pb-32">
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
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
                          Sender Profile{accounts.length > 1 ? 's' : ''} or Toogle use Powersend
                          {usePowerSend && (
                            <span className="ml-2 text-emerald-500 normal-case">(Optional — PowerSend active)</span>
                          )}
                          {!usePowerSend && selectedAccountIds.length > 1 && (
                            <span className="ml-2 text-[#745DF3] normal-case">({selectedAccountIds.length} selected — will rotate)</span>
                          )}
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                            className={`w-full px-6 py-4 border-none rounded-2xl text-sm font-bold focus:ring-2 transition-all outline-none text-left flex items-center justify-between ${
                              usePowerSend && selectedAccountIds.length === 0
                                ? 'bg-emerald-50/50 text-gray-400 focus:ring-emerald-200/20'
                                : 'bg-gray-50 text-[#101828] focus:ring-[#745DF3]/20'
                            }`}
                          >
                            <span className="truncate">
                              {selectedAccountIds.length === 0 
                                ? (usePowerSend ? 'Using PowerSend — select a profile to set the "From" address' : 'Select sender profiles...')
                                : selectedAccountIds.length === 1
                                  ? accounts.find(a => a.id === selectedAccountIds[0])?.email || 'Selected'
                                  : `${selectedAccountIds.length} accounts selected`
                              }
                            </span>
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showAccountDropdown ? 'rotate-90' : ''}`} />
                          </button>
                          
                          <AnimatePresence>
                            {showAccountDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden"
                              >
                                {/* Select All / Clear */}
                                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedAccountIds(accounts.map(a => a.id))}
                                    className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest hover:underline"
                                  >
                                    Select All
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedAccountIds([])}
                                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:underline"
                                  >
                                    Clear
                                  </button>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {!Array.isArray(accounts) || accounts.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-400">No sender profiles found</div>
                                  ) : (
                                    accounts.map(acc => {
                                      const isSelected = selectedAccountIds.includes(acc.id);
                                      return (
                                        <button
                                          key={acc.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedAccountIds(prev => 
                                              isSelected 
                                                ? prev.filter(id => id !== acc.id) 
                                                : [...prev, acc.id]
                                            );
                                            setSelectedAccountId(isSelected ? '' : acc.id);
                                          }}
                                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${isSelected ? 'bg-[#745DF3]/5' : ''}`}
                                        >
                                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                            isSelected ? 'bg-[#745DF3] border-[#745DF3]' : 'border-gray-200'
                                          }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#101828] truncate">{acc.email}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{acc.provider}</p>
                                          </div>
                                          {acc.status === 'active' && (
                                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                          )}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                                <div className="px-4 py-3 border-t border-gray-50">
                                  <button
                                    type="button"
                                    onClick={() => setShowAccountDropdown(false)}
                                    className="w-full py-2 rounded-xl bg-[#745DF3] text-white text-xs font-black uppercase tracking-widest hover:bg-[#6246E0] transition-colors"
                                  >
                                    Done
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {selectedAccountIds.length > 1 && (
                          <div className="mt-2 pl-2">
                            <p className="text-[10px] text-[#745DF3] font-medium">
                              Emails will be distributed across selected profiles using round-robin rotation to protect sender reputation.
                            </p>
                          </div>
                        )}

                        {!Array.isArray(accounts) || accounts.length === 0 ? (
                          <div className="mt-2 pl-2">
                            {usePowerSend ? (
                              <p className="text-emerald-600 text-[10px] font-bold flex items-center gap-1.5">
                                <Zap className="w-3 h-3" />
                                PowerSend will handle delivery. Add a sender profile later to customize the &quot;From&quot; address.
                              </p>
                            ) : (
                              <Link href="/dashboard/providers" className="text-[#745DF3] text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                                <Plus className="w-3 h-3" />
                                Connect your first profile
                              </Link>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <div className="pt-4">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <div 
                              onClick={() => setIsSmartSending(!isSmartSending)}
                              className={`w-12 h-6 rounded-full relative transition-all ${isSmartSending ? 'bg-[#745DF3]' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isSmartSending ? 'right-1' : 'left-1'}`} />
                            </div>
                            <span className="text-sm font-bold text-[#101828]">Enable Smart Sending (AI-Optimization)</span>
                          </label>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              setShowSmartSendingInfo(!showSmartSendingInfo);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-[#745DF3]"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                        </div>

                        <AnimatePresence>
                          {showSmartSendingInfo && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 p-4 bg-[#745DF3]/5 border border-[#745DF3]/10 rounded-2xl">
                                <p className="text-[11px] leading-relaxed text-[#745DF3] font-medium">
                                  <span className="font-black uppercase tracking-widest block mb-1">What is Smart Sending?</span>
                                  Our AI-Optimization engine analyzes each lead's timezone, job title, and industry to calculate the perfect delivery window. 
                                  Instead of sending at a rigid time, it waits for the recipient's peak activity hour (e.g., 8:30 AM for Founders) and adds human-like jitter to maximize open rates and bypass spam filters.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* PowerSend Toggle + Server Selector */}
                      {hasPowerSendNodes && (
                        <div className="pt-4 border-t border-gray-50">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <div 
                                onClick={() => {
                                  const next = !usePowerSend;
                                  setUsePowerSend(next);
                                  if (!next) setShowServerDropdown(false);
                                }}
                                className={`w-12 h-6 rounded-full relative transition-all ${usePowerSend ? 'bg-emerald-500' : 'bg-gray-200'}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${usePowerSend ? 'right-1' : 'left-1'}`} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-bold text-[#101828]">Use PowerSend</span>
                              </div>
                            </label>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                setShowPowerSendInfo(!showPowerSendInfo);
                              }}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-emerald-500"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          </div>

                          <AnimatePresence>
                            {showPowerSendInfo && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                  <p className="text-[11px] leading-relaxed text-emerald-700 font-medium">
                                    <span className="font-black uppercase tracking-widest block mb-1">What is PowerSend?</span>
                                    PowerSend routes emails through your dedicated Smart Server infrastructure instead of your personal mailbox. 
                                    Traffic is distributed across nodes using reputation-weighted rotation, protecting your sender reputation and enabling high-volume delivery. 
                                    Your Sender Profile&#39;s &quot;From&quot; address is still used — only the SMTP relay changes.
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Server Selector — visible when PowerSend is enabled */}
                          <AnimatePresence>
                            {usePowerSend && (
                              <motion.div
                                initial={{ opacity: 0, height: 0, overflow: 'hidden' as any }}
                                animate={{ opacity: 1, height: 'auto', overflow: 'visible' as any, transition: { overflow: { delay: 0.3 } } }}
                                exit={{ opacity: 0, height: 0, overflow: 'hidden' as any }}
                              >
                                <div className="mt-4 space-y-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
                                    Smart Server{powerSendServers.length > 1 ? 's' : ''}
                                    {selectedServerIds.length > 1 && (
                                      <span className="ml-2 text-emerald-600 normal-case">({selectedServerIds.length} selected — will rotate)</span>
                                    )}
                                  </label>
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setShowServerDropdown(!showServerDropdown)}
                                      className="w-full px-5 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-emerald-300/30 transition-all outline-none text-left flex items-center justify-between"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Server className="w-4 h-4 text-emerald-600" />
                                        <span className="truncate">
                                          {selectedServerIds.length === 0 
                                            ? 'Select servers...'
                                            : selectedServerIds.length === 1
                                              ? powerSendServers.find(s => s.id === selectedServerIds[0])?.name || 'Selected'
                                              : `${selectedServerIds.length} servers selected`
                                          }
                                        </span>
                                      </div>
                                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showServerDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                      {showServerDropdown && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -4 }}
                                          className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden"
                                        >
                                          {/* Select All / Clear */}
                                          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                                            <button
                                              type="button"
                                              onClick={() => setSelectedServerIds(powerSendServers.map(s => s.id))}
                                              className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                                            >
                                              Select All
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setSelectedServerIds([])}
                                              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:underline"
                                            >
                                              Clear
                                            </button>
                                          </div>
                                          <div className="max-h-56 overflow-y-auto">
                                            {powerSendServers.length === 0 ? (
                                              <div className="px-5 py-4 text-sm text-gray-400">No available servers found</div>
                                            ) : (
                                              powerSendServers.map(server => {
                                                const isSelected = selectedServerIds.includes(server.id);
                                                return (
                                                  <button
                                                    key={server.id}
                                                    type="button"
                                                    onClick={() => {
                                                      setSelectedServerIds(prev => 
                                                        isSelected 
                                                          ? prev.filter(id => id !== server.id)
                                                          : [...prev, server.id]
                                                      );
                                                    }}
                                                    className={`w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                                                      isSelected ? 'bg-emerald-50' : ''
                                                    }`}
                                                  >
                                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                      isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'
                                                    }`}>
                                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <Server className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                    <div className="flex-1 min-w-0">
                                                      <p className={`text-sm font-bold truncate ${isSelected ? 'text-emerald-700' : 'text-[#101828]'}`}>
                                                        {server.name}
                                                      </p>
                                                      <p className="text-[10px] font-medium text-gray-400 truncate">
                                                        {server.provider} · {server.status === 'warming' ? 'Warming Up' : server.status} · Rep: {server.reputation_score ?? 100}
                                                      </p>
                                                    </div>
                                                  </button>
                                                );
                                              })
                                            )}
                                          </div>
                                          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                                            <Link
                                              href="/dashboard/powersend"
                                              className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest hover:underline"
                                            >
                                              Manage Servers →
                                            </Link>
                                            <button
                                              type="button"
                                              onClick={() => setShowServerDropdown(false)}
                                              className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                                            >
                                              Done
                                            </button>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  {selectedServerIds.length > 1 && (
                                    <div className="mt-2 pl-2">
                                      <p className="text-[10px] text-emerald-600 font-medium">
                                        Traffic will be distributed across selected servers using reputation-weighted rotation.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
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
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-[#745DF3]/10 text-[#745DF3] rounded-xl text-xs font-black">
                          {selectedLeadIds.length} Selected
                        </div>
                      </div>
                    </div>

                    {/* List Selector */}
                    <div className="mb-6 p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Contact List</label>
                      <div className="flex items-center gap-3">
                        <select
                          value={selectedListId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedListId(val || null);
                            setSelectedLeadIds([]);
                            setCurrentPage(1);
                          }}
                          className="flex-1 bg-white border border-gray-200 focus:border-[#745DF3] rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">All Contacts (no list filter)</option>
                          {lists.map(list => (
                            <option key={list.id} value={list.id}>{list.name} ({list.lead_count?.toLocaleString()} contacts)</option>
                          ))}
                        </select>
                        {!showNewListInput ? (
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewListInput(true);
                              setNewListName(campaignName || '');
                            }}
                            className="px-4 py-3 bg-[#745DF3] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shrink-0"
                          >
                            + New List
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="List name..."
                              value={newListName}
                              onChange={(e) => setNewListName(e.target.value)}
                              autoFocus
                              className="bg-white border border-gray-200 focus:border-[#745DF3] rounded-xl py-3 px-4 text-sm font-medium outline-none transition-all w-48"
                            />
                            <button
                              type="button"
                              disabled={!newListName.trim()}
                              onClick={async () => {
                                try {
                                  const res = await fetch('/api/lists', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ name: newListName.trim() }),
                                  });
                                  if (res.ok) {
                                    const list = await res.json();
                                    setLists(prev => [{ ...list, lead_count: 0 }, ...prev]);
                                    setSelectedListId(list.id);
                                    setNewListName('');
                                    setShowNewListInput(false);
                                    setSelectedLeadIds([]);
                                    showToast(`List "${list.name}" created`);
                                  } else {
                                    const err = await res.json();
                                    showToast(err.error || 'Failed to create list', 'error');
                                  }
                                } catch {
                                  showToast('Failed to create list', 'error');
                                }
                              }}
                              className="px-4 py-3 bg-[#745DF3] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
                            >
                              Create
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowNewListInput(false); setNewListName(''); }}
                              className="px-3 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:text-[#101828] transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      {selectedListId && (
                        <p className="mt-2 text-[10px] font-medium text-gray-400">Only contacts in this list will be shown below. The campaign will target this list.</p>
                      )}
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search leads by name, email, company or tag..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-[#745DF3]/20 transition-all text-[#101828]"
                        />
                      </div>
                      <div className="relative">
                        <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Filter by tag..."
                          value={tagFilter}
                          onChange={(e) => {
                            setTagFilter(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-[#745DF3]/20 transition-all text-[#101828] w-full md:w-[200px]"
                        />
                      </div>
                      <select
                        value={sourceFilter}
                        onChange={(e) => {
                          setSourceFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="px-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-black text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all cursor-pointer w-full md:w-[180px] appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                      >
                        <option value="">All Sources</option>
                        <option value="manual">Manual</option>
                        <option value="csv">CSV Import</option>
                        <option value="hubspot">HubSpot</option>
                        <option value="pipedrive">Pipedrive</option>
                        <option value="salesforce">Salesforce</option>
                      </select>
                    </div>

                    {/* Quick CSV Upload */}
                    <div className="mb-6">
                      {isUploadingCSV ? (
                        <div className="p-6 border-2 border-gray-100 rounded-2xl flex items-center gap-6 bg-gray-50/30">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                            <Loader2 className="w-5 h-5 text-[#745DF3] animate-spin" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#101828]">
                              {csvUploadProgress < 100 ? 'Importing Contacts...' : 'Import Complete!'}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                              {csvUploadStats.parsed > 0
                                ? `${csvUploadStats.parsed.toLocaleString()} parsed • ${csvUploadStats.imported.toLocaleString()} imported${csvUploadStats.errors > 0 ? ` • ${csvUploadStats.errors.toLocaleString()} failed` : ''}`
                                : 'Analyzing headers...'}
                            </p>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${csvUploadProgress}%` }}
                                className="h-full bg-[#745DF3] rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="p-5 border-2 border-dashed border-gray-100 hover:border-[#745DF3]/40 rounded-2xl flex items-center gap-4 cursor-pointer group transition-all bg-gray-50/30 hover:bg-[#745DF3]/5">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                            <Upload className="w-5 h-5 text-[#745DF3]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#101828] group-hover:text-[#745DF3] transition-colors">Upload CSV to import contacts</p>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Drop a CSV file with email, name, company columns — contacts are imported instantly</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCSVUpload(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 no-scrollbar relative min-h-[200px]">
                      {isLoadingLeads ? (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-[#745DF3] animate-spin" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading leads...</p>
                          </div>
                        </div>
                      ) : null}

                      {availableLeads.length === 0 && !isLoadingLeads ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                          <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">No contacts found</h3>
                          <p className="text-gray-400 text-xs font-medium mt-2">Upload a CSV above or <Link href="/dashboard/contacts" className="text-[#745DF3] font-black hover:underline">manage contacts</Link></p>
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
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-black text-[#101828]">{lead.first_name} {lead.last_name}</p>
                                  {lead.tags && lead.tags.length > 0 && (
                                    <div className="flex gap-1">
                                      {lead.tags.slice(0, 2).map((tag: string) => (
                                        <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-[8px] font-black text-gray-500 rounded-md uppercase tracking-wider">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">{lead.email}</p>
                                {lead.company && <p className="text-[9px] font-medium text-gray-400 mt-0.5">@{lead.company}</p>}
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
                    
                    {/* Simplified Pagination */}
                    {totalLeads > leadsPerPage && (
                      <div className="flex items-center justify-center gap-4 mt-8 pb-4">
                        <button
                          disabled={currentPage === 1 || isLoadingLeads}
                          onClick={() => setCurrentPage(prev => prev - 1)}
                          className="p-2 rounded-xl bg-gray-50 text-[#101828] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-all font-black text-xs uppercase"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Page {currentPage} of {Math.ceil(totalLeads / leadsPerPage)}
                        </span>
                        <button
                          disabled={currentPage >= Math.ceil(totalLeads / leadsPerPage) || isLoadingLeads}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          className="p-2 rounded-xl bg-gray-50 text-[#101828] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-all font-black text-xs uppercase"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-8 flex items-center justify-between pt-8 border-t border-gray-50">
                      <div className="flex items-center gap-4">
                        <button 
                           onClick={() => {
                             const newSelection = [...selectedLeadIds];
                             availableLeads.forEach(l => {
                               if (!newSelection.includes(l.id)) newSelection.push(l.id);
                             });
                             setSelectedLeadIds(newSelection);
                           }}
                           className="text-xs font-black text-gray-400 hover:text-[#745DF3] transition-all uppercase tracking-widest"
                        >
                           Select Page ({availableLeads.length})
                        </button>
                        <button 
                           disabled={isSelectingAll}
                           onClick={async () => {
                             if (isSelectingAll) return;
                             setIsSelectingAll(true);
                             setSelectAllProgress(0);
                             try {
                               // Fetch ALL lead IDs matching current filters (paginated, ids_only for speed)
                               const allIds: string[] = [];
                               let fetchPage = 1;
                               const PAGE_SIZE = 1000; // matches Supabase max_rows default
                               while (true) {
                                 const params = new URLSearchParams({
                                   ids_only: 'true',
                                   limit: String(PAGE_SIZE),
                                   page: String(fetchPage),
                                 });
                                 if (searchQuery) params.append('search', searchQuery);
                                 if (tagFilter) params.append('tag', tagFilter);
                                 if (sourceFilter) params.append('source', sourceFilter);
                                 if (selectedListId) params.append('list_id', selectedListId);
                                 
                                 const res = await fetch(`/api/leads?${params.toString()}`);
                                 const data = await res.json();
                                 const pageIds = (data.leads || []).map((l: any) => l.id);
                                 allIds.push(...pageIds);
                                 setSelectAllProgress(allIds.length);
                                 // If we got fewer than PAGE_SIZE, we've fetched everything
                                 if (pageIds.length < PAGE_SIZE) break;
                                 fetchPage++;
                               }
                               setSelectedLeadIds(allIds);
                               showToast(`Selected all ${allIds.length} matching leads`);
                             } catch (err) {
                               showToast("Failed to select all", "error");
                             } finally {
                               setIsSelectingAll(false);
                               setSelectAllProgress(0);
                             }
                           }}
                           className={`text-xs font-black transition-all uppercase tracking-widest ${
                             isSelectingAll 
                               ? 'text-gray-400 cursor-wait' 
                               : 'text-[#745DF3] hover:underline cursor-pointer'
                           }`}
                        >
                           {isSelectingAll 
                             ? `Selecting... ${selectAllProgress.toLocaleString()} / ${totalLeads.toLocaleString()}`
                             : `Select All Matching (${totalLeads.toLocaleString()})`
                           }
                        </button>
                      </div>
                      <button 
                         onClick={() => setSelectedLeadIds([])}
                         className="text-xs font-black text-gray-400 hover:text-red-500 transition-all uppercase tracking-widest"
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
                    {/* AI Assistance Bar */}
                    <div className="bg-gradient-to-r from-[#745DF3]/5 to-[#9281f7]/5 rounded-[2rem] border border-[#745DF3]/10 p-5 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-[#745DF3]/20 flex items-center justify-center text-[#745DF3] shadow-sm">
                             <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="text-xs font-black text-[#101828] uppercase tracking-wider">AI Writing Assistant</h4>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Optimize or generate your content</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <button 
                            onClick={handleAIOptimize}
                            disabled={isOptimizingAI || (!emailSteps[activeStepIndex]?.body && !emailSteps[activeStepIndex]?.subject)}
                            className={`px-4 py-2 bg-white text-[#745DF3] border border-[#745DF3]/20 rounded-xl text-[10px] font-black hover:border-[#745DF3] transition-all uppercase tracking-widest flex items-center gap-2 ${(!emailSteps[activeStepIndex]?.body && !emailSteps[activeStepIndex]?.subject) ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            {isOptimizingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Type className="w-3 h-3" />}
                            Suggest Improvements
                          </button>
                          <button 
                            onClick={() => setShowAiModal(true)}
                            className="px-4 py-2 bg-[#745DF3] text-white rounded-xl text-[10px] font-black hover:scale-105 transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#745DF3]/10"
                          >
                            <Sparkles className="w-3 h-3" />
                            AI Rewrite
                          </button>
                       </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                      {/* Editor Toolbar */}
                      <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Dynamic Variable Selector */}
                          <div className="relative group/vars">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#101828] rounded-lg text-[10px] font-black border border-gray-100 group-hover/vars:border-[#745DF3]/20 transition-all uppercase tracking-widest">
                              <UserPlus className="w-3.5 h-3.5 text-[#745DF3]" />
                              Insert Variable
                            </button>
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 opacity-0 invisible group-hover/vars:opacity-100 group-hover/vars:visible transition-all z-[60] max-h-64 overflow-y-auto no-scrollbar">
                              {(() => {
                                // Extract unique keys from available leads, excluding metadata
                                const skipKeys = ['id', 'org_id', 'created_at', 'status', 'last_contacted_at', 'updated_at', 'metadata', 'custom_fields'];
                                const dynamicKeys = new Set(['first_name', 'last_name', 'company', 'email']); // Defaults
                                
                                availableLeads.forEach(lead => {
                                  Object.keys(lead).forEach(key => {
                                    if (!skipKeys.includes(key)) dynamicKeys.add(key);
                                  });
                                  if (lead.custom_fields && typeof lead.custom_fields === 'object') {
                                    Object.keys(lead.custom_fields).forEach(key => dynamicKeys.add(key));
                                  }
                                });

                                return Array.from(dynamicKeys).map((key) => {
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
                                        // Restore cursor after variable insertion
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
                                });
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {(() => {
                            const spamWords = ['free', 'money', 'winner', 'cash', 'urgent', 'strictly', 'guarantee', 'click here', 'act now', 'limited time'];
                            const toxicWords = ['fuck', 'shit', 'asshole', 'bitch', 'idiot', 'scam', 'hate', 'stupid'];
                            
                            const curSubject = emailSteps[activeStepIndex]?.subject || '';
                            const curBody = emailSteps[activeStepIndex]?.body || '';
                            const subject = curSubject.toLowerCase();
                            const body = curBody.toLowerCase();
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
                            
                            return (
                              <div className="flex items-center gap-3">
                                {hasToxic ? (
                                  <span className="text-[10px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Risk: Toxic Content
                                  </span>
                                ) : hasSpam ? (
                                  <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                    Spam Score: Caution
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                    Spam Score: Safe
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Editor Inputs */}
                      <div className="flex-1 flex flex-col">
                        {(() => {
                          const curSubject = emailSteps[activeStepIndex]?.subject || '';
                          const curBody = emailSteps[activeStepIndex]?.body || '';
                          const missingVars = getMissingVariables(curSubject + ' ' + curBody);
                          
                          if (missingVars.length === 0) return null;
                          
                          return (
                            <div className="px-8 py-3 bg-red-50/50 border-b border-red-100 flex items-center justify-between animate-in slide-in-from-top duration-300">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                  <p className="text-[11px] font-black text-red-900 uppercase tracking-tight">Missing Data Warning</p>
                                  <p className="text-[10px] font-bold text-red-600/80">
                                    {missingVars.length === 1 
                                      ? `The variable {{${missingVars[0]}}} isn't in your contact list.` 
                                      : `${missingVars.length} variables aren't in your contact list: ${missingVars.map(v => `{{${v}}}`).join(', ')}`
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="px-3 py-1 bg-red-100 rounded-md text-[9px] font-black text-red-700 uppercase tracking-widest">
                                Action Required
                              </div>
                            </div>
                          );
                        })()}
                        <div className="px-8 py-6 border-b border-gray-100">
                          <input 
                            ref={subjectRef}
                            type="text" 
                            placeholder="Subject line..."
                            value={emailSteps[activeStepIndex]?.subject || ''}
                            onChange={(e) => updateStepContent(activeStepIndex, 'subject', e.target.value)}
                            onFocus={() => setLastFocusedField('subject')}
                            className="w-full bg-transparent text-xl font-black text-[#101828] placeholder:text-gray-200 outline-none"
                          />
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
                              <span className="text-xs font-bold text-gray-400">Sender Profile{selectedAccountIds.length > 1 ? 's' : ''}</span>
                              <span className={`text-xs font-black ${hasSendingMethod ? 'text-[#101828]' : 'text-red-400'}`}>
                                 {selectedAccountIds.length === 0 
                                   ? (usePowerSend ? 'Via PowerSend' : 'None selected')
                                   : selectedAccountIds.length === 1 
                                     ? accounts.find(a => a.id === selectedAccountIds[0])?.email || 'Selected'
                                     : `${selectedAccountIds.length} accounts (rotating)`
                                 }
                              </span>
                           </div>
                           <div className="flex justify-between py-2 border-b border-gray-50">
                              <span className="text-xs font-bold text-gray-400">Smart Sending</span>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isSmartSending ? 'text-emerald-500' : 'text-gray-400'}`}>
                                 {isSmartSending ? 'Enabled' : 'Disabled'}
                              </span>
                           </div>
                           <div className="flex justify-between py-2 border-b border-gray-50">
                              <span className="text-xs font-bold text-gray-400">PowerSend</span>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${usePowerSend ? 'text-emerald-500' : 'text-gray-400'}`}>
                                 {usePowerSend 
                                   ? (selectedServerIds.length === 1
                                       ? powerSendServers.find(s => s.id === selectedServerIds[0])?.name || 'Enabled'
                                       : `${selectedServerIds.length} servers (rotating)`)
                                   : 'Disabled'}
                              </span>
                           </div>
                           {!campaignName || !hasSendingMethod ? (
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

        {/* Action Bar */}
        <div className="bg-white border-t border-gray-100 px-8 py-4 z-20">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              {currentStep > 1 && (
                <button 
                  onClick={prevStep}
                  className="flex items-center gap-2 px-5 py-2.5 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-black transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous Step
                </button>
              )}
              <div className="h-4 w-[1px] bg-gray-100 hidden md:block" />
              <button 
                onClick={handleSaveDraft}
                className="px-6 py-2.5 text-xs font-black text-gray-400 hover:text-[#101828] transition-all uppercase tracking-widest"
              >
                Save as Draft
              </button>
            </div>

            <button 
              onClick={nextStep}
              disabled={isLaunching || (currentStep === steps.length && isLaunchDisabled)}
              className={`px-10 py-3 bg-[#745DF3] text-white rounded-2xl text-sm font-black shadow-xl shadow-[#745DF3]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 ${isLaunching || (currentStep === steps.length && isLaunchDisabled) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  {currentStep === steps.length ? (
                    <>
                      <Check className="w-4 h-4" />
                      Launch Campaign
                    </>
                  ) : (
                    <>
                      Continue to Next Step
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </>
              )}
            </button>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Tone</label>
                    <select 
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none appearance-none"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Casual">Casual</option>
                      <option value="Direct">Direct</option>
                      <option value="Witty">Witty</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Company Context</label>
                    <input 
                      type="text"
                      value={aiCompanyInfo}
                      onChange={(e) => setAiCompanyInfo(e.target.value)}
                      placeholder="e.g. LeadFlow AI"
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none"
                    />
                  </div>
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

      {/* AI Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && aiPreview && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreviewModal(false)}
              className="absolute inset-0 bg-[#101828]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#745DF3] flex items-center justify-center text-white shadow-xl shadow-[#745DF3]/20">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#101828]">Review AI Suggestions</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Powered by Unibox AI</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Original content */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Original Version</h4>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[9px] font-black uppercase tracking-widest">Current</span>
                  </div>
                  <div className="space-y-4 opacity-50">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Subject</p>
                      <p className="text-sm font-bold text-[#101828]">{emailSteps[activeStepIndex]?.subject || '(No subject)'}</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 min-h-[200px]">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Body</p>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">{emailSteps[activeStepIndex]?.body || '(No content)'}</p>
                    </div>
                  </div>
                </div>

                {/* AI Improved version */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-[#745DF3] uppercase tracking-[0.2em]">AI Improved Version</h4>
                    <span className="px-3 py-1 bg-[#745DF3]/10 text-[#745DF3] rounded-full text-[9px] font-black uppercase tracking-widest">Recommended</span>
                  </div>
                  <div className="space-y-4">
                    {aiPreview.recommendation && (
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">AI Strategist Note</p>
                        </div>
                        <p className="text-[11px] font-bold text-emerald-900 leading-relaxed italic">
                          "{aiPreview.recommendation}"
                        </p>
                      </div>
                    )}
                    <div className="p-6 bg-[#745DF3]/5 rounded-2xl border border-[#745DF3]/20 shadow-sm relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-all">
                          <Check className="w-4 h-4 text-[#745DF3]" />
                       </div>
                      <p className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest mb-1">Subject</p>
                      <p className="text-sm font-bold text-[#101828]">{aiPreview.subject}</p>
                    </div>
                    <div className="p-6 bg-[#745DF3]/5 rounded-3xl border border-[#745DF3]/20 shadow-sm min-h-[200px] relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-all">
                          <Check className="w-4 h-4 text-[#745DF3]" />
                       </div>
                      <p className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest mb-1">Body</p>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">{aiPreview.body}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-10 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      if (previewSource === 'generate') handleGenerateAI();
                      else handleAIOptimize();
                    }}
                    disabled={isGeneratingAI || isOptimizingAI}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-[#101828] rounded-2xl text-xs font-black hover:border-[#745DF3] transition-all"
                  >
                    <RotateCcw className={`w-4 h-4 ${(isGeneratingAI || isOptimizingAI) ? 'animate-spin' : ''}`} />
                    Redo Generation
                  </button>
                  <button 
                    onClick={() => setShowPreviewModal(false)}
                    className="text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-all"
                  >
                    Discard Changes
                  </button>
                </div>

                <button 
                  onClick={() => {
                    updateStepContent(activeStepIndex, 'subject', aiPreview.subject);
                    updateStepContent(activeStepIndex, 'body', aiPreview.body);
                    setShowPreviewModal(false);
                    setAiPreview(null);
                  }}
                  className="flex items-center gap-2 px-10 py-4 bg-[#745DF3] text-white rounded-2xl text-sm font-black shadow-xl shadow-[#745DF3]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Check className="w-4 h-4" />
                  Accept & Apply Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className={`px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 min-w-[320px] backdrop-blur-xl border ${
              toast.type === 'success' 
                ? 'bg-emerald-500/90 border-emerald-400 text-white' 
                : 'bg-red-500/90 border-red-400 text-white'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                {toast.type === 'success' 
                  ? <CheckCircle2 className="w-6 h-6 text-white" /> 
                  : <AlertCircle className="w-6 h-6 text-white" />
                }
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
                  {toast.type === 'success' ? 'Success' : 'Attention'}
                </p>
                <p className="text-sm font-bold">{toast.msg}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
