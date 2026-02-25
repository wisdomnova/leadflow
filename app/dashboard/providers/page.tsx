'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import SMTPModal from '@/components/dashboard/SMTPModal';
import DNSGuideModal from '@/components/dashboard/DNSGuideModal';
import ConfirmModal from '@/components/dashboard/ConfirmModal';
import { 
  Plus, 
  Info, 
  CheckCircle2, 
  Mail, 
  ShieldCheck, 
  Settings2, 
  ChevronRight,
  Send,
  AlertCircle,
  Link2,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  Globe,
  Loader2,
  Activity,
  FileText,
  MailPlus,
  Upload,
  X
} from 'lucide-react';

const providerTypes = [
  {
    id: 'google',
    name: 'Google Mail',
    description: 'Connect your Gmail or Google Workspace accounts via OAuth 2.0.',
    icon: 'https://cdn-icons-png.flaticon.com/512/732/732200.png',
    color: 'bg-[#4285F4]/10',
    borderColor: 'border-[#4285F4]/20'
  },
  {
    id: 'microsoft',
    name: 'Outlook / 365',
    description: 'Connect your Microsoft 365 or Outlook.com accounts via OAuth 2.0.',
    icon: 'https://cdn-icons-png.flaticon.com/512/732/732221.png',
    color: 'bg-[#0078D4]/10',
    borderColor: 'border-[#0078D4]/20'
  }
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, { bg: string, text: string, icon: any }> = {
    verified: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
    healthy: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 },
    pending: { bg: 'bg-orange-50', text: 'text-orange-600', icon: RefreshCw },
    missing: { bg: 'bg-red-50', text: 'text-red-600', icon: AlertCircle },
    failed: { bg: 'bg-red-50', text: 'text-red-600', icon: AlertCircle },
    warning: { bg: 'bg-amber-50', text: 'text-amber-600', icon: AlertCircle },
  };

  const config = styles[status] || styles.pending;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${config.bg} rounded-xl border border-white/50 whitespace-nowrap`}>
      <Icon className={`w-3 h-3 ${config.text} ${status === 'pending' ? 'animate-spin' : ''}`} />
      <span className={`text-[10px] font-black uppercase tracking-widest ${config.text}`}>{status}</span>
    </div>
  );
};

export default function EmailProvidersPage() {
  const [activeTab, setActiveTab] = useState<'connect' | 'diagnostics' | 'domains'>('connect');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [newSelector, setNewSelector] = useState('sig1');
  const [newTracking, setNewTracking] = useState('');
  const [selectedSender, setSelectedSender] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState<string | null>(null);
  const [isSMTPModalOpen, setIsSMTPModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [isDNSGuideOpen, setIsDNSGuideOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [domainSearch, setDomainSearch] = useState('');

  // SMTP Provider Defaults state
  const [smtpProviders, setSmtpProviders] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [bulkImportMode, setBulkImportMode] = useState<'provider' | 'custom'>('provider');
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '', smtpHost: '', smtpPort: '587', smtpSecurity: 'STARTTLS',
    imapHost: '', imapPort: '993', imapSecurity: 'SSL/TLS', isDefault: false
  });
  const [isSavingProvider, setIsSavingProvider] = useState(false);

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    show: boolean;
    type: 'account' | 'domain' | null;
    id: string | null;
    name: string;
  }>({
    show: false,
    type: null,
    id: null,
    name: ''
  });

  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [accountsRes, domainsRes, diagnosticsRes, providersRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/domains'),
        fetch('/api/diagnostics'),
        fetch('/api/accounts/smtp-providers')
      ]);
      
      if (accountsRes.ok) setAccounts(await accountsRes.json());
      if (domainsRes.ok) setDomains(await domainsRes.json());
      if (diagnosticsRes.ok) setDiagnostics(await diagnosticsRes.json());
      if (providersRes.ok) {
        const providers = await providersRes.json();
        setSmtpProviders(providers);
        // Auto-select the default provider
        const defaultProvider = providers.find((p: any) => p.is_default);
        if (defaultProvider) setSelectedProviderId(defaultProvider.id);
        else if (providers.length > 0) setSelectedProviderId(providers[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async (id: string) => {
    try {
      const res = await fetch(`/api/domains/${id}/verify`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setDomains(prev => prev.map(d => 
          d.id === id ? { 
            ...d, 
            spf_status: result.results.spf ? 'verified' : 'failed',
            dkim_status: result.results.dkim ? 'verified' : 'failed',
            dmarc_status: result.results.dmarc ? 'verified' : 'failed',
            tracking_status: result.results.tracking ? 'verified' : 'failed'
          } : d
        ));
      }
    } catch (err) {
      console.error("Verify domain error:", err);
    }
  };

  const handleRunDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSender) return showToast("Select a sender", "error");
    setIsTesting(true);
    
    try {
      const res = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: selectedSender,
          subject: "Seed Placement Test",
          bodyHtml: "<p>This is a test outreach email to verify inbox placement. Please ignore.</p>"
        })
      });

      if (res.ok) {
        const newDiag = await res.json();
        setDiagnostics([newDiag, ...diagnostics]);
      }
    } catch (err) {
      console.error("Run diagnostic error:", err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleVerifyDiagnostic = async (id: string) => {
    try {
      const res = await fetch(`/api/diagnostics/${id}/verify`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setDiagnostics(prev => prev.map(d => d.id === updated.id ? updated : d));
      }
    } catch (err) {
      console.error("Verify diagnostic error:", err);
    }
  };

  const handleConnectProvider = async (name: string) => {
    setIsAddingAccount(name);
    
    // Determine the OAuth route based on the provider name
    const providerKey = name.toLowerCase().includes('google') ? 'gmail' : 'outlook';
    
    // Redirect to our internal API route which handles the state and initial OAuth redirect
    window.location.href = `/api/auth/oauth/${providerKey}`;
  };

  const handleConnectSMTP = async (data: any) => {
    try {
      const body: any = {
        email: data.email,
        provider: 'custom_smtp',
        config: data
      };
      if (data.smtp_provider_id) {
        body.smtp_provider_id = data.smtp_provider_id;
      }
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const newAcc = await res.json();
        setAccounts(prev => [newAcc, ...prev]);
        setIsSMTPModalOpen(false);
        showToast("SMTP Account connected successfully!");
      } else {
        const err = await res.json();
        if (res.status === 409) {
          showToast(`Duplicate Account: ${err.error}`, "error");
        } else {
          showToast(err.error || "Failed to connect SMTP", "error");
        }
      }
    } catch (err) {
      console.error("Connect SMTP error:", err);
      showToast("Failed to connect SMTP account", "error");
    }
  };

  // --- Bulk CSV Import ---
  const handleBulkCSVPreview = (text: string) => {
    setBulkCsvText(text);
    try {
      const lines = text.trim().split('\n');
      if (lines.length < 2) { setBulkPreview([]); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
      }).filter(r => r['email'] || r['email_address']);
      setBulkPreview(preview);
    } catch {
      setBulkPreview([]);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkCsvText.trim()) return;
    if (bulkImportMode === 'provider' && !selectedProviderId) {
      showToast('Select an SMTP provider preset first', 'error');
      return;
    }
    try {
      setIsBulkImporting(true);
      const body: any = { csv: bulkCsvText };
      if (bulkImportMode === 'provider' && selectedProviderId) {
        body.providerId = selectedProviderId;
      }
      const res = await fetch('/api/accounts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Bulk import failed');
      }
      showToast(result.message || `Imported ${result.imported} accounts`);
      setIsBulkModalOpen(false);
      setBulkCsvText('');
      setBulkPreview([]);
      await fetchData();
    } catch (err: any) {
      console.error('Bulk import error:', err);
      showToast(err.message || 'Bulk import failed', 'error');
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleBulkFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (ev) => handleBulkCSVPreview(ev.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => handleBulkCSVPreview(ev.target?.result as string);
      reader.readAsText(file);
    }
  };

  // --- SMTP Provider Presets ---
  const handleSaveProvider = async () => {
    if (!newProvider.name || !newProvider.smtpHost || !newProvider.imapHost) {
      showToast('Name, SMTP Host, and IMAP Host are required', 'error');
      return;
    }
    setIsSavingProvider(true);
    try {
      const res = await fetch('/api/accounts/smtp-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save provider');
      }
      const saved = await res.json();
      setSmtpProviders(prev => [...prev, saved]);
      if (saved.is_default || smtpProviders.length === 0) setSelectedProviderId(saved.id);
      setNewProvider({ name: '', smtpHost: '', smtpPort: '587', smtpSecurity: 'STARTTLS', imapHost: '', imapPort: '993', imapSecurity: 'SSL/TLS', isDefault: false });
      setIsAddProviderOpen(false);
      showToast('Provider preset saved!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setIsSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/smtp-providers?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSmtpProviders(prev => prev.filter(p => p.id !== id));
      if (selectedProviderId === id) setSelectedProviderId('');
      showToast('Provider preset deleted');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const sampleCsvModeA = `email,password,from_name\njohn@company.com,SecurePass123,John Smith\njane@company.com,SecurePass456,Jane Doe\nmike@company.com,SecurePass789,Mike Johnson`;
  const sampleCsvModeB = `email,smtp_host,smtp_port,smtp_user,smtp_pass,imap_host,imap_port,imap_user,imap_pass\njohn@company.com,smtp.company.com,587,john@company.com,pass123,imap.company.com,993,john@company.com,pass123\njane@company.com,smtp.company.com,587,jane@company.com,pass456,imap.company.com,993,jane@company.com,pass456`;

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domainName: newDomain,
          dkimSelector: newSelector,
          trackingDomain: newTracking
        })
      });

      if (res.ok) {
        const domainObj = await res.json();
        setDomains([domainObj, ...domains]);
        setNewDomain('');
        setNewTracking('');
        showToast("Domain added successfully!");
      } else {
        const err = await res.json();
        showToast(err.message || err.error || "Failed to add domain", "error");
      }
    } catch (err) {
      console.error("Add domain error:", err);
      showToast("Something went wrong", "error");
    }
  };

  const handleCheckAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}/test`, { method: 'POST' });
      const result = await res.json();
      
      if (res.ok) {
        setAccounts(prev => prev.map(acc => 
          acc.id === id ? { ...acc, status: result.success ? 'active' : 'error' } : acc
        ));
        if (!result.success) showToast(`Connection failed: ${result.error}`, "error");
        else showToast("Connection verified successfully!");
      }
    } catch (err) {
      console.error("Check account error:", err);
      showToast("Verification failed", "error");
    }
  };

  const handleDeleteAccount = async (id: string, email: string) => {
    setDeleteConfirmModal({ show: true, type: 'account', id, name: email });
  };

  const handleDeleteDomain = async (id: string, domainName: string) => {
    setDeleteConfirmModal({ show: true, type: 'domain', id, name: domainName });
  };

  const executeDelete = async () => {
    if (!deleteConfirmModal.id || !deleteConfirmModal.type) return;

    try {
      const endpoint = deleteConfirmModal.type === 'account' 
        ? `/api/accounts/${deleteConfirmModal.id}` 
        : `/api/domains/${deleteConfirmModal.id}`;
        
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        if (deleteConfirmModal.type === 'account') {
          setAccounts(accounts.filter(a => a.id !== deleteConfirmModal.id));
          showToast('Sender profile deleted successfully', 'success');
        } else {
          setDomains(domains.filter(d => d.id !== deleteConfirmModal.id));
          showToast('Domain deleted successfully', 'success');
        }
      } else {
        showToast(data.error || `Failed to delete ${deleteConfirmModal.type}`, 'error');
      }
    } catch (err) {
      console.error(`Delete ${deleteConfirmModal.type} error:`, err);
      showToast(`An unexpected error occurred while deleting`, 'error');
    } finally {
      setDeleteConfirmModal({ show: false, type: null, id: null, name: '' });
    }
  };

  const filteredDomains = domains.filter(d => 
    d.domain_name.toLowerCase().includes(domainSearch.toLowerCase())
  );


  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-[1200px] mx-auto space-y-10">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-black text-[#101828] tracking-tight">Email Providers</h1>
              <p className="text-gray-500 font-medium mt-1">Manage your sending accounts, verify domains, and run deliverability tests.</p>
            </div>

            {/* Custom Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100/50 rounded-2xl w-fit">
              {[
                { id: 'connect', label: 'Connect Accounts', icon: Link2 },
                { id: 'domains', label: 'Sending Domains', icon: ShieldCheck },
                { id: 'diagnostics', label: 'Seed Diagnostics', icon: Mail }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-[#101828] shadow-sm' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#745DF3]' : ''}`} />
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'connect' && (
                <motion.div
                  key="connect"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* OAuth Providers */}
                      {providerTypes.map((provider) => (
                        <div key={provider.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center group hover:shadow-xl transition-all shadow-[#101828]/5 relative overflow-hidden">
                          <div className={`w-20 h-20 ${provider.color} ${provider.borderColor} border rounded-[1.5rem] flex items-center justify-center mb-6`}>
                            <img src={provider.icon} alt={provider.name} className="w-10 h-10 object-contain" />
                          </div>
                          <h3 className="text-xl font-black text-[#101828] mb-2">{provider.name}</h3>
                          <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
                            {provider.description}
                          </p>
                          <button 
                            onClick={() => handleConnectProvider(provider.name)}
                            disabled={isAddingAccount !== null}
                            className="w-full py-4 bg-[#FBFBFB] hover:bg-[#101828] hover:text-white border border-gray-100 text-[#101828] rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isAddingAccount === provider.name ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                Connect Account
                                <ChevronRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      ))}

                      {/* SMTP Manual */}
                      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center hover:border-[#745DF3]/40 transition-all cursor-pointer group"
                        onClick={() => setIsSMTPModalOpen(true)}
                      >
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#745DF3]/5 transition-colors">
                          <Settings2 className="w-8 h-8 text-gray-300 group-hover:text-[#745DF3]" />
                        </div>
                        <h3 className="text-xl font-black text-[#101828] mb-2">Custom SMTP</h3>
                        <p className="text-sm text-gray-400 font-medium mb-8 leading-relaxed">
                          Enter your SMTP & IMAP details manually for any other provider.
                        </p>
                        <button 
                          onClick={() => setIsSMTPModalOpen(true)}
                          className="px-8 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:text-[#101828] hover:border-[#101828] transition-all"
                        >
                          Setup Manually
                        </button>
                      </div>
                    </div>

                    {/* Bulk CSV Import - Full Width */}
                    <div 
                      className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col md:flex-row items-center justify-between text-center md:text-left hover:border-emerald-300 transition-all cursor-pointer group gap-8"
                      onClick={() => setIsBulkModalOpen(true)}
                    >
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors border border-emerald-100 shrink-0">
                          <Upload className="w-8 h-8 text-emerald-400 group-hover:text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-[#101828] mb-1">Bulk CSV Import</h3>
                          <p className="text-sm text-gray-400 font-medium leading-relaxed">
                            Upload a CSV to add multiple SMTP accounts at once. Perfect for agencies.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsBulkModalOpen(true); }}
                        className="px-8 py-4 bg-emerald-500 text-white rounded-2xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 shrink-0"
                      >
                        Import Accounts
                      </button>
                    </div>

                    {/* SMTP Provider Presets */}
                    {smtpProviders.length > 0 && (
                      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-[#FBFBFB]/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#745DF3]/10 rounded-2xl flex items-center justify-center">
                              <Settings2 className="w-5 h-5 text-[#745DF3]" />
                            </div>
                            <div>
                              <h2 className="text-lg font-black text-[#101828] tracking-tight">SMTP Provider Presets</h2>
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Reusable host/port configurations</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsAddProviderOpen(true)}
                            className="px-4 py-2 bg-[#745DF3] text-white rounded-xl text-xs font-bold hover:bg-[#6347E0] transition-colors flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Preset
                          </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {smtpProviders.map((sp: any) => (
                            <div key={sp.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#FBFBFB]/50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                                  <Globe className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-[#101828]">{sp.name}</span>
                                    {sp.is_default && (
                                      <span className="text-[9px] font-black uppercase tracking-widest text-[#745DF3] bg-[#745DF3]/10 px-2 py-0.5 rounded-lg">Default</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                                    SMTP: {sp.smtp_host}:{sp.smtp_port} · IMAP: {sp.imap_host}:{sp.imap_port}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-medium">{sp.account_count || 0} accounts</span>
                                <button
                                  onClick={() => handleDeleteProvider(sp.id)}
                                  className="w-8 h-8 rounded-xl hover:bg-red-50 flex items-center justify-center transition-colors group"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-500" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connected Accounts List */}
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-[#FBFBFB]/30">
                      <div>
                        <h2 className="text-xl font-black text-[#101828] tracking-tight">Connected Accounts</h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Manage your active senders</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{accounts.length} Active Accounts</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#FBFBFB]/50 border-b border-gray-50">
                            <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Email Address</th>
                            <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                            <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Last Sync</th>
                            <th className="px-8 py-4 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          <AnimatePresence mode="popLayout">
                            {accounts.length > 0 ? accounts.map((account) => (
                              <motion.tr 
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                key={account.id} 
                                className="group hover:bg-[#FBFBFB]/50 transition-colors"
                              >
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1.5">
                                      <img 
                                        src={account.provider === 'google' ? 'https://cdn-icons-png.flaticon.com/512/732/732200.png' : 'https://cdn-icons-png.flaticon.com/512/732/732221.png'} 
                                        className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all" 
                                        alt={account.provider} 
                                      />
                                    </div>
                                    <span className="font-black text-[#101828] text-sm group-hover:text-[#745DF3] transition-colors">{account.email}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-xs font-bold text-gray-500 uppercase">{account.provider}</span>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${account.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${account.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>{account.status}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {new Date(account.created_at).toLocaleDateString()}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => handleCheckAccount(account.id)}
                                      className="p-2.5 text-gray-400 hover:text-[#745DF3] hover:bg-[#745DF3]/5 rounded-xl transition-all"
                                      title="Test Connection"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteAccount(account.id, account.email)}
                                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>
                            )) : (
                              <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center max-w-xs mx-auto"
                                  >
                                    <div className="w-16 h-16 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6">
                                      <MailPlus className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-black text-[#101828] mb-2">No accounts connected</h3>
                                    <p className="text-sm text-gray-400 font-medium mb-8 leading-relaxed">
                                      Connect your first email provider above to start sending sequences.
                                    </p>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'domains' && (
                <motion.div
                  key="domains"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-10 rounded-[3rem] border border-gray-100 relative overflow-hidden shadow-sm">
                    <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
                      <div className="flex-1 space-y-6">
                        <div>
                          <h2 className="text-2xl font-black text-[#101828] tracking-tight">Verify Sending Domain</h2>
                          <p className="text-gray-500 font-medium mt-1">Proper DNS setup is the foundation of high deliverability.</p>
                        </div>
                        
                        <form onSubmit={handleAddDomain} className="space-y-4">
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative flex-1 w-full">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="text" 
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                placeholder="e.g. outreach.acmecorp.com"
                                className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent focus:border-[#745DF3] focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all shadow-inner"
                              />
                            </div>
                            <button 
                              type="submit"
                              className="w-full sm:w-auto px-10 py-4 bg-[#101828] text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 whitespace-nowrap active:scale-95"
                            >
                              <Plus className="w-5 h-5" />
                              Add Domain
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Selector</span>
                              <input 
                                type="text" 
                                value={newSelector}
                                onChange={(e) => setNewSelector(e.target.value)}
                                className="w-full pl-24 pr-4 py-3 bg-gray-50 border border-transparent focus:border-[#745DF3] rounded-xl text-xs font-bold outline-none"
                              />
                            </div>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tracking</span>
                              <input 
                                type="text" 
                                value={newTracking}
                                onChange={(e) => setNewTracking(e.target.value)}
                                placeholder="track.domain.com"
                                className="w-full pl-24 pr-4 py-3 bg-gray-50 border border-transparent focus:border-[#745DF3] rounded-xl text-xs font-bold outline-none"
                              />
                            </div>
                          </div>
                        </form>

                        <div className="flex flex-wrap gap-3">
                          {['SPF', 'DKIM', 'DMARC', 'Custom Tracking'].map((tag) => (
                            <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tag} Support</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="w-full lg:w-80 bg-[#101828] p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#745DF3]/20 blur-3xl -mr-16 -mt-16 rounded-full" />
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Optimization Tip</span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed font-medium">
                            We recommend using a <span className="text-white font-black underline decoration-[#745DF3] decoration-2">separate subdomain</span> for outreach to protect your root domain's reputation.
                          </p>
                          <button 
                            onClick={() => setIsDNSGuideOpen(true)}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Read DNS Guide
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Domain List Table */}
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FBFBFB]/30">
                      <div>
                        <h2 className="text-xl font-black text-[#101828] tracking-tight">Active Domains</h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Real-time DNS status monitoring</p>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="text"
                          value={domainSearch}
                          onChange={(e) => setDomainSearch(e.target.value)}
                          placeholder="Search domains..."
                          className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#745DF3]/10 outline-none w-64"
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#FBFBFB]/50 border-b border-gray-50">
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Domain Name</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">SPF</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">DKIM</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">DMARC</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Tracking</th>
                            <th className="px-8 py-5 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          <AnimatePresence mode="popLayout">
                            {filteredDomains.length > 0 ? (
                              filteredDomains.map((domain) => (
                                <motion.tr 
                                  layout
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  key={domain.id} 
                                  className="hover:bg-[#FBFBFB]/50 transition-colors group"
                                >
                                  <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                      <span className="font-black text-[#101828] text-sm group-hover:text-[#745DF3] transition-colors">{domain.domain_name}</span>
                                      <div className="flex items-center gap-1 mt-1">
                                        <Link2 className="w-2.5 h-2.5 text-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Redirect Active</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                    <StatusBadge status={domain.spf_status} />
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                    <StatusBadge status={domain.dkim_status} />
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                    <StatusBadge status={domain.dmarc_status} />
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <StatusBadge status={domain.tracking_status} />
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button 
                                        onClick={() => handleVerifyDomain(domain.id)}
                                        className="p-2 text-gray-400 hover:text-[#745DF3] hover:bg-[#745DF3]/5 rounded-lg transition-all" 
                                        title="Verify DNS Records"
                                      >
                                        <RefreshCw className="w-4 h-4" />
                                      </button>
                                      <button className="p-2 text-gray-400 hover:text-[#745DF3] hover:bg-[#745DF3]/5 rounded-lg transition-all" title="View DNS Records">
                                        <FileText className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteDomain(domain.id, domain.domain_name)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))
                            ) : (
                              <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <td colSpan={6} className="px-8 py-20">
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-[#F9FAFB] rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                      <ShieldCheck className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-[#101828] font-black text-lg mb-1  uppercase tracking-tight">No domains connected</h3>
                                    <p className="text-gray-500 text-sm font-medium max-w-[280px]">
                                      {domainSearch 
                                        ? "No domains match your current search criteria."
                                        : "Add a sending domain to manage your DNS records and deliverability."}
                                    </p>
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'diagnostics' && (
                <motion.div
                  key="diagnostics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="bg-[#101828] p-10 rounded-[3rem] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#745DF3]/10 blur-[120px] rounded-full -mr-64 -mt-64" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
                      <div className="flex-1 space-y-6">
                        <div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#745DF3]/20 text-[#9B8AFB] rounded-full border border-[#745DF3]/30 mb-4">
                            <Activity className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Seed List Testing</span>
                          </div>
                          <h2 className="text-3xl font-black tracking-tight text-white">Placement Diagnostics</h2>
                          <p className="text-gray-400 font-medium mt-2 max-w-xl">
                            Send a test email to our globally distributed seed list to see exactly where your messages land across major providers.
                          </p>
                        </div>

                        <form onSubmit={handleRunDiagnostic} className="flex flex-col sm:flex-row items-center gap-3">
                          <div className="relative flex-1 w-full sm:w-64">
                            <select 
                              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:border-[#745DF3] transition-all appearance-none cursor-pointer text-white"
                              value={selectedSender}
                              onChange={(e) => setSelectedSender(e.target.value)}
                            >
                              <option value="" disabled className="bg-[#101828]">Select Sender...</option>
                              {accounts.map(acc => (
                                <option key={acc.id} value={acc.id} className="bg-[#101828]">{acc.email}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                          </div>
                          <button 
                            disabled={isTesting}
                            type="submit"
                            className="w-full sm:w-auto px-10 py-4 bg-[#745DF3] text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-[#745DF3]/90 transition-all shadow-xl shadow-[#745DF3]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                          >
                            {isTesting ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                            {isTesting ? 'Sending Tests...' : 'Run New Test'}
                          </button>
                        </form>
                      </div>

                        <div className="grid grid-cols-2 gap-4 w-full lg:w-[400px]">
                        {[
                          { 
                            label: 'Inbox Rate', 
                            value: diagnostics[0] ? Math.round((diagnostics[0].inbox_count / diagnostics[0].total_seeds) * 100) + '%' : '0%', 
                            color: 'text-emerald-400' 
                          },
                          { 
                            label: 'Spam Rate', 
                            value: diagnostics[0] ? Math.round((diagnostics[0].spam_count / diagnostics[0].total_seeds) * 100) + '%' : '0%', 
                            color: 'text-orange-400' 
                          },
                          { 
                            label: 'Promotions', 
                            value: diagnostics[0] ? Math.round((diagnostics[0].promotions_count / diagnostics[0].total_seeds) * 100) + '%' : '0%', 
                            color: 'text-gray-400' 
                          },
                          { 
                            label: 'Active Seeds', 
                            value: diagnostics[0]?.total_seeds?.toString() || '5', 
                            color: 'text-[#745DF3]' 
                          }
                        ].map((stat) => (
                          <div key={stat.label} className="p-5 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {diagnostics.length > 0 ? (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-gray-50 bg-[#FBFBFB]/30 flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-black text-[#101828]">Recent Test Results</h3>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Placement analysis by diagnostic run</p>
                        </div>
                        <button 
                          onClick={fetchData}
                          className="p-3 text-gray-400 hover:text-[#745DF3] transition-all"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50/50">
                              <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                              <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Sender</th>
                              <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Inbox</th>
                              <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Spam</th>
                              <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                              <th className="px-8 py-4 text-right"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {diagnostics.map((diag) => (
                              <tr key={diag.id} className="group hover:bg-[#FBFBFB]/50 transition-colors">
                                <td className="px-8 py-6">
                                  <span className="text-xs font-bold text-[#101828]">
                                    {new Date(diag.created_at).toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-xs text-gray-500 font-medium">{diag.sender?.email}</span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">
                                    {Math.round((diag.inbox_count / diag.total_seeds) * 100)}%
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                  <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-black">
                                    {Math.round((diag.spam_count / diag.total_seeds) * 100)}%
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <StatusBadge status={diag.status} />
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <button 
                                    onClick={() => handleVerifyDiagnostic(diag.id)}
                                    className="p-2 text-gray-400 hover:text-[#745DF3] hover:bg-[#745DF3]/5 rounded-lg transition-all"
                                    title="Fetch Results"
                                  >
                                    <RefreshCw className={`w-4 h-4 ${diag.status === 'polling' ? 'animate-spin' : ''}`} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-[#F9FAFB] rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                          <Activity className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-[#101828] font-black text-lg mb-1  uppercase tracking-tight">No diagnostics yet</h3>
                        <p className="text-gray-500 text-sm font-medium max-w-[280px]">
                          Run a seed test to check your inbox placement and deliverability performance.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <SMTPModal 
        isOpen={isSMTPModalOpen}
        onClose={() => setIsSMTPModalOpen(false)}
        onConnect={handleConnectSMTP}
      />

      {/* Bulk CSV Import Modal */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { setIsBulkModalOpen(false); setBulkCsvText(''); setBulkPreview([]); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#101828] border border-gray-800 rounded-[32px] p-8 w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Bulk CSV Import</h3>
                    <p className="text-sm text-gray-400">Import multiple SMTP accounts at once</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsBulkModalOpen(false); setBulkCsvText(''); setBulkPreview([]); }}
                  className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Import Mode Toggle */}
              <div className="flex gap-2 mb-6 bg-gray-900/50 rounded-2xl p-1.5 border border-gray-800">
                <button
                  onClick={() => { setBulkImportMode('provider'); setBulkCsvText(''); setBulkPreview([]); }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all ${
                    bulkImportMode === 'provider'
                      ? 'bg-[#745DF3] text-white shadow-lg shadow-[#745DF3]/20'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Use Provider Defaults
                </button>
                <button
                  onClick={() => { setBulkImportMode('custom'); setBulkCsvText(''); setBulkPreview([]); }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all ${
                    bulkImportMode === 'custom'
                      ? 'bg-[#745DF3] text-white shadow-lg shadow-[#745DF3]/20'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Custom Per Account
                </button>
              </div>

              {/* Mode A: Provider Selection */}
              {bulkImportMode === 'provider' && (
                <div className="mb-6 space-y-3">
                  {smtpProviders.length > 0 ? (
                    <div>
                      <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest">Select SMTP Provider Preset</label>
                      <select
                        value={selectedProviderId}
                        onChange={(e) => setSelectedProviderId(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-[#745DF3]/50 transition-colors appearance-none"
                      >
                        <option value="">— Select a provider preset —</option>
                        {smtpProviders.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.smtp_host}:{p.smtp_port} {p.is_default ? '(Default)' : ''}
                          </option>
                        ))}
                      </select>
                      {selectedProviderId && (() => {
                        const sp = smtpProviders.find((p: any) => p.id === selectedProviderId);
                        return sp ? (
                          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 mt-2">
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest">
                              <div><span className="text-gray-500">SMTP:</span> <span className="text-emerald-400 font-mono">{sp.smtp_host}:{sp.smtp_port}</span></div>
                              <div><span className="text-gray-500">Security:</span> <span className="text-gray-300">{sp.smtp_security}</span></div>
                              <div><span className="text-gray-500">IMAP:</span> <span className="text-emerald-400 font-mono">{sp.imap_host}:{sp.imap_port}</span></div>
                              <div><span className="text-gray-500">Security:</span> <span className="text-gray-300">{sp.imap_security}</span></div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 text-center">
                      <Settings2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 font-bold mb-1">No SMTP provider presets yet</p>
                      <p className="text-xs text-gray-500 mb-3 font-medium">Create a preset to store host/port settings once, then import accounts with just credentials.</p>
                      <button
                        onClick={() => setIsAddProviderOpen(true)}
                        className="px-4 py-2 bg-[#745DF3] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#6347E0] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 inline mr-1" />
                        Create Provider Preset
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CSV Format Guide */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {bulkImportMode === 'provider' ? 'Minimal CSV (credentials only)' : 'Full CSV (all SMTP/IMAP fields)'}
                  </p>
                  <button
                    onClick={() => {
                      const csv = bulkImportMode === 'provider' ? sampleCsvModeA : sampleCsvModeB;
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = bulkImportMode === 'provider' ? 'import-template-minimal.csv' : 'import-template-full.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Download Template
                  </button>
                </div>
                <code className="text-xs text-emerald-400 break-all leading-relaxed font-mono">
                  {bulkImportMode === 'provider'
                    ? 'email, password, from_name (optional)'
                    : 'email, smtp_host, smtp_port, smtp_user, smtp_pass, imap_host, imap_port, imap_user, imap_pass'}
                </code>
                {bulkImportMode === 'provider' && (
                  <p className="text-[10px] font-black text-gray-500 mt-2 uppercase tracking-widest">
                    Host, port, and security settings inherited from the selected provider.
                  </p>
                )}
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleBulkFileDrop}
                className="border-2 border-dashed border-gray-700 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-colors cursor-pointer mb-4"
                onClick={() => document.getElementById('bulk-csv-file-input')?.click()}
              >
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">Drop a CSV file here or click to browse</p>
                <p className="text-xs text-gray-600 mt-1">Supports .csv files</p>
                <input
                  id="bulk-csv-file-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleBulkFileSelect}
                />
              </div>

              {/* Or Paste */}
              <div className="relative mb-4">
                <div className="absolute -top-3 left-4 bg-[#101828] px-2">
                  <span className="text-xs text-gray-500 font-medium">Or paste CSV content</span>
                </div>
                <textarea
                  value={bulkCsvText}
                  onChange={(e) => handleBulkCSVPreview(e.target.value)}
                  placeholder={bulkImportMode === 'provider'
                    ? `email,password,from_name\njohn@company.com,SecurePass123,John Smith\njane@company.com,SecurePass456,Jane Doe`
                    : `email,smtp_host,smtp_port,smtp_user,smtp_pass,imap_host,imap_port,imap_user,imap_pass\njohn@company.com,smtp.company.com,587,john@company.com,password123,imap.company.com,993,john@company.com,password123`}
                  className="w-full h-32 bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-sm text-white font-mono placeholder-gray-700 resize-none focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              {/* Preview Table */}
              {bulkPreview.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Preview ({bulkPreview.length} row{bulkPreview.length > 1 ? 's' : ''} shown)
                  </p>
                  <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="px-3 py-2 text-left text-gray-400 font-medium">Email</th>
                            {bulkImportMode === 'provider' ? (
                              <>
                                <th className="px-3 py-2 text-left text-gray-400 font-medium">Password</th>
                                <th className="px-3 py-2 text-left text-gray-400 font-medium">From Name</th>
                              </>
                            ) : (
                              <>
                                <th className="px-3 py-2 text-left text-gray-400 font-medium">SMTP Host</th>
                                <th className="px-3 py-2 text-left text-gray-400 font-medium">Port</th>
                                <th className="px-3 py-2 text-left text-gray-400 font-medium">IMAP Host</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {bulkPreview.map((row, i) => (
                            <tr key={i} className="border-b border-gray-800/50">
                              <td className="px-3 py-2 text-emerald-400 font-mono">{row.email || row.email_address || '-'}</td>
                              {bulkImportMode === 'provider' ? (
                                <>
                                  <td className="px-3 py-2 text-gray-300 font-mono">{'•'.repeat(Math.min((row.password || row.smtp_pass || '').length, 8)) || '-'}</td>
                                  <td className="px-3 py-2 text-gray-300">{row.from_name || row.sender_name || '-'}</td>
                                </>
                              ) : (
                                <>
                                  <td className="px-3 py-2 text-gray-300 font-mono">{row.smtp_host || row.smtp_server || '-'}</td>
                                  <td className="px-3 py-2 text-gray-300">{row.smtp_port || '587'}</td>
                                  <td className="px-3 py-2 text-gray-300 font-mono">{row.imap_host || row.imap_server || '-'}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => { setIsBulkModalOpen(false); setBulkCsvText(''); setBulkPreview([]); }}
                  className="px-5 py-2.5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!bulkCsvText.trim() || isBulkImporting || (bulkImportMode === 'provider' && !selectedProviderId)}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  {isBulkImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import Accounts
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add SMTP Provider Preset Modal */}
      <AnimatePresence>
        {isAddProviderOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddProviderOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#101828] border border-gray-800 rounded-[32px] p-8 w-full max-w-lg mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#745DF3]/10 flex items-center justify-center">
                    <Settings2 className="w-5 h-5 text-[#745DF3]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">New Provider Preset</h3>
                    <p className="text-sm text-gray-400">Save host/port settings once for all accounts</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddProviderOpen(false)}
                  className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest pl-1">Preset Name</label>
                  <input
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Namecheap Private Email"
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-4 text-sm text-white font-bold placeholder-gray-600 focus:outline-none focus:border-[#745DF3]/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest pl-1">SMTP Host</label>
                    <input
                      value={newProvider.smtpHost}
                      onChange={(e) => setNewProvider(p => ({ ...p, smtpHost: e.target.value }))}
                      placeholder="smtp.example.com"
                      className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-4 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#745DF3]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest pl-1">Port</label>
                    <input
                      value={newProvider.smtpPort}
                      onChange={(e) => setNewProvider(p => ({ ...p, smtpPort: e.target.value }))}
                      className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-4 text-sm text-white font-bold placeholder-gray-600 focus:outline-none focus:border-[#745DF3]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest pl-1">Security</label>
                    <select
                      value={newProvider.smtpSecurity}
                      onChange={(e) => setNewProvider(p => ({ ...p, smtpSecurity: e.target.value }))}
                      className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-4 text-sm text-white font-bold focus:outline-none focus:border-[#745DF3]/50 transition-colors appearance-none"
                    >
                      <option value="STARTTLS">STARTTLS</option>
                      <option value="SSL/TLS">SSL/TLS</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest pl-1">IMAP Host</label>
                    <input
                      value={newProvider.imapHost}
                      onChange={(e) => setNewProvider(p => ({ ...p, imapHost: e.target.value }))}
                      placeholder="imap.example.com"
                      className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-4 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#745DF3]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest pl-1">Port</label>
                    <input
                      value={newProvider.imapPort}
                      onChange={(e) => setNewProvider(p => ({ ...p, imapPort: e.target.value }))}
                      className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-4 text-sm text-white font-bold placeholder-gray-600 focus:outline-none focus:border-[#745DF3]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-widest pl-1">Security</label>
                    <select
                      value={newProvider.imapSecurity}
                      onChange={(e) => setNewProvider(p => ({ ...p, imapSecurity: e.target.value }))}
                      className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-4 text-sm text-white font-bold focus:outline-none focus:border-[#745DF3]/50 transition-colors appearance-none"
                    >
                      <option value="SSL/TLS">SSL/TLS</option>
                      <option value="STARTTLS">STARTTLS</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group py-2">
                  <input
                    type="checkbox"
                    checked={newProvider.isDefault}
                    onChange={(e) => setNewProvider(p => ({ ...p, isDefault: e.target.checked }))}
                    className="w-5 h-5 rounded-lg border-gray-800 text-[#745DF3] focus:ring-[#745DF3] bg-gray-900/50"
                  />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Set as default account preset</span>
                </label>
              </div>

              <div className="flex items-center gap-3 justify-end mt-8">
                <button
                  onClick={() => setIsAddProviderOpen(false)}
                  className="px-6 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-black uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProvider}
                  disabled={isSavingProvider || !newProvider.name || !newProvider.smtpHost}
                  className="px-8 py-3 rounded-2xl bg-[#745DF3] hover:bg-[#6347E0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors shadow-lg shadow-[#745DF3]/20"
                >
                  {isSavingProvider ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Save Preset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DNSGuideModal 
        isOpen={isDNSGuideOpen}
        onClose={() => setIsDNSGuideOpen(false)}
      />

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className={`px-6 py-3 rounded-2xl shadow-2xl border ${
              toast.type === 'success' 
                ? 'bg-[#101828] border-gray-800 text-white' 
                : 'bg-red-600 border-red-500 text-white'
            } flex items-center gap-3 min-w-[300px]`}>
              {toast.type === 'success' ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
              )}
              <p className="font-bold text-sm tracking-tight text-white">{toast.msg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteConfirmModal.show}
        onClose={() => setDeleteConfirmModal({ show: false, type: null, id: null, name: '' })}
        onConfirm={executeDelete}
        title={`Delete ${deleteConfirmModal.type === 'account' ? 'Account' : 'Domain'}?`}
        description={deleteConfirmModal.type === 'account' 
          ? `Are you sure you want to remove "${deleteConfirmModal.name}"? This action cannot be undone and will disconnect the mailbox.`
          : `Are you sure you want to remove the domain "${deleteConfirmModal.name}"? This will stop all tracking and verification for this domain.`
        }
        confirmText="Delete"
        cancelText="Keep"
        type="danger"
      />
    </div>
  );
}
