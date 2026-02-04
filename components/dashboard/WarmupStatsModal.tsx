'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Flame,
  Loader2,
  Calendar,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface WarmupStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: any;
}

export default function WarmupStatsModal({ isOpen, onClose, account }: WarmupStatsModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalSent: 0,
    totalInbox: 0,
    totalSpam: 0,
    avgHealth: 0
  });

  useEffect(() => {
    if (isOpen && account) {
      fetchStats();
    }
  }, [isOpen, account]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/warmup/${account.id}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.history || []);
        setSummary(data.summary || {
          totalSent: 0,
          totalInbox: 0,
          totalSpam: 0,
          avgHealth: account.health || 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch warmup stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-[#FBFBFB]/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#745DF3]/5 rounded-2xl flex items-center justify-center text-[#745DF3]">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#101828]">Detailed Warmup Stats</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{account.email}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 max-h-[80vh] overflow-y-auto no-scrollbar">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-[#745DF3] animate-spin" />
                  <p className="text-sm font-bold text-gray-400">Fetching performance history...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Sent', value: summary.totalSent, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
                      { label: 'Inbox Rate', value: `${summary.totalSent > 0 ? Math.round((summary.totalInbox / summary.totalSent) * 100) : 100}%`, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                      { label: 'Saved from Spam', value: summary.totalSpam, icon: Zap, color: 'text-[#745DF3]', bg: 'bg-[#745DF3]/5' },
                      { label: 'Reputation', value: `${summary.avgHealth}/100`, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
                    ].map((s) => (
                      <div key={s.label} className="p-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
                        <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                          <s.icon className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1">{s.label}</p>
                        <p className="text-xl font-black text-[#101828]">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart Container */}
                  <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-lg font-black text-[#101828]">Warmup Activity (Last 30 Days)</h4>
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2 text-emerald-500">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                          Inbox
                        </div>
                        <div className="flex items-center gap-2 text-orange-400">
                          <div className="w-3 h-3 bg-orange-400 rounded-full" />
                          Spam
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                      {stats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats}>
                            <defs>
                              <linearGradient id="colorInbox" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorSpam" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#64748B', fontWeight: 700 }}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#64748B', fontWeight: 700 }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '1rem', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="inbox_count" 
                              name="Inbox"
                              stroke="#10b981" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorInbox)" 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="spam_count" 
                              name="Spam"
                              stroke="#fbbf24" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorSpam)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-gray-200" />
                          </div>
                          <p className="text-sm font-bold text-gray-400">No activity data for the selected period.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Health Trend */}
                  <div className="bg-[#101828] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                      <ShieldCheck className="w-32 h-32 text-emerald-500 fill-emerald-500" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black tracking-tight">Health Trend</h4>
                          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Reputation Monitoring</p>
                        </div>
                      </div>
                      <div className="flex items-end gap-2 mb-6">
                        <span className="text-5xl font-black tracking-tighter text-emerald-400">{summary.avgHealth}%</span>
                        <span className="text-gray-400 font-bold mb-2">/ 100 Score</span>
                      </div>
                      <p className="text-gray-400 text-xs font-medium max-w-md leading-relaxed">
                        Your account health is based on inbox placement and interaction rates. 
                        A score above <span className="text-white font-bold underline decoration-[#745DF3]">90%</span> is ideal for outbound stability.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-gray-50 bg-[#FBFBFB]/50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-[#101828] text-white rounded-2xl text-sm font-black hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10"
              >
                Close Insights
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
