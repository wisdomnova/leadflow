'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import SubscriptionGuard from '@/components/dashboard/SubscriptionGuard';
import { 
  Inbox, 
  Search, 
  MoreHorizontal, 
  Star,
  CheckCircle2,
  Zap,
  ChevronDown,
  SquareArrowOutUpRight,
  RefreshCw,
  Send,
  Loader2
} from 'lucide-react';

const filters = ['All', 'Interested', 'Follow-up', 'Out of Office', 'Not Interested', 'Closed Won'];

/** Decode HTML entities and strip the quoted reply thread */
function cleanMessage(text: string): string {
  if (!text) return '';
  // Decode common HTML entities
  const decoded = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Strip quoted reply thread: remove everything from "On [date]...wrote:" onwards
  const quoteIdx = decoded.search(/\bOn [\s\S]{5,80}?wrote:/);
  const stripped = quoteIdx > 0 ? decoded.slice(0, quoteIdx).trim() : decoded.trim();
  return stripped || decoded.trim();
}

export default function UniboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showInboxesDropdown, setShowInboxesDropdown] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [activeFilter]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/unibox?filter=${activeFilter}&q=${searchQuery}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setConversations(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/unibox/sync', { method: 'POST' });
      if (res.ok) {
        setToastMsg('Inbox sync started successfully');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        // Refresh after a bit to let sync finish
        setTimeout(fetchConversations, 5000);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToCRM = async () => {
    const conv = conversations.find(c => c.id === selectedId);
    if (!selectedId || !conv?.isLinkedToLead) return;
    setIsPushing(true);
    try {
      const res = await fetch('/api/crm/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedId })
      });
      const result = await res.json();
      if (res.ok) {
        setToastMsg('Lead successfully pushed to CRM');
      } else {
        setToastMsg(result.error || 'Failed to push to CRM');
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Push error:', error);
      setToastMsg('Failed to push to CRM');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsPushing(false);
    }
  };

  const handleToggleStar = async () => {
    const current = conversations.find(c => c.id === selectedId);
    if (!selectedId || !current?.isLinkedToLead) return;
    const newStar = !current.isStarred;
    
    // Optimistic update
    setConversations(prev => prev.map(c => 
      c.id === selectedId ? { ...c, isStarred: newStar } : c
    ));

    try {
      await fetch('/api/unibox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedId, isStarred: newStar })
      });
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    const current = conversations.find(c => c.id === selectedId);
    if (!selectedId || !current?.isLinkedToLead) return;

    // Optimistic update
    setConversations(prev => prev.map(c => 
      c.id === selectedId ? { ...c, status: newStatus } : c
    ));

    try {
      await fetch('/api/unibox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedId, status: newStatus })
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
    setShowStatusDropdown(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;
    setIsSending(true);
    
    try {
      const res = await fetch('/api/unibox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedConversation.isLinkedToLead ? selectedId : null,
          email: selectedConversation.email,
          subject: selectedConversation.subject,
          text: replyText
        })
      });

      if (res.ok) {
        const newMessage = { sender: 'you', text: replyText, time: new Date().toISOString() };
        setConversations(prev => prev.map(c => 
          c.id === selectedId 
            ? { ...c, messages: [...(c.messages || []), newMessage], preview: replyText, time: new Date().toISOString() } 
            : c
        ));
        setReplyText('');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedId);

  return (
    <div className="flex h-screen bg-[#FBFBFB] font-jakarta overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <div className="flex-1 flex overflow-hidden p-6 md:p-8 gap-6">
          <SubscriptionGuard>
            {/* <div className="flex-1 flex overflow-hidden gap-6"> */}
          {/* Inbox Sidebar */}
          <div className="w-full md:w-[400px] flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden shrink-0">
            <div className="p-6 border-b border-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-[#101828] tracking-tight">Messages</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSync}
                    className={`p-2 text-gray-400 hover:text-[#745DF3] transition-all hover:bg-[#745DF3]/5 rounded-lg ${isSyncing ? 'animate-spin text-[#745DF3]' : ''}`}
                    title="Sync Inboxes"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowInboxesDropdown(!showInboxesDropdown)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    
                    <AnimatePresence>
                      {showInboxesDropdown && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-2xl z-20 py-2"
                        >
                          <button 
                            onClick={() => { fetchConversations(); setShowInboxesDropdown(false); }}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Refresh
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search interactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
                  className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#745DF3]/20 transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                {filters.map(filter => (
                  <button 
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                      activeFilter === filter 
                        ? 'bg-[#101828] text-white shadow-lg shadow-[#101828]/10' 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 text-[#745DF3] animate-spin" />
                </div>
              ) : conversations.length > 0 ? (
                conversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedId(conv.id)}
                    className={`px-6 py-5 cursor-pointer transition-all border-l-4 relative ${
                      selectedId === conv.id 
                        ? 'bg-[#FBFBFB] border-[#745DF3]' 
                        : 'bg-transparent border-transparent hover:bg-[#FBFBFB]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-[#745DF3] to-[#9281f7] flex items-center justify-center text-white text-[13px] font-black shadow-lg shadow-[#745DF3]/20`}>
                          {conv.avatar || conv.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm tracking-tight truncate max-w-[140px] ${conv.unread ? 'font-black text-[#101828]' : 'font-bold text-gray-700'}`}>
                            {conv.name}
                          </p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{conv.company}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 tabular-nums">
                        {new Date(conv.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="pl-14">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[13px] mb-1 line-clamp-1 ${conv.unread ? 'font-black text-[#101828]' : 'font-bold text-gray-600'}`}>
                          {conv.subject}
                        </p>
                        {conv.isStarred && (
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1 font-medium leading-relaxed">
                        {cleanMessage(conv.preview)}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-sm font-black text-gray-400">No messages found</p>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 flex flex-col bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden min-w-0">
            {selectedConversation ? (
              <>
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white z-10 shrink-0">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl font-black text-[#745DF3]">
                      {selectedConversation.avatar || selectedConversation.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-[#101828] tracking-tight">{selectedConversation.name}</h3>
                        {selectedConversation.isLinkedToLead && (
                        <div className="relative">
                          <button 
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all outline-none border cursor-pointer hover:shadow-md ${
                              selectedConversation.status === 'Interested' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 
                              selectedConversation.status === 'Follow-up' ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' :
                              selectedConversation.status === 'Closed Won' ? 'bg-[#745DF3] text-white border-[#745DF3] hover:bg-[#6349e0]' :
                              selectedConversation.status === 'replied' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' :
                              'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {selectedConversation.status}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {showStatusDropdown && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute left-0 mt-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-2xl z-20 py-2"
                              >
                                {filters.filter(f => f !== 'All').map(status => (
                                  <button 
                                    key={status}
                                    onClick={() => handleUpdateStatus(status)}
                                    className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50"
                                  >
                                    {status}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-sm font-bold text-gray-400">{selectedConversation.company}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                        <span className="text-sm font-bold text-gray-400">{selectedConversation.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedConversation.isLinkedToLead && (
                      <button 
                        onClick={handleToggleStar}
                        className={`p-3.5 rounded-2xl transition-all ${
                          selectedConversation.isStarred 
                            ? 'bg-amber-50 text-amber-500' 
                            : 'bg-gray-50 text-gray-400 hover:text-[#745DF3]'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${selectedConversation.isStarred ? 'fill-amber-500' : ''}`} />
                      </button>
                    )}
                    {selectedConversation.isLinkedToLead && (
                      <>
                        <div className="w-[1px] h-8 bg-gray-100 mx-2" />
                        <button 
                          onClick={handlePushToCRM}
                          disabled={isPushing}
                          className="flex items-center gap-2 px-6 py-3.5 bg-[#101828] rounded-2xl text-[13px] font-black text-white hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/20 group disabled:opacity-50"
                        >
                          {isPushing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4 text-[#745DF3] fill-[#745DF3]" />
                          )}
                          Push to CRM
                          <SquareArrowOutUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar bg-gray-50/20">
                  <div className="flex items-center gap-4 py-4">
                    <div className="flex-1 h-[1px] bg-gray-100" />
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Recent Activity</span>
                    <div className="flex-1 h-[1px] bg-gray-100" />
                  </div>

                  {selectedConversation.messages?.map((msg: any, idx: number) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`max-w-3xl ${msg.sender === 'you' ? 'ml-auto flex flex-col items-end' : ''}`}
                    >
                      <div className={`flex items-center gap-3 mb-4 ${msg.sender === 'you' ? 'justify-end' : ''}`}>
                        {msg.sender === 'them' ? (
                          <>
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                              {selectedConversation.avatar || selectedConversation.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-black text-[#101828] uppercase tracking-widest">{selectedConversation.name}</span>
                            <span className="text-[11px] font-bold text-gray-300">
                              {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] font-bold text-gray-300">
                              {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[11px] font-black text-[#745DF3] uppercase tracking-widest">You</span>
                            <div className="w-8 h-8 rounded-xl bg-[#745DF3]/10 flex items-center justify-center text-[10px] font-black text-[#745DF3]">
                              ME
                            </div>
                          </>
                        )}
                      </div>
                      <div className={`p-8 shadow-sm ${
                        msg.sender === 'you' 
                          ? 'bg-[#101828] text-white rounded-[2.5rem] rounded-tr-none' 
                          : 'bg-white border border-gray-100 rounded-[2.5rem] rounded-tl-none'
                      }`}>
                        <p className={`text-base leading-relaxed whitespace-pre-wrap ${msg.sender === 'you' ? 'font-bold' : 'font-medium text-[#101828]'}`}>
                          {cleanMessage(msg.text)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-8 bg-white border-t border-gray-50 shrink-0">
                  <div className="bg-[#FBFBFB] rounded-[2.5rem] border border-gray-100 p-3 shadow-inner">
                    <textarea 
                      placeholder={`Reply to ${selectedConversation.name}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full bg-transparent border-none rounded-2xl text-[15px] font-medium p-4 focus:ring-0 resize-none min-h-[100px] outline-none"
                    />
                    
                    <div className="flex items-center justify-between mt-2 border-t border-gray-100 p-3 pt-4">
                      <div />
                      
                      <button 
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || isSending}
                        className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[13px] font-black transition-all ${
                          replyText.trim() && !isSending
                            ? 'bg-[#101828] text-white shadow-xl shadow-[#101828]/20' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isSending ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            Send Reply
                            <Send className="w-4 h-4 fill-current" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Inbox className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-[#101828] mb-2">No conversation selected</h3>
                <p className="text-gray-400 max-w-xs font-medium">Select a thread from the inbox to see the full conversation.</p>
              </div>
            )}
          </div>
          </SubscriptionGuard>
        </div>
      </main>

      {showToast && (
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-8 right-8 z-50 bg-[#101828] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold">{toastMsg}</span>
        </motion.div>
      )}
    </div>
  );
}
