'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ConfirmModal from '@/components/dashboard/ConfirmModal';
import WarmupSettingsModal from '@/components/dashboard/WarmupSettingsModal';
import AddWarmupAccountModal from '@/components/dashboard/AddWarmupAccountModal';
import WarmupStatsModal from '@/components/dashboard/WarmupStatsModal';
import SubscriptionGuard from '@/components/dashboard/SubscriptionGuard';
import { 
  Flame, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight, 
  Settings2,
  Mail,
  Zap,
  BarChart3,
  MailWarning,
  CheckCircle2,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
  RefreshCw,
  Search,
  Plus,
  ArrowRight,
  Database,
  X,
  Settings,
  Loader2
} from 'lucide-react';

export default function WarmupPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>({
    totalSent: 0,
    totalSavedFromSpam: 0,
    avgHealth: 0,
    activeAccounts: 0,
    dnsHealthy: false,
    sentGrowth: '0%',
    healthGrowth: '0%',
    spamGrowth: '0%'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
  
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    show: boolean;
    accountId: string | null;
    email: string;
  }>({
    show: false,
    accountId: null,
    email: ''
  });
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedAccountForSettings, setSelectedAccountForSettings] = useState<any | null>(null);
  
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedAccountForStats, setSelectedAccountForStats] = useState<any | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [auditState, setAuditState] = useState<'idle' | 'scanning'>('idle');
  const [searchQuery, setSearchQuery] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAccounts();
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/warmup');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        if (data.stats) setDashboardStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch warmup accounts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentEnabled: boolean) => {
    try {
      const newStatus = currentEnabled ? 'Paused' : 'Warming';
      const res = await fetch('/api/warmup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          warmup_enabled: !currentEnabled,
          warmup_status: newStatus
        })
      });

      if (res.ok) {
        setAccounts(prev => prev.map(acc => 
          acc.id === id ? { ...acc, warmup_enabled: !currentEnabled, warmup_status: newStatus } : acc
        ));
      }
    } catch (err) {
      console.error("Failed to toggle warmup status:", err);
    }
  };

  const executeDeleteAccount = async () => {
    if (deleteConfirmModal.accountId !== null) {
      try {
        const res = await fetch(`/api/accounts/${deleteConfirmModal.accountId}`, { method: 'DELETE' });
        if (res.ok) {
          setAccounts(prev => prev.filter(a => a.id !== deleteConfirmModal.accountId));
          setDeleteConfirmModal({ show: false, accountId: null, email: '' });
        }
      } catch (err) {
        console.error("Failed to delete account:", err);
      }
    }
  };

  const handleDetailedStats = (account: any) => {
    setSelectedAccountForStats(account);
    setIsStatsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAccounts();
    setIsRefreshing(false);
  };

  const runAudit = () => {
    setAuditState('scanning');
    setTimeout(() => setAuditState('idle'), 3000);
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.warmup_enabled && acc.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeWarmupCount = accounts.filter(a => a.warmup_enabled).length;

  const stats = [
    { 
      name: 'Total Warmup Emails', 
      value: dashboardStats.totalSent.toLocaleString(), 
      change: dashboardStats.sentGrowth, 
      icon: Flame 
    },
    { 
      name: 'Avg. Health Score', 
      value: `${dashboardStats.avgHealth}/100`, 
      change: dashboardStats.healthGrowth, 
      icon: ShieldCheck 
    },
    { 
      name: 'Saved From Spam', 
      value: dashboardStats.totalSavedFromSpam.toLocaleString(), 
      change: dashboardStats.spamGrowth, 
      icon: Zap 
    },
    { 
      name: 'Active Accounts', 
      value: activeWarmupCount.toString(), 
      change: '0.0%', 
      icon: Mail 
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <SubscriptionGuard>
            <div className="max-w-[1400px] mx-auto space-y-10">
            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-black text-[#101828] tracking-tight flex items-center gap-3"
                >
                  Email Warmup
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-500 font-medium mt-1"
                >
                  Automated reputation management to keep your emails out of the spam folder.
                </motion.p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-6 py-4 bg-[#101828] rounded-2xl text-[13px] font-black text-white hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 group"
              >
                <Flame className="w-4 h-4 group-hover:text-orange-400 transition-colors" />
                Add Account to Warmup
              </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-[#745DF3]/20 transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#745DF3]/5 flex items-center justify-center text-[#745DF3] group-hover:bg-[#745DF3] group-hover:text-white transition-all duration-300">
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em] leading-none mb-1.5">{stat.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-black text-[#101828] tracking-tighter">{stat.value}</p>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <TrendingUp className="w-2.5 h-2.5" />
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Account List */}
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 bg-[#FBFBFB]/30">
                    <h2 className="text-2xl font-black text-[#101828] tracking-tight">Active Accounts</h2>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input 
                          type="text"
                          placeholder="Search accounts..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#745DF3]/10 transition-all outline-none w-48"
                        />
                      </div>
                      <button 
                        onClick={handleRefresh}
                        className={`p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#745DF3] transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-[#FBFBFB]/50">
                          <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Email Account</th>
                          <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Status</th>
                          <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Health</th>
                          <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Daily Volume</th>
                          <th className="px-8 py-4 text-right border-b border-gray-50">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                              <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 text-[#745DF3] animate-spin" />
                                    <p className="text-sm font-bold text-gray-400 capitalize">Loading accounts...</p>
                                  </div>
                                </td>
                              </tr>
                            ) : filteredAccounts.length > 0 ? filteredAccounts.map((account) => (
                            <motion.tr 
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              key={account.id} 
                              className="hover:bg-[#FBFBFB]/50 transition-colors group"
                            >
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center p-2 border border-gray-100 group-hover:scale-110 transition-transform shadow-sm">
                                    <img 
                                      src={account.provider === 'google' ? 'https://cdn-icons-png.flaticon.com/512/732/732200.png' : account.provider === 'outlook' ? 'https://cdn-icons-png.flaticon.com/512/732/732221.png' : 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png'} 
                                      className="w-full h-full object-contain" 
                                      alt={account.provider} 
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-black text-[#101828] text-sm group-hover:text-[#745DF3] transition-colors">{account.email}</span>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{account.provider}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                  account.warmup_status === 'Warming' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${account.warmup_status === 'Warming' ? 'bg-orange-400 animate-pulse' : 'bg-gray-400'}`} />
                                  {account.warmup_status}
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${account.health}%` }}
                                      transition={{ duration: 1, ease: "easeOut" }}
                                      className={`h-full rounded-full ${
                                        account.health > 90 ? 'bg-emerald-500' : 
                                        account.health > 80 ? 'bg-orange-500' : 
                                        'bg-red-500'
                                      }`}
                                    />
                                  </div>
                                  <span className="font-black text-[#101828] text-xs">{account.health}%</span>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex flex-col">
                                  <span className="font-black text-[#101828] text-sm">{account.daily_volume} / {account.warmup_limit}</span>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">emails / day</span>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => handleToggleStatus(account.id, account.warmup_enabled)}
                                    className={`p-2 rounded-xl transition-all ${
                                      account.warmup_status === 'Warming' 
                                        ? 'text-amber-600 hover:bg-amber-50' 
                                        : 'text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {account.warmup_status === 'Warming' ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                  </button>
                                  
                                  <div className="relative">
                                    <button 
                                      onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setMenuPosition({ top: rect.bottom + 8, left: rect.right - 192 });
                                        setActiveMenuId(activeMenuId === account.id ? null : account.id);
                                      }}
                                      className={`p-2 rounded-xl transition-all ${
                                        activeMenuId === account.id ? 'bg-[#101828] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
                                      }`}
                                    >
                                      <MoreHorizontal className="w-5 h-5" />
                                    </button>

                                    <AnimatePresence>
                                      {activeMenuId === account.id && (
                                        <>
                                          <div className="fixed inset-0 z-[1000]" onClick={() => setActiveMenuId(null)} />
                                          <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            style={{ 
                                              position: 'fixed',
                                              top: menuPosition?.top,
                                              left: menuPosition?.left,
                                            }}
                                            className="w-48 bg-white rounded-2xl border border-gray-100 shadow-2xl z-[1001] py-2 overflow-hidden"
                                          >
                                            <button 
                                              onClick={() => {
                                                setSelectedAccountForSettings(account);
                                                setIsSettingsModalOpen(true);
                                                setActiveMenuId(null);
                                              }}
                                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                              <Settings className="w-4 h-4 text-gray-400" />
                                              Warmup Settings
                                            </button>
                                            <button 
                                              onClick={() => handleDetailedStats(account)}
                                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                              <BarChart3 className="w-4 h-4 text-[#745DF3]" />
                                              Detailed Stats
                                            </button>
                                            <div className="my-1 border-t border-gray-50" />
                                            <button 
                                              onClick={() => {
                                                setDeleteConfirmModal({
                                                  show: true,
                                                  accountId: account.id,
                                                  email: account.email
                                                });
                                                setActiveMenuId(null);
                                              }}
                                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                              Remove Account
                                            </button>
                                          </motion.div>
                                        </>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )) : (
                            <tr>
                              <td colSpan={5} className="px-8 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <Search className="w-12 h-12 text-gray-200" />
                                  <p className="text-sm font-bold text-gray-400">No accounts found.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Warmup Explainers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-[#101828] mb-2">Automated Replies</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      Our system automatically replies to your warmup emails using AI-generated content to simulate natural conversation.
                    </p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-[#101828] mb-2">Safe Spam Removal</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      If your emails land in spam, our network automatically moves them to the inbox and marks them as important.
                    </p>
                  </div>
                </div>
              </div>

              {/* Insights Sidebar */}
              <div className="space-y-6">
                <div className="bg-[#101828] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#745DF3]/20 blur-[80px] -mr-32 -mt-32 rounded-full" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-6 h-6 text-[#745DF3]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight text-white">Health Audit</h3>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Real-time Analysis</p>
                      </div>
                    </div>

                    <div className="space-y-6 mb-8">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group/row hover:bg-white/10 transition-all cursor-default">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${auditState === 'scanning' ? 'bg-orange-400/20' : 'bg-emerald-400/20'}`}>
                            <AlertCircle className={`w-4 h-4 ${auditState === 'scanning' ? 'text-orange-400 animate-pulse' : 'text-emerald-400'}`} />
                          </div>
                          <span className="text-sm font-bold">Blacklist Status</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase ${
                          auditState === 'scanning' ? 'text-orange-400' : 
                          dashboardStats.avgHealth > 90 ? 'text-emerald-400' : 'text-orange-400'
                        }`}>
                          {auditState === 'scanning' ? 'Checking...' : dashboardStats.avgHealth > 90 ? 'All Clear' : 'Review Needed'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group/row hover:bg-white/10 transition-all cursor-default">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${auditState === 'scanning' ? 'bg-orange-400/20' : dashboardStats.dnsHealthy ? 'bg-emerald-400/20' : 'bg-red-400/20'}`}>
                            <Zap className={`w-4 h-4 ${auditState === 'scanning' ? 'text-orange-400 animate-pulse' : dashboardStats.dnsHealthy ? 'text-emerald-400' : 'text-red-400'}`} />
                          </div>
                          <span className="text-sm font-bold">DNS Configuration</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase ${
                          auditState === 'scanning' ? 'text-orange-400' : 
                          dashboardStats.dnsHealthy ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {auditState === 'scanning' ? 'Verifying...' : dashboardStats.dnsHealthy ? 'Optimized' : 'Needs Setup'}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={runAudit}
                      disabled={auditState === 'scanning'}
                      className="w-full py-4 bg-[#745DF3] hover:bg-[#634edb] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      {auditState === 'scanning' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Running Audit...
                        </>
                      ) : (
                        'Trigger Full System Audit'
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-[#101828]">Setup Progress</h3>
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${dashboardStats.dnsHealthy ? 'bg-emerald-500 ring-emerald-50' : 'bg-gray-300 ring-gray-100'} ring-4`} />
                        <div className={`w-0.5 h-12 ${dashboardStats.dnsHealthy ? 'bg-emerald-100' : 'bg-gray-100'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-black ${dashboardStats.dnsHealthy ? 'text-[#101828]' : 'text-gray-400'}`}>DNS Records Verified</h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          {dashboardStats.dnsHealthy ? 'SPF, DKIM, and DMARC confirmed.' : 'Setup DNS for best results.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${activeWarmupCount > 0 ? 'bg-emerald-500 ring-emerald-50' : 'bg-gray-300 ring-gray-100'} ring-4`} />
                        <div className={`w-0.5 h-12 ${activeWarmupCount > 0 ? 'bg-emerald-100' : 'bg-gray-100'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-black ${activeWarmupCount > 0 ? 'text-[#101828]' : 'text-gray-400'}`}>Accounts Connected</h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          {activeWarmupCount > 0 ? `${activeWarmupCount} sending accounts found.` : 'No accounts connected yet.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${activeWarmupCount > 0 ? 'bg-[#745DF3] animate-pulse ring-[#745DF3]/10' : 'bg-gray-300 ring-gray-100'} ring-4`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-black ${activeWarmupCount > 0 ? 'text-[#745DF3]' : 'text-gray-400'}`}>Warmup Algorithm</h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          {activeWarmupCount > 0 ? 'Reputation engine active.' : 'Enable warmup to start.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </SubscriptionGuard>
        </div>
      </main>
      <ConfirmModal 
        isOpen={deleteConfirmModal.show}
        onClose={() => setDeleteConfirmModal({ show: false, accountId: null, email: '' })}
        onConfirm={executeDeleteAccount}
        title="Delete Account?"
        description={`Are you sure you want to remove "${deleteConfirmModal.email}"? This will disconnect the mailbox from the entire platform and all active warmup data will be lost.`}
        confirmText="Yes, Remove"
        cancelText="Keep Account"
        type="danger"
      />

      <WarmupSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false);
          setSelectedAccountForSettings(null);
        }}
        account={selectedAccountForSettings}
        onSave={(updated) => {
          setAccounts(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
        }}
      />

      <AddWarmupAccountModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        availableAccounts={accounts.filter(acc => !acc.warmup_enabled)}
        onAdd={() => fetchAccounts()}
      />

      <WarmupStatsModal 
        isOpen={isStatsModalOpen}
        onClose={() => {
          setIsStatsModalOpen(false);
          setSelectedAccountForStats(null);
        }}
        account={selectedAccountForStats}
      />
    </div>
  );
}
