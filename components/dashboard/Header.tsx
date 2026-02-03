'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, HelpCircle, X, ArrowRight, Activity, Send, Inbox, Users, Check, Clock, AlertCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import UserDropdown from './UserDropdown';

const notificationCategoryIcons: Record<string, any> = {
  email_events: Inbox,
  billing_alerts: AlertCircle,
  campaign_updates: Send,
  system: Bell,
};

export default function Header() {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{campaigns: any[], leads: any[]}>({ campaigns: [], leads: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.is_read) {
      try {
        await fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' });
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    
    if (n.link) {
      router.push(n.link);
      setShowNotifications(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults({ campaigns: [], leads: [] });
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        if (data.notification_prefs) {
          setNotifPrefs(data.notification_prefs);
        }
      } catch (error) {
        console.error('Failed to fetch notification prefs:', error);
      }
    };
    fetchPrefs();
  }, []);

  useEffect(() => {
    if (notifPrefs) {
      const filtered = notifications.filter(n => notifPrefs[n.category] !== false);
      setFilteredNotifications(filtered);
    } else {
      setFilteredNotifications(notifications);
    }
  }, [notifPrefs, notifications]);

  // Handle Command+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const quickLinks = [
    { name: 'Analytics', icon: Activity, href: '/dashboard/analytics' },
    { name: 'Campaigns', icon: Send, href: '/dashboard/campaigns' },
    { name: 'Inbox', icon: Inbox, href: '/dashboard/unibox' },
    { name: 'Teams', icon: Users, href: '/dashboard/team' },
  ];

  return (
    <>
      <header className="h-20 border-b border-gray-100 bg-white sticky top-0 z-50 flex items-center justify-between px-8">
        {/* Search Bar - Trigger */}
        <div className="flex-1 max-w-xl">
          <button 
            onClick={() => setShowSearch(true)}
            className="w-full relative group flex items-center"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-[#745DF3] transition-colors" />
            <div className="w-full bg-gray-50 border border-transparent hover:border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-gray-400 text-left outline-none transition-all flex items-center justify-between">
              <span>Search anything...</span>
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-gray-200/50 text-[10px] font-black text-gray-400 border border-gray-200 uppercase tracking-tighter">
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <a 
              href="https://help.tryleadflow.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-11 h-11 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-[#745DF3] transition-all border border-transparent hover:border-gray-100 relative group"
            >
              <HelpCircle className="w-5 h-5" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#101828] text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Help Center
              </div>
            </a>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all border ${
                  showNotifications 
                    ? 'bg-[#745DF3]/5 text-[#745DF3] border-[#745DF3]/20' 
                    : 'hover:bg-gray-50 text-gray-400 hover:text-[#745DF3] border-transparent hover:border-gray-100'
                } relative group`}
              >
                <Bell className="w-5 h-5" />
                {filteredNotifications.some(n => !n.is_read) && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#745DF3] border-2 border-white ring-4 ring-[#745DF3]/5" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowNotifications(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-[400px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 z-20 overflow-hidden"
                    >
                      <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0">
                        <div>
                          <h3 className="text-xl font-black text-[#101828]">Notifications</h3>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mt-1">
                            You have {filteredNotifications.filter(n => !n.is_read).length} unread messages
                          </p>
                        </div>
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-xs font-black text-[#745DF3] hover:underline"
                        >
                          Mark all as read
                        </button>
                      </div>

                      <div className="max-h-[450px] overflow-y-auto no-scrollbar">
                        {filteredNotifications.length > 0 ? (
                          filteredNotifications.map((n) => {
                            const Icon = notificationCategoryIcons[n.category] || Bell;
                            return (
                              <div 
                                key={n.id} 
                                onClick={() => handleNotificationClick(n)}
                                className={`p-6 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group ${!n.is_read ? 'bg-[#745DF3]/[0.02]' : ''}`}
                              >
                                <div className="flex gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                    n.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                                    n.type === 'warning' ? 'bg-orange-50 text-orange-500' : 
                                    n.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                                  } group-hover:scale-110 transition-transform relative`}>
                                    <Icon className="w-6 h-6" />
                                    {!n.is_read && (
                                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#745DF3] border-2 border-white rounded-full" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-1">
                                      <h4 className={`text-sm font-black text-[#101828] ${!n.is_read ? 'text-[#745DF3]' : ''}`}>{n.title}</h4>
                                      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-2">
                                        {formatRelativeTime(n.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-[13px] font-medium text-gray-500 leading-relaxed">{n.description}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                              <Bell className="w-8 h-8 text-gray-200" />
                            </div>
                            <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Inbox Zero!</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1">No notifications to show right now.</p>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-gray-50/50">
                        <button 
                          onClick={() => { setShowNotifications(false); router.push('/dashboard/notifications'); }}
                          className="w-full py-4 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-500 hover:text-[#745DF3] hover:border-[#745DF3]/20 transition-all flex items-center justify-center gap-2 group"
                        >
                          View All Notifications
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-100" />

          <UserDropdown />
        </div>
      </header>

      {/* Global Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(false)}
              className="absolute inset-0 bg-[#0A0A0B]/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="p-6 flex items-center gap-4 border-b border-gray-50">
                <Search className="w-6 h-6 text-[#745DF3]" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Type to search campaigns, leads, or commands..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-xl font-bold text-[#101828] placeholder-gray-300 focus:ring-0 outline-none"
                />
                <button 
                  onClick={() => setShowSearch(false)}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-[#101828] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    {query.length >= 2 ? (
                      <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-2">
                          {isSearching ? 'Searching...' : 'Search Results'}
                        </h3>
                        <div className="space-y-6">
                          {searchResults.campaigns.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest mb-3 px-2">Campaigns</p>
                              <div className="space-y-1">
                                {searchResults.campaigns.map((c) => (
                                  <button
                                    key={c.id}
                                    onClick={() => { setShowSearch(false); router.push('/dashboard/campaigns'); }}
                                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 text-[#101828] transition-all group"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-[#745DF3]/5 flex items-center justify-center text-[#745DF3]">
                                      <Send className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-bold">{c.name}</p>
                                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{c.status}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {searchResults.leads.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 px-2">Leads</p>
                              <div className="space-y-1">
                                {searchResults.leads.map((l) => (
                                  <button
                                    key={l.id}
                                    onClick={() => { setShowSearch(false); router.push('/dashboard/contacts'); }}
                                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 text-[#101828] transition-all group"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                      <Users className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-bold">{l.first_name} {l.last_name}</p>
                                      <p className="text-[10px] font-medium text-gray-400">{l.email}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {!isSearching && searchResults.campaigns.length === 0 && searchResults.leads.length === 0 && (
                            <div className="p-4 text-center">
                              <p className="text-sm font-bold text-gray-400">No results found for "{query}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Quick Navigation</h3>
                        <div className="space-y-1">
                          {quickLinks.map((link) => (
                            <button
                              key={link.name}
                              onClick={() => { setShowSearch(false); router.push(link.href); }}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-[#745DF3]/5 text-[#101828] hover:text-[#745DF3] transition-all group border border-transparent hover:border-[#745DF3]/10"
                            >
                              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-[#745DF3]/10">
                                <link.icon className="w-5 h-5" />
                              </div>
                              <span className="font-black text-sm">{link.name}</span>
                              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Commands</h3>
                    <div className="space-y-3 px-2">
                       {[
                         { name: 'Create Campaign', cmd: 'c c', icon: Plus },
                         { name: 'Import Leads', cmd: 'i l', icon: Users },
                         { name: 'System Status', cmd: 's s', icon: Activity },
                       ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-gray-50 rounded-xl transition-all">
                          <div className="flex items-center gap-3">
                            <item.icon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-bold text-gray-500 group-hover:text-[#101828] transition-colors">{item.name}</span>
                          </div>
                          <div className="flex gap-1">
                            {item.cmd.split(' ').map(k => (
                              <kbd key={k} className="px-2 py-0.5 rounded-lg bg-gray-50 text-[10px] font-black text-gray-400 border border-gray-100">{k.toUpperCase()}</kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-10 p-6 bg-gradient-to-br from-[#745DF3] to-[#9281f7] rounded-[2rem] text-white">
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mb-2">New Feature</p>
                      <h4 className="text-xl font-black mb-3">AI Deep Search</h4>
                      <p className="text-xs font-bold opacity-90 leading-relaxed mb-4">Search across lead intent and email sentiment using natural language.</p>
                      <button className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-[11px] font-black transition-all">
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-5 mt-auto flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-white text-[10px] font-black text-gray-400 border border-gray-200">↑↓</kbd>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Navigate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-white text-[10px] font-black text-gray-400 border border-gray-200">ESC</kbd>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Close</span>
                  </div>
                </div>
                <div className="text-[10px] font-black text-[#745DF3] uppercase tracking-[0.2em]">POWERED BY AI</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
