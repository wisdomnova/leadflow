'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Search, 
  Filter, 
  Inbox, 
  AlertCircle, 
  Send, 
  Check, 
  Clock, 
  ArrowRight,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  X,
  ChevronRight
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { useRouter } from 'next/navigation';

const categoryIcons: Record<string, any> = {
  email_events: Inbox,
  billing_alerts: AlertCircle,
  campaign_updates: Send,
  system: Bell,
};

const typeColors: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-500 border-emerald-100',
  warning: 'bg-orange-50 text-orange-500 border-orange-100',
  error: 'bg-red-50 text-red-500 border-red-100',
  info: 'bg-blue-50 text-blue-500 border-blue-100',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleNotificationClick = (n: any) => {
    if (!n.is_read) {
      handleMarkAsRead(n.id);
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === 'all' || !n.is_read;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const timeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h1 className="text-3xl font-black text-[#101828] tracking-tight">Notifications</h1>
                <p className="text-gray-500 font-medium mt-1">Stay updated with your campaign performance and account alerts.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleMarkAllRead}
                  className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-500 hover:text-[#745DF3] hover:border-[#745DF3]/20 transition-all flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark all as read
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="flex p-1 bg-gray-50 rounded-xl w-fit">
                <button 
                  onClick={() => setFilter('all')}
                  className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${filter === 'all' ? 'bg-white text-[#101828] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilter('unread')}
                  className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${filter === 'unread' ? 'bg-white text-[#101828] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Unread
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-[#745DF3]/10 text-[#745DF3] text-[10px] rounded-md">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#745DF3]/10 rounded-2xl text-sm font-bold w-full md:w-80 outline-none transition-all"
                />
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-[#745DF3] mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading your inbox...</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((n, i) => {
                      const Icon = categoryIcons[n.category] || Bell;
                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.05 }}
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`group relative bg-white p-6 rounded-[2rem] border transition-all cursor-pointer flex items-center gap-6 ${
                            !n.is_read 
                              ? 'border-[#745DF3]/20 bg-[#745DF3]/[0.01] shadow-lg shadow-[#745DF3]/5' 
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                          }`}
                        >
                          {!n.is_read && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#745DF3] rounded-r-full shadow-[0_0_20px_0_rgba(116,93,243,0.5)]" />
                          )}

                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-110 ${typeColors[n.type] || typeColors.info}`}>
                            <Icon className="w-7 h-7" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className={`text-lg font-black tracking-tight truncate ${!n.is_read ? 'text-[#101828]' : 'text-gray-600'}`}>
                                {n.title}
                              </h3>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                                <Clock className="w-3 h-3" />
                                {timeAgo(n.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-2xl">
                              {n.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            {!n.is_read && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                                className="p-3 bg-white border border-gray-100 rounded-xl text-emerald-500 hover:bg-emerald-50 transition-all shadow-sm"
                                title="Mark as read"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                            )}
                            {n.link && (
                              <div className="p-3 bg-[#101828] text-white rounded-xl shadow-lg">
                                <ChevronRight className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="bg-white p-20 rounded-[3rem] border border-gray-100 shadow-sm text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-gray-100">
                    <Bell className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-2xl font-black text-[#101828] mb-2 font-jakarta tracking-tight uppercase tracking-tighter">
                    No notifications
                  </h3>
                  <p className="text-gray-400 font-medium max-w-xs mx-auto">
                    {searchQuery 
                      ? "No notifications match your current search." 
                      : filter === 'unread' 
                        ? "You've read everything! Taking a break is highly recommended."
                        : "Your notification inbox is currently empty."}
                  </p>
                  {filter === 'unread' && notifications.length > 0 && (
                    <button 
                      onClick={() => setFilter('all')}
                      className="mt-8 px-8 py-3 bg-[#101828] text-white rounded-2xl text-sm font-black hover:bg-black transition-all shadow-xl shadow-[#101828]/10"
                    >
                      View All History
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Pagination / Footer */}
            {filteredNotifications.length > 0 && (
              <div className="mt-12 text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                  Showing {filteredNotifications.length} of {notifications.length} notifications
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
