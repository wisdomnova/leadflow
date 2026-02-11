'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { 
  Zap, 
  Server, 
  ShieldCheck, 
  Send, 
  Activity, 
  RefreshCw, 
  Plus, 
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Globe,
  BarChart3,
  Search,
  ArrowUpRight,
  Settings2,
  TrendingUp,
  Target,
  Users,
  Trash2,
  HelpCircle,
  X,
  ArrowRight
} from 'lucide-react';

interface SmartServer {
  id: string;
  name: string;
  provider: string;
  domain_name: string;
  ip_address: string;
  status: 'active' | 'warming' | 'paused' | 'failed';
  reputation_score: number;
  daily_limit: number;
  current_usage: number;
  total_sends: number;
  last_sent_at: string | null;
  created_at: string;
}

export default function PowerSendPage() {
  const [servers, setServers] = useState<SmartServer[]>([]);
  const [stats, setStats] = useState({
    totalNodes: 0,
    activeNodes: 0,
    avgReputation: 0,
    totalSends: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'mailreef',
    ip_address: '',
    daily_limit: 500,
    api_key: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/powersend');
      const data = await res.json();
      
      if (data.restricted) {
        setIsRestricted(true);
        return;
      }

      setServers(data.servers || []);
      setStats(data.stats || {
        totalNodes: 0,
        activeNodes: 0,
        avgReputation: 0,
        totalSends: 0
      });
    } catch (error) {
      console.error('Failed to fetch PowerSend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/powersend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, provider: 'mailreef' })
      });

      if (!res.ok) {
        const errData = await res.text();
        throw new Error(errData || 'Failed to add server');
      }

      await fetchData();
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        provider: 'mailreef',
        ip_address: '',
        daily_limit: 500,
        api_key: ''
      });
    } catch (error: any) {
      console.error('Add server error:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm('Are you sure you want to remove this smart server?')) return;
    
    try {
      const res = await fetch(`/api/powersend/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Delete server error:', error);
    }
  };

  const filteredServers = servers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ip_address.includes(searchQuery) ||
    s.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { name: 'Total Nodes', value: stats.totalNodes.toString(), icon: Server },
    { name: 'Active & Protected', value: stats.activeNodes.toString(), icon: ShieldCheck },
    { name: 'Avg Reputation', value: `${stats.avgReputation}%`, icon: TrendingUp },
    { name: 'PowerSends (Total)', value: stats.totalSends.toLocaleString(), icon: Zap },
  ];

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-10">
            {isRestricted ? (
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-12 text-center max-w-2xl mx-auto my-20">
                <div className="w-20 h-20 bg-[#745DF3]/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#745DF3]/10">
                  <Zap className="w-10 h-10 text-[#745DF3]" />
                </div>
                <h2 className="text-2xl font-black text-[#101828] mb-3">PowerSend is Locked</h2>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                  Infrastructure-level IP rotation is only available on <b>Pro</b> and <b>Enterprise</b> plans. Upgrade today to scale your deliverability with dedicated Nodes.
                </p>
                <Link 
                  href="/dashboard/billing"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#745DF3] text-white rounded-2xl font-bold hover:bg-[#6349df] transition-all shadow-lg shadow-[#745DF3]/20"
                >
                  Upgrade to Unlock
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-black text-[#101828] tracking-tight">PowerSend</h1>
                      <div className="bg-[#745DF3]/10 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm border border-[#745DF3]/10">
                        <Zap className="w-3.5 h-3.5 text-[#745DF3] fill-[#745DF3]" />
                        <span className="text-[10px] font-bold text-[#745DF3] uppercase tracking-wider">Infrastructure</span>
                      </div>
                    </div>
                    <p className="text-gray-500 font-medium mt-1">
                      Monitor distributed server pools and control high-volume outbound rotation.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsHelpModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 text-[#745DF3] bg-[#745DF3]/5 border border-[#745DF3]/10 rounded-xl text-sm font-bold hover:bg-[#745DF3]/10 transition-all"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Guide
                    </button>
                    <button 
                      onClick={fetchData}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#101828] text-white rounded-xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-gray-200"
                    >
                      <Plus className="w-4 h-4" />
                      Add Smart Server
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {statCards.map((stat, idx) => (
                    <motion.div
                      key={stat.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
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
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-2 rounded-[28px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar lg:w-auto w-full px-2">
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">System Active</span>
                </div>
              </div>
              <div className="relative lg:w-96 w-full px-2">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search nodes, IPs, or providers..."
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Nodes Table */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#FBFBFB] border-b border-gray-100">
                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Node Name / IP</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Reputation</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Daily Load</th>
                    <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-8 py-6 h-20 bg-gray-50/20" />
                      </tr>
                    ))
                  ) : filteredServers.length > 0 ? (
                    filteredServers.map((server) => (
                      <tr key={server.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                              <Globe className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-bold text-[#101828] text-sm">{server.name}</p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{server.ip_address}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-sm text-gray-600 font-bold">{server.provider}</span>
                        </td>
                        <td className="px-6 py-6">
                          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit shadow-sm border ${
                            server.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' :
                            server.status === 'warming' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {server.status}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    server.reputation_score > 80 ? 'bg-green-500' :
                                    server.reputation_score > 50 ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${server.reputation_score}%` }}
                                />
                              </div>
                              <span className="text-xs font-black text-gray-900">{server.reputation_score}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                              <span>{server.current_usage || 0} sends</span>
                              <span>{server.daily_limit} max</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                              <div 
                                className="h-full bg-[#745DF3] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(116,93,243,0.3)]"
                                style={{ width: `${((server.current_usage || 0) / server.daily_limit) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2.5 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-[#101828] border border-transparent hover:border-gray-100">
                              <Settings2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteServer(server.id)}
                              className="p-2.5 hover:bg-red-50 rounded-xl transition-all text-gray-400 hover:text-red-600 border border-transparent hover:border-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100 shadow-inner">
                            <Server className="w-8 h-8 text-gray-200" />
                          </div>
                          <div>
                            <p className="font-black text-[#101828] text-lg">No smart servers found</p>
                            <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto mt-1">Add your first node to start using PowerSend infrastructure.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Infrastructure Health Footer */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#745DF3]/5 border border-[#745DF3]/10 p-6 rounded-2xl flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-[#745DF3] shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Reputation Guard</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Automatic protection is active. Nodes with reputation below 70% are automatically shifted to 'Auto-Warmup' mode.
                </p>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl flex items-start gap-4">
              <Activity className="w-6 h-6 text-orange-500 shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Distributed Rotation</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Traffic is balanced across {stats.activeNodes} active nodes using reputation-weighted round robin.
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-start gap-4">
              <Globe className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">Mailreef Integration</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Connected to the primary Mailreef API. Low-level IP health monitoring is synchronized every 15 minutes.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
</main>

      {/* Add Smart Server Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#101828]">Add Smart Server</h3>
                    <p className="text-sm text-gray-500 font-medium">Provision a new high-reputation node</p>
                  </div>
                  <div className="w-12 h-12 bg-[#745DF3]/5 rounded-2xl flex items-center justify-center text-[#745DF3]">
                    <Zap className="w-6 h-6" />
                  </div>
                </div>

                <form onSubmit={handleAddServer} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Node Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Master Node 01"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">IP Address</label>
                        <input
                          type="text"
                          required
                          placeholder="1.2.3.4"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={formData.ip_address}
                          onChange={e => setFormData({ ...formData, ip_address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Infrastructure Provider</label>
                        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-[#745DF3] flex items-center gap-2">
                          <Zap className="w-4 h-4 fill-[#745DF3]" />
                          Mailreef Node
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Daily Limit</label>
                        <input
                          type="number"
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                          value={formData.daily_limit}
                          onChange={e => setFormData({ ...formData, daily_limit: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">API Key / Auth Token</label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-medium"
                        value={formData.api_key}
                        onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 px-6 py-3 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] px-6 py-3 bg-[#101828] text-white rounded-xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {isSubmitting ? 'Provisioning...' : 'Provision Node'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Configuration Guide Modal */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHelpModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100"
            >
              <button 
                onClick={() => setIsHelpModalOpen(false)}
                className="absolute top-8 right-8 p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all z-10 border border-transparent hover:border-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-[#745DF3]/5 rounded-2xl flex items-center justify-center text-[#745DF3]">
                    <HelpCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#101828]">PowerSend Setup Guide</h3>
                    <p className="text-gray-500 font-medium">How to provision your smart infrastructure</p>
                  </div>
                </div>

                <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 no-scrollbar">
                  <section>
                    <h4 className="text-sm font-black text-[#101828] uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-6 h-6 bg-[#101828] text-white text-[10px] rounded-full flex items-center justify-center">1</span>
                       Find your Mailreef Details
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 font-medium">
                      Log in to your Mailreef dashboard. Each IP or "Node" you purchase will have specific networking details required for rotation.
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-[#745DF3] uppercase mb-1">IP Address / Node Identifier</p>
                        <p className="text-xs text-gray-600 font-medium font-jakarta leading-relaxed">
                          The dedicated IPv4 address or hostname assigned by Mailreef. This acts as the physical 'mailman' for your outbound traffic. No DNS configuration is required at this stage.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-black text-[#101828] uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-6 h-6 bg-[#101828] text-white text-[10px] rounded-full flex items-center justify-center">2</span>
                       Authentication
                    </h4>
                    <div className="p-5 bg-[#745DF3]/5 border border-[#745DF3]/10 rounded-2xl">
                      <p className="text-sm text-[#101828] font-bold mb-2">Getting your API Key</p>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed">
                        Navigate to <b>Settings &gt; API Keys</b> in Mailreef. Generate a new key specifically for LeadFlow. This key allows our "PowerSend Engine" to talk to their servers securely.
                      </p>
                    </div>
                  </section>

                  <section className="bg-orange-50/50 p-6 rounded-[24px] border border-orange-100">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-orange-900 mb-1">Recommended Limits</p>
                        <p className="text-xs text-orange-800/80 font-medium leading-relaxed">
                          For brand new servers, start with a <b>Daily Limit of 50</b>. Our system will automatically scale this up to 500+ as your reputation score remains high (80%+).
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                  <button
                    onClick={() => setIsHelpModalOpen(false)}
                    className="w-full py-4 bg-[#101828] text-white rounded-2xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-gray-200"
                  >
                    Got it, let's build
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
