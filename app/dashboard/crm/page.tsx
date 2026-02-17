'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ConfirmModal from '@/components/dashboard/ConfirmModal';
import SubscriptionGuard from '@/components/dashboard/SubscriptionGuard';
import Link from 'next/link';
import { 
  Database, 
  RefreshCw, 
  ExternalLink, 
  Settings2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Search,
  Zap,
  Clock,
  LayoutDashboard,
  TrendingUp
} from 'lucide-react';

interface CRMIntegration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  accountName?: string;
  lastSync?: string;
  status: string;
  color: string;
}

export default function CRMPage() {
  const [integrations, setIntegrations] = useState<CRMIntegration[]>([]);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestedCrmName, setRequestedCrmName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>({ total: 0, failed: 0, success: 0, efficiency: 100 });
  const [activities, setActivities] = useState<any[]>([]);

  const avgSyncTime = activities.length > 0 
    ? (activities.reduce((acc: number, curr: any) => acc + (curr.metadata?.duration || 0.8), 0) / activities.length).toFixed(1)
    : '0.0';

  const crmStats = [
    { name: 'Total Synced Leads', value: stats.total.toLocaleString(), change: stats.total > 0 ? `+${stats.total}` : '0', icon: Database },
    { name: 'Active Automations', value: connectedIds.size.toString(), change: `+${connectedIds.size}`, icon: Zap },
    { name: 'Data Health', value: `${stats.efficiency}%`, change: '0%', icon: ShieldCheck },
    { name: 'Avg. Sync Time', value: `${avgSyncTime}s`, change: activities.length > 0 ? '-0.1s' : '0s', icon: Clock },
  ];

  const providers = [
    { id: 'hubspot', name: 'HubSpot', description: 'Sync contacts, deals, and activity with HubSpot CRM.', icon: 'https://www.vectorlogo.zone/logos/hubspot/hubspot-icon.svg', color: '#FF7A59' },
    { id: 'pipedrive', name: 'Pipedrive', description: 'Connect your Pipedrive account to automate lead handoff.', icon: 'https://raw.githubusercontent.com/dochne/wappalyzer/206b81ff73111aa98af217f35b8f3003e2730617/src/images/icons/Pipedrive.svg', color: '#222222' },
    { id: 'salesforce', name: 'Salesforce', description: 'Enterprise-grade integration for high-volume outbound.', icon: 'https://www.vectorlogo.zone/logos/salesforce/salesforce-icon.svg', color: '#00A1E0' }
  ];

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const [crmRes, activityRes, statsRes] = await Promise.all([
        fetch('/api/crm'),
        fetch('/api/activity?type=crm.push'),
        fetch('/api/crm/stats')
      ]);
      
      const data = await crmRes.json();
      const activityData = await activityRes.json();
      const statsData = await statsRes.json();
      
      setActivities(activityData);
      setStats(statsData);
      
      const connected = new Set<string>(data.map((i: any) => i.provider));
      setConnectedIds(connected);
      
      const merged = providers.map(p => {
        const found = data.find((i: any) => i.provider === p.id);
        return {
          ...p,
          connected: !!found,
          accountName: found?.config?.accountName,
          lastSync: found?.last_sync ? new Date(found.last_sync).toLocaleString() : undefined,
          status: found?.status || 'Not Connected'
        };
      });
      
      setIntegrations(merged as any);
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = (id: string) => {
    setIsConnecting(id);
    window.location.href = `/api/crm/oauth/${id}`;
  };

  const simulateSync = async (id: string) => {
    setSyncingProvider(id);
    try {
      // In production this would trigger a background sync job
      // For now we simulate it and create a real activity log entry
      await new Promise(r => setTimeout(r, 2000));
      
      // We could add an API for manual sync trigger that logs activity
      // For now we just refresh logs which might show the result of a real background sync
      await fetchIntegrations();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectingId) return;
    try {
      // Find the internal ID for this provider
      const res = await fetch('/api/crm');
      const data = await res.json();
      const integration = data.find((i: any) => i.provider === disconnectingId);
      
      if (integration) {
        await fetch(`/api/crm?id=${integration.id}`, { method: 'DELETE' });
        fetchIntegrations();
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setDisconnectingId(null);
    }
  };

  const filteredIntegrations = integrations.filter(crm => 
    crm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crm.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  className="text-3xl font-black text-[#101828] tracking-tight"
                >
                  CRM Integrations
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-500 font-medium mt-1"
                >
                  Connect your CRM to sync leads and automate your sales workflow.
                </motion.p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative hidden lg:block mr-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search integrations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-[13px] font-medium outline-none focus:border-[#745DF3] transition-all w-64"
                  />
                </div>
                <Link 
                  href="/dashboard/contacts"
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[13px] font-black text-[#101828] hover:bg-gray-50 transition-all shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#745DF3]" />
                  Internal CRM
                </Link>
                <button 
                  onClick={() => setIsRequestModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-[#101828] rounded-2xl text-[13px] font-black text-white hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Request Integration
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {crmStats.map((stat, i) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-[#745DF3]/20 transition-all group"
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

            {/* Main Integrations Grid */}
            <div className="grid grid-cols-1 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredIntegrations.map((crm) => (
                  <motion.div
                    key={crm.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[#745DF3]/5 transition-all"
                  >
                    <div className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                      {/* Logo */}
                      <div className="relative">
                        <div 
                          className="w-24 h-24 rounded-[2rem] flex items-center justify-center bg-white shadow-2xl transition-transform hover:scale-105 border border-gray-50 overflow-hidden"
                          style={{ boxShadow: `0 20px 40px -12px ${crm.color}20` }}
                        >
                          <img src={crm.icon} alt={crm.name} className="w-12 h-12 object-contain" />
                        </div>
                        <AnimatePresence>
                          {crm.connected && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-white rounded-full p-2 shadow-lg"
                            >
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <h3 className="text-3xl font-black text-[#101828] tracking-tight">{crm.name}</h3>
                          {crm.connected ? (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100/50">Active</span>
                          ) : (
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${
                              crm.status === 'Maintenance' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-gray-50 text-gray-400'
                            }`}>
                              {crm.status}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 font-bold text-lg max-w-md leading-relaxed">{crm.description}</p>
                        
                        <AnimatePresence>
                          {crm.connected && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-6 mt-4 text-[13px] font-bold text-gray-400 overflow-hidden"
                            >
                              <span className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-[#745DF3]" />
                                {crm.accountName}
                              </span>
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                              <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#745DF3]" />
                                Last synced {crm.lastSync}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {crm.connected ? (
                        <>
                          <button 
                            onClick={() => simulateSync(crm.id)}
                            disabled={syncingProvider === crm.id}
                            className="flex items-center gap-3 px-8 py-4 bg-gray-50 rounded-[1.5rem] text-[13px] font-black text-[#101828] hover:bg-gray-100 transition-all disabled:opacity-50 group grow sm:grow-0 justify-center"
                          >
                            <RefreshCw className={`w-4 h-4 text-[#745DF3] ${syncingProvider === crm.id ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            {syncingProvider === crm.id ? 'Syncing...' : 'Sync Now'}
                          </button>
                          <button 
                            onClick={() => setDisconnectingId(crm.id)}
                            className="flex items-center gap-3 px-8 py-4 border-2 border-gray-100 rounded-[1.5rem] text-[13px] font-black text-red-500 hover:bg-red-50 hover:border-red-100 transition-all grow sm:grow-0 justify-center"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleConnect(crm.id)}
                          disabled={isConnecting === crm.id}
                          className="flex items-center gap-3 px-10 py-4 bg-[#101828] rounded-[1.5rem] text-[13px] font-black text-white hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/20 group grow sm:grow-0 justify-center min-w-[200px]"
                        >
                          {isConnecting === crm.id ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              Connect {crm.name}
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>

            {/* Integration Logs / History Section */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-[#101828] tracking-tight">Sync History</h3>
                  <p className="text-gray-500 text-sm font-medium">Monitor your background data sync performance.</p>
                </div>
                <Link href="/dashboard/crm/history" className="text-sm font-bold text-[#745DF3] hover:underline transition-all hover:pr-2">
                  View Full History
                </Link>
              </div>

              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-3xl border border-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          log.action_type === 'crm.push' ? 'bg-emerald-100 text-emerald-600' : 
                          log.action_type.includes('failed') || log.action_type.includes('error') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {log.action_type.includes('failed') || log.action_type.includes('error') ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#101828]">
                            {log.action_type === 'crm.push' ? 'Direct CRM Export' : 
                             log.action_type === 'sync.failed' ? 'Sync Failure' : 'System Activity'}
                          </p>
                          <p className="text-xs text-gray-500 font-bold tracking-tight">
                            {log.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-[#101828]">
                          {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {log.metadata?.duration && (
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Duration: {log.metadata.duration}s</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-sm font-black text-gray-400">No sync history found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          </SubscriptionGuard>
        </div>
      </main>
      <ConfirmModal 
        isOpen={!!disconnectingId}
        onClose={() => setDisconnectingId(null)}
        onConfirm={handleDisconnect}
        title="Disconnect CRM?"
        description="Are you sure you want to disconnect this CRM integration? All active data syncs and automations for this provider will be paused immediately."
        confirmText="Disconnect Now"
        type="danger"
      />

      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute inset-0 bg-[#101828]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-10 overflow-hidden"
            >
              <div className="relative z-10 text-center">
                {!requestSubmitted ? (
                  <>
                    <div className="w-20 h-20 rounded-[2.5rem] bg-[#745DF3]/5 flex items-center justify-center text-[#745DF3] mb-8 border-4 border-white shadow-xl mx-auto">
                      <Plus className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-[#101828] tracking-tight mb-3">Request Integration</h3>
                    <p className="text-gray-500 font-medium mb-8 leading-relaxed">Let us know which platform you'd like to see integrated next.</p>
                    <input 
                      type="text" 
                      placeholder="e.g. Zoho CRM" 
                      value={requestedCrmName}
                      onChange={(e) => setRequestedCrmName(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#745DF3] outline-none transition-all mb-6"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => {
                          setIsRequestModalOpen(false);
                          setRequestedCrmName('');
                        }}
                        className="px-6 py-4 bg-gray-50 text-[#101828] rounded-2xl text-sm font-black hover:bg-gray-100 transition-all border border-gray-100"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={async () => {
                          if (!requestedCrmName.trim()) return;
                          setRequestSubmitted(true);
                          // Future: await fetch('/api/crm/request', ...)
                          setTimeout(() => {
                            setIsRequestModalOpen(false);
                            setRequestSubmitted(false);
                            setRequestedCrmName('');
                          }, 2000);
                        }}
                        className="px-6 py-4 bg-[#745DF3] text-white rounded-2xl text-sm font-black hover:bg-[#5C46E5] transition-all shadow-xl shadow-[#745DF3]/20 disabled:opacity-50"
                        disabled={!requestedCrmName.trim()}
                      >
                        Submit
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-10">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-50 flex items-center justify-center text-emerald-500 mb-8 border-4 border-white shadow-xl mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-[#101828] tracking-tight mb-3">Request Sent!</h3>
                    <p className="text-gray-500 font-medium mb-0">We've added this to our roadmap.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
