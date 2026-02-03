'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Search, 
  Filter, 
  Send, 
  Inbox, 
  Users, 
  Flame, 
  Server, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  MoreHorizontal,
  Clock,
  Calendar,
  ChevronRight,
  RefreshCw,
  Loader2,
  MousePointer2
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

// Helper to format relative time
const timeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return then.toLocaleDateString();
};

const getEventIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.startsWith('campaign.')) return Send;
  if (t.includes('reply') || t.includes('received') || t.includes('inbox')) return Inbox;
  if (t.startsWith('team.')) return UserPlus;
  if (t.includes('error') || t.includes('failed') || t.includes('issue')) return AlertCircle;
  if (t.includes('warmup')) return Flame;
  if (t.includes('lead') || t.includes('contact') || t.includes('import')) return Users;
  if (t.includes('provider') || t.includes('connected') || t.includes('server')) return Server;
  if (t.includes('open')) return MousePointer2;
  return Activity;
};

const getEventStatus = (type: string) => {
  if (type.includes('error') || type.includes('failed')) return 'warning';
  if (type.startsWith('team.')) return 'info';
  return 'success';
};

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    fetchActivities();
  }, [filter, limit]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/activity?filter=${filter}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error("Failed to fetch activities", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchActivities();
  };

  const handleLoadMore = () => {
    setLimit(prev => prev + 20);
  };

  const filteredItems = activities.filter(item => 
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.action_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#FBFBFB] font-jakarta overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-[1200px] mx-auto space-y-10">
            {/* Page Title & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black text-[#101828] tracking-tight flex items-center gap-3">
                  <Activity className="w-8 h-8 text-[#745DF3]" />
                  Recent Activity
                </h1>
                <p className="text-gray-500 font-medium mt-1">Real-time audit log of all workspace events and automation actions.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-[#745DF3] transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/10 focus:border-[#745DF3]/20 transition-all w-64 shadow-sm"
                  />
                </div>
                <button 
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-[#745DF3] transition-all shadow-sm"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-[#745DF3]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Content Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
              {/* Filter Sidebar */}
              <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-0">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-1">
                  <h3 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Event Filtering</h3>
                  {[
                    { id: 'all', name: 'All Activity', icon: Activity },
                    { id: 'campaigns', name: 'Campaigns', icon: Send },
                    { id: 'replies', name: 'Inbox/Replies', icon: Inbox },
                    { id: 'team', name: 'Team Actions', icon: UserPlus },
                    { id: 'errors', name: 'Alerts', icon: AlertCircle }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFilter(cat.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        filter === cat.id 
                          ? 'bg-[#745DF3]/5 text-[#745DF3] font-black' 
                          : 'text-gray-500 hover:bg-gray-50 font-bold'
                      }`}
                    >
                      <cat.icon className={`w-4 h-4 ${filter === cat.id ? 'text-[#745DF3]' : 'text-gray-400'}`} />
                      <span className="text-xs">{cat.name}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-[#101828] p-6 rounded-[2rem] text-white overflow-hidden relative group">
                  <div className="relative z-10">
                    <Clock className="w-8 h-8 text-[#745DF3] mb-4" />
                    <h3 className="text-lg font-black leading-tight text-white">Retention Policy</h3>
                    <p className="text-white/80 text-[11px] mt-2 leading-relaxed">Activity logs are stored for 90 days. Upgrade to Enterprise for unlimited history.</p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#745DF3]/10 blur-3xl rounded-full" />
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="lg:col-span-3">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100">
                      <Loader2 className="w-8 h-8 animate-spin text-[#745DF3] mb-4" />
                      <p className="text-sm font-bold text-gray-400">Loading audit logs...</p>
                    </div>
                  ) : filteredItems.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                      {filteredItems.map((item, idx) => {
                        const Icon = getEventIcon(item.action_type);
                        const status = getEventStatus(item.action_type);
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-[#745DF3]/20 hover:shadow-xl hover:shadow-[#101828]/5 transition-all cursor-pointer relative"
                          >
                            <div className="flex items-start gap-6">
                              {/* Timeline Dot & Line */}
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#101828] group-hover:bg-[#101828] group-hover:text-white transition-all duration-500 shadow-sm relative z-10">
                                  <Icon className="w-5 h-5" />
                                </div>
                                {idx !== filteredItems.length - 1 && (
                                  <div className="w-0.5 h-16 bg-gray-50 group-hover:bg-gray-100 transition-colors" />
                                )}
                              </div>

                              <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-3 mb-1">
                                      <h3 className="text-base font-black text-[#101828] leading-tight capitalize">
                                        {item.action_type.split('.')[1]?.replace('_', ' ') || item.action_type.replace('_', ' ')}
                                      </h3>
                                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                        status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                        status === 'warning' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                      }`}>
                                        {item.action_type.split('.')[0]}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-xl">
                                      {item.description}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{timeAgo(item.created_at)}</p>
                                  </div>
                                </div>
                                
                                <div className="mt-6 flex items-center gap-4">
                                   <button className="flex items-center gap-1.5 text-[11px] font-black text-[#745DF3] hover:translate-x-1 transition-transform">
                                     View Details
                                     <ChevronRight className="w-3.5 h-3.5" />
                                   </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100">
                      <Activity className="w-12 h-12 text-gray-100 mb-4" />
                      <p className="text-sm font-bold text-gray-400">No activity logs found matching your criteria.</p>
                    </div>
                  )}

                  {filteredItems.length > 0 && activities.length >= limit && (
                    <button 
                      onClick={handleLoadMore}
                      className="w-full py-6 border-2 border-dashed border-gray-100 rounded-[2rem] text-sm font-black text-gray-300 hover:text-[#745DF3] hover:border-[#745DF3]/20 hover:bg-[#745DF3]/5 transition-all"
                    >
                      Load More Activity
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
