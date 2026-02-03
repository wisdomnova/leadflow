'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import SMTPModal from '@/components/dashboard/SMTPModal';
import DNSGuideModal from '@/components/dashboard/DNSGuideModal';
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
  MailPlus
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
  const [isDNSGuideOpen, setIsDNSGuideOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [domainSearch, setDomainSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [accountsRes, domainsRes, diagnosticsRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/domains'),
        fetch('/api/diagnostics')
      ]);
      
      if (accountsRes.ok) setAccounts(await accountsRes.json());
      if (domainsRes.ok) setDomains(await domainsRes.json());
      if (diagnosticsRes.ok) setDiagnostics(await diagnosticsRes.json());
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
    if (!selectedSender) return alert("Select a sender");
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
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          provider: 'custom_smtp',
          config: data
        })
      });

      if (res.ok) {
        const newAcc = await res.json();
        setAccounts(prev => [newAcc, ...prev]);
        setIsSMTPModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to connect SMTP");
      }
    } catch (err) {
      console.error("SMTP connect error:", err);
    }
  };

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
      } else {
        const err = await res.json();
        alert(err.message || err.error || "Failed to add domain");
      }
    } catch (err) {
      console.error("Add domain error:", err);
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
        if (!result.success) alert(`Connection failed: ${result.error}`);
      }
    } catch (err) {
      console.error("Check account error:", err);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to remove this account?")) return;

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAccounts(accounts.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error("Delete account error:", err);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (!confirm("Are you sure you want to remove this domain?")) return;

    try {
      const res = await fetch(`/api/domains/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDomains(domains.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error("Delete domain error:", err);
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
                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center hover:border-[#745DF3]/40 transition-all cursor-pointer group">
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
                                      onClick={() => handleDeleteAccount(account.id)}
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
                                        onClick={() => handleDeleteDomain(domain.id)}
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

      <DNSGuideModal 
        isOpen={isDNSGuideOpen}
        onClose={() => setIsDNSGuideOpen(false)}
      />
    </div>
  );
}
