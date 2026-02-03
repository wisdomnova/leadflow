'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Database,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';

export default function CRMHistoryPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/activity?type=crm.push&limit=100');
      const data = await res.json();
      setActivities(data);
    } catch (error) {
      console.error("Failed to fetch CRM history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (activities.length === 0) return;
    
    const headers = ["Timestamp", "Description", "Target Lead", "Providers", "Status", "Duration"];
    const rows = activities.map(log => {
      const isSuccess = !log.action_type.includes('failed') && !log.action_type.includes('error');
      const results = log.metadata?.results || [];
      const providers = results.map((r: any) => r.provider).join('; ');
      return [
        new Date(log.created_at).toISOString(),
        log.description,
        log.metadata?.leadEmail || 'N/A',
        providers,
        isSuccess ? "Success" : "Failed",
        log.metadata?.duration ? `${log.metadata.duration}s` : "N/A"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `crm_sync_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRetryPush = async (leadId: string) => {
    try {
      const res = await fetch('/api/crm/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      });
      if (res.ok) {
        alert("Push retried successfully!");
        fetchHistory();
      } else {
        const err = await res.json();
        alert(`Failed to retry push: ${err.error}`);
      }
    } catch (e) {
      alert("An error occurred during retry.");
    }
  };

  const filteredHistory = activities.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.metadata?.leadEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const isSuccess = !log.action_type.includes('failed') && !log.action_type.includes('error');
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'success' && isSuccess) || 
      (statusFilter === 'failed' && !isSuccess);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-10">
            {/* Breadcrumbs & Title */}
            <div className="space-y-4">
              <Link 
                href="/dashboard/crm"
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#745DF3] transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Integrations
              </Link>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black text-[#101828] tracking-tight">Sync History</h1>
                  <p className="text-gray-500 font-medium mt-1">Detailed audit log for all CRM synchronization events.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search email or event..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-[13px] font-medium outline-none focus:border-[#745DF3] transition-all w-64 shadow-sm"
                    />
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className={`p-3 bg-white border rounded-2xl transition-all shadow-sm ${
                        statusFilter !== 'all' ? 'border-[#745DF3] text-[#745DF3]' : 'border-gray-100 text-gray-400 hover:text-[#101828]'
                      }`}
                    >
                      <Filter className="w-5 h-5" />
                    </button>
                    
                    <AnimatePresence>
                      {showFilterDropdown && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-2xl z-20 overflow-hidden"
                        >
                          {(['all', 'success', 'failed'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => {
                                setStatusFilter(status);
                                setShowFilterDropdown(false);
                              }}
                              className={`w-full text-left px-5 py-3 text-sm font-bold capitalize transition-colors ${
                                statusFilter === status ? 'bg-[#745DF3]/5 text-[#745DF3]' : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-6 py-3 bg-[#101828] rounded-2xl text-[13px] font-black text-white hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="min-w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                      <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                      <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Target</th>
                      <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                      <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Metadata</th>
                      <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest italic">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={6} className="px-8 py-8 h-20 bg-gray-50/20" />
                        </tr>
                      ))
                    ) : filteredHistory.length > 0 ? (
                      filteredHistory.map((log) => {
                        const isSuccess = !log.action_type.includes('failed') && !log.action_type.includes('error');
                        const results = log.metadata?.results || [];
                        const providers = results.map((r: any) => r.provider).join(', ') || 'CRM';
                        
                        return (
                          <motion.tr 
                            key={log.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            <td className="px-8 py-6">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isSuccess ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
                              }`}>
                                {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-black text-[#101828] mb-1">Lead Export</p>
                              <p className="text-xs text-gray-400 font-bold max-w-xs truncate">{log.description}</p>
                            </td>
                            <td className="px-8 py-6">
                              <span className="px-3 py-1 bg-gray-100 text-[#101828] text-[10px] font-black uppercase tracking-widest rounded-lg">
                                {providers}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-gray-500">
                              {log.metadata?.leadEmail || 'Direct Push'}
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-black text-[#101828]">
                                {new Date(log.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-400 font-bold">
                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>
                            <td className="px-8 py-6">
                              {log.metadata?.duration ? (
                                <div className="flex items-center gap-2 text-xs font-bold text-[#745DF3]">
                                  <Clock className="w-3 h-3" />
                                  {log.metadata.duration}s
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-gray-300">N/A</span>
                              )}
                            </td>
                            <td className="px-8 py-6">
                              {!isSuccess && log.metadata?.leadId && (
                                <button
                                  onClick={() => handleRetryPush(log.metadata.leadId)}
                                  className="flex items-center gap-2 text-[#745DF3] hover:text-[#5C46E5] text-[10px] font-black uppercase tracking-widest transition-all group-hover:scale-105"
                                  title="Retry sync for this lead"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Retry
                                </button>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                          <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                            <Database className="w-10 h-10 text-gray-200" />
                          </div>
                          <p className="text-lg font-black text-[#101828]">No sync records found</p>
                          <p className="text-gray-400 font-medium">Any leads pushed to your CRM will appear here.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Placeholder */}
              {filteredHistory.length > 0 && (
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-400">
                    Showing {filteredHistory.length} sync events
                  </p>
                  <div className="flex items-center gap-2">
                    <button disabled className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold opacity-50">Previous</button>
                    <button disabled className="px-4 py-2 bg-[#101828] text-white rounded-xl text-sm font-bold">1</button>
                    <button disabled className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold">Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
