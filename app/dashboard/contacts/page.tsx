'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { 
  Users, 
  UserPlus, 
  Upload, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Tag as TagIcon,
  Plus,
  Download,
  Trash2,
  ChevronRight,
  TrendingUp,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  Zap,
  Clock,
  Activity
} from 'lucide-react';

const contactStatsMapping = [
  { name: 'Total Contacts', icon: Users, status: null },
  { name: 'Active Leads', icon: UserPlus, status: 'Active' },
  { name: 'Unsubscribed', icon: Trash2, status: 'Unsubscribed' },
  { name: 'Bounce Rate', icon: AlertCircle, status: 'Bounced' },
];

export default function ContactsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [bulkTagName, setBulkTagName] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');

  const [isPushing, setIsPushing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });

  // New Contact State
  const [newContact, setNewContact] = useState({ firstName: '', lastName: '', email: '', company: '', tag: 'Enterprise' });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handlePushToCRM = async (id: string) => {
    setIsPushing(id);
    try {
      const res = await fetch('/api/crm/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Contact pushed to CRM');
      } else {
        showToast(data.error || 'Failed to push to CRM', 'error');
      }
    } catch (err) {
      showToast('Failed to push to CRM', 'error');
    } finally {
      setIsPushing(null);
    }
  };

  const handleBulkPushToCRM = async () => {
    if (selectedIds.length === 0) return;
    setIsPushing('bulk');
    let successCount = 0;
    
    for (const id of selectedIds) {
      try {
        const res = await fetch('/api/crm/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: id })
        });
        if (res.ok) successCount++;
      } catch (err) {
        console.error(`Failed to push ${id}:`, err);
      }
    }
    
    showToast(`Successfully pushed ${successCount} contacts to CRM`);
    setIsPushing(null);
    setSelectedIds([]);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    if (selectedContact) {
      fetchActivity(selectedContact.id);
    } else {
      setActivities([]);
    }
  }, [selectedContact]);

  const fetchActivity = async (id: string) => {
    setIsLoadingActivity(true);
    try {
      const res = await fetch(`/api/leads/${id}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error("Failed to fetch activity:", err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (tagFilter) params.append('tag', tagFilter);
      params.append('page', currentPage.toString());
      params.append('limit', '10');

      if (statusFilter) {
        const statusMap: Record<string, string> = {
          'Active': 'new',
          'Unsubscribed': 'unsubscribed',
          'Bounced': 'bounced'
        };
        params.append('status', statusMap[statusFilter] || statusFilter.toLowerCase());
      }
      
      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.leads || []);
        setTotal(data.total || 0);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const dynamicContactStats = [
    { name: 'Total Contacts', value: stats?.total?.toLocaleString() || '0', change: '', icon: Users, status: null },
    { name: 'Active Leads', value: ((stats?.new || 0) + (stats?.in_progress || 0)).toLocaleString() || '0', change: '', icon: UserPlus, status: 'Active' },
    { name: 'Unsubscribed', value: stats?.unsubscribed?.toLocaleString() || '0', change: '', icon: Trash2, status: 'Unsubscribed' },
    { name: 'Bounce Rate', value: stats?.total > 0 ? `${(stats?.bounced / stats?.total * 100).toFixed(1)}%` : '0%', change: '', icon: AlertCircle, status: 'Bounced' },
  ];

  const toggleSelectAll = () => {
    const currentPageIds = contacts.map(c => c.id);
    const allCurrentSelected = currentPageIds.every(id => selectedIds.includes(id));

    if (allCurrentSelected && currentPageIds.length > 0) {
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleStar = async (id: string, isStarred: boolean) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_fields: { ...contacts.find(c => c.id === id).custom_fields, isStarred: !isStarred } })
      });
      if (res.ok) {
        setContacts(prev => prev.map(c => 
          c.id === id ? { ...c, custom_fields: { ...c.custom_fields, isStarred: !isStarred } } : c
        ));
      }
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} contacts?`)) return;

    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      
      if (res.ok) {
        setContacts(prev => prev.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
        fetchContacts(); // Refresh stats
      }
    } catch (err) {
      console.error("Failed to delete contacts:", err);
    }
  };

  const handleExport = () => {
    const selectedLeads = contacts.filter(c => selectedIds.includes(c.id));
    if (selectedLeads.length === 0) return;

    const headers = ['First Name', 'Last Name', 'Email', 'Company', 'Status', 'Tags'];
    const csvContent = [
      headers.join(','),
      ...selectedLeads.map(l => [
        l.first_name,
        l.last_name,
        l.email,
        l.company || '',
        l.status,
        (l.tags || []).join(';')
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkTag = async () => {
    if (!bulkTagName.trim()) return;
    
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids: selectedIds,
          tags: [bulkTagName] 
        })
      });

      if (res.ok) {
        setContacts(prev => prev.map(c => 
          selectedIds.includes(c.id) ? { ...c, tags: [bulkTagName] } : c
        ));
        setSelectedIds([]);
        setBulkTagName('');
        setShowTagModal(false);
      }
    } catch (err) {
      console.error("Failed to bulk tag:", err);
    }
  };

  const handleBulkStatus = async (status: string) => {
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids: selectedIds,
          status 
        })
      });

      if (res.ok) {
        setContacts(prev => prev.map(c => 
          selectedIds.includes(c.id) ? { ...c, status } : c
        ));
        setSelectedIds([]);
        setShowStatusModal(false);
        showToast(`Status updated to ${status}`);
        fetchContacts();
      }
    } catch (err) {
      console.error("Failed to bulk update status:", err);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.firstName || !newContact.email) return;
    
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newContact.firstName,
          last_name: newContact.lastName,
          email: newContact.email,
          company: newContact.company,
          tags: [newContact.tag]
        })
      });

      if (res.ok) {
        const contact = await res.json();
        setContacts(prev => [contact, ...prev]);
        setNewContact({ firstName: '', lastName: '', email: '', company: '', tag: 'Enterprise' });
        setShowAddModal(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add contact");
      }
    } catch (err) {
      console.error("Error adding contact:", err);
    }
  };

  const filteredContacts = contacts; // Filtering is handled by API

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    // Simple CSV parser for demo purposes (production would use a lib like PapaParse)
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const leads = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',');
          const lead: any = {};
          headers.forEach((header, i) => {
            const h = header.trim().toLowerCase();
            const v = values[i]?.trim();
            if (h === 'email') lead.email = v;
            if (h === 'first name' || h === 'firstname') lead.first_name = v;
            if (h === 'last name' || h === 'lastname') lead.last_name = v;
            if (h === 'company') lead.company = v;
          });
          return lead;
        });

        setUploadProgress(50);

        const res = await fetch('/api/leads/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leads })
        });

        if (res.ok) {
          setUploadProgress(100);
          setTimeout(() => {
            fetchContacts();
            setIsUploading(false);
            setShowUploadModal(false);
          }, 500);
        } else {
          const err = await res.json();
          alert(err.error || "Import failed");
          setIsUploading(false);
        }
      } catch (err) {
        console.error("Upload error:", err);
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-10">
            {/* Page Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-[#101828] tracking-tight">Contacts</h1>
                <p className="text-gray-500 font-medium mt-1">Manage your leads, segment lists, and track engagement.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-[#101828] hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Upload className="w-4 h-4 text-[#745DF3]" />
                  Import CSV
                </button>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-[#101828] rounded-2xl text-sm font-bold text-white hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 group"
                >
                  <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Add Contact
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {dynamicContactStats.map((stat, i) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setStatusFilter(stat.status)}
                  className={`bg-white p-6 rounded-3xl border transition-all group cursor-pointer ${
                    statusFilter === stat.status 
                    ? 'border-[#745DF3] shadow-lg shadow-[#745DF3]/5' 
                    : 'border-gray-100 hover:border-[#745DF3]/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      statusFilter === stat.status 
                      ? 'bg-[#745DF3] text-white' 
                      : 'bg-[#745DF3]/5 text-[#745DF3] group-hover:bg-[#745DF3] group-hover:text-white'
                    }`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em] leading-none mb-1.5">{stat.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-black text-[#101828] tracking-tighter">{stat.value}</p>
                        {stat.change && (
                          <span className={`text-[10px] font-bold ${stat.change.startsWith('+') ? 'text-emerald-500 bg-emerald-50' : 'text-blue-500 bg-blue-50'} px-1.5 py-0.5 rounded-md flex items-center gap-0.5`}>
                            <TrendingUp className="w-2.5 h-2.5" />
                            {stat.change}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Contacts Table Section */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden relative">
              {/* Bulk Actions Bar */}
              <AnimatePresence>
                {selectedIds.length > 0 && (
                  <motion.div 
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    exit={{ y: -100 }}
                    className="absolute top-0 left-0 right-0 z-10 bg-[#101828] p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-6 px-4">
                      <span className="text-white text-sm font-bold">{selectedIds.length} leads selected</span>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={handleBulkPushToCRM}
                          disabled={isPushing === 'bulk'}
                          className="flex items-center gap-2 text-[#745DF3] hover:text-[#9281f7] transition-colors text-sm font-black uppercase tracking-widest"
                        >
                          {isPushing === 'bulk' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                          Push to CRM
                        </button>
                        <button 
                          onClick={() => setShowTagModal(true)}
                          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold"
                        >
                          <TagIcon className="w-4 h-4" />
                          Tag Leads
                        </button>
                        <button 
                          onClick={handleExport}
                          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold"
                        >
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                        <button 
                          onClick={handleDeleteSelected}
                          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-bold"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedIds([])}
                      className="text-gray-400 hover:text-white p-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table Header / Filters */}
              <div className="p-8 pb-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1 max-w-md relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#745DF3] transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search by name, email, or tag..."
                      className="w-full bg-gray-50 border border-transparent focus:border-[#745DF3] focus:bg-white rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {statusFilter && (
                    <button 
                      onClick={() => setStatusFilter(null)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#745DF3]/5 text-[#745DF3] rounded-lg text-xs font-bold border border-[#745DF3]/10 hover:bg-[#745DF3]/10 transition-all"
                    >
                      {statusFilter}
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {tagFilter && (
                    <button 
                      onClick={() => setTagFilter(null)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#101828] text-white rounded-lg text-xs font-bold border border-[#101828]/10 hover:bg-[#101828]/90 transition-all"
                    >
                      Tag: {tagFilter}
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative group/filter">
                    <button className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:text-[#101828] transition-all">
                      <Filter className="w-4 h-4" />
                      Status
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-2xl z-20 py-2 hidden group-hover/filter:block">
                      {['All', 'Active', 'Unsubscribed', 'Bounced'].map(status => (
                        <button 
                          key={status}
                          onClick={() => setStatusFilter(status === 'All' ? null : status)}
                          className={`w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${statusFilter === status ? 'text-[#745DF3] bg-[#745DF3]/5' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (selectedIds.length > 0) setShowTagModal(true);
                      else showToast('Select contacts to tag', 'error');
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:text-[#101828] transition-all"
                  >
                    <TagIcon className="w-4 h-4" />
                    Tag
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedIds.length > 0) setShowStatusModal(true);
                      else showToast('Select contacts to update status', 'error');
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:text-[#101828] transition-all"
                  >
                    <Activity className="w-4 h-4" />
                    Status
                  </button>
                  <div className="w-px h-8 bg-gray-100 mx-2" />
                  <button 
                    onClick={() => {
                      if (selectedIds.length > 0) handleExport();
                      else showToast('Select contacts to export', 'error');
                    }}
                    className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#101828] transition-all"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={async () => {
                      if (selectedIds.length > 0) {
                        if (confirm(`Delete ${selectedIds.length} contacts?`)) {
                          const res = await fetch('/api/leads/bulk', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ids: selectedIds })
                          });
                          if (res.ok) {
                            setContacts(prev => prev.filter(c => !selectedIds.includes(c.id)));
                            setSelectedIds([]);
                            showToast('Contacts deleted');
                            fetchContacts();
                          }
                        }
                      } else {
                        showToast('Select contacts to delete', 'error');
                      }
                    }}
                    className="p-3 bg-white border border-gray-100 rounded-xl text-red-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-8 py-4 text-left">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-200 text-[#745DF3] focus:ring-[#745DF3]" 
                          checked={contacts.length > 0 && contacts.every(c => selectedIds.includes(c.id))}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Tag / List</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Last Activity</th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <AnimatePresence mode="popLayout">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="w-8 h-8 text-[#745DF3] animate-spin" />
                              <p className="text-sm font-bold text-gray-400 capitalize">Loading contacts...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredContacts.length > 0 ? filteredContacts.map((contact) => (
                        <motion.tr 
                          layout
                          key={contact.id} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => setSelectedContact(contact)}
                          className={`hover:bg-gray-50 transition-colors group cursor-pointer ${selectedIds.includes(contact.id) ? 'bg-blue-50/30' : ''}`}
                        >
                          <td className="px-8 py-5">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-200 text-[#745DF3] focus:ring-[#745DF3]" 
                              checked={selectedIds.includes(contact.id)}
                              onChange={() => toggleSelect(contact.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#101828] font-bold text-xs uppercase overflow-hidden">
                                  {contact.first_name?.[0] || '?'}{contact.last_name?.[0] || ''}
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStar(contact.id, contact.custom_fields?.isStarred);
                                  }}
                                  className="absolute -top-1 -right-1"
                                >
                                  <Star 
                                    className={`w-4 h-4 ${contact.custom_fields?.isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-gray-400'} transition-colors`} 
                                  />
                                </button>
                              </div>
                              <div>
                                <p className="font-bold text-[#101828] text-sm group-hover:text-[#745DF3] transition-colors">
                                  {contact.first_name} {contact.last_name}
                                </p>
                                <p className="text-xs text-gray-400 font-medium">{contact.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {contact.tags && contact.tags.length > 0 ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTagFilter(contact.tags[0]);
                                }}
                                className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold border border-gray-100 hover:border-[#745DF3]/40 transition-all cursor-pointer"
                              >
                                {contact.tags[0]}
                              </button>
                            ) : (
                              <span className="text-gray-300 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              contact.status === 'new' ? 'bg-emerald-50 text-emerald-600' : 
                              contact.status === 'unsubscribed' ? 'bg-orange-50 text-orange-600' : 
                              'bg-red-50 text-red-600'
                            }`}>
                              {contact.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 font-bold text-gray-400 text-xs">
                            {contact.last_contacted_at ? new Date(contact.last_contacted_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePushToCRM(contact.id);
                                }}
                                disabled={isPushing === contact.id}
                                className="p-2 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-[#745DF3] hover:shadow-sm"
                                title="Push to CRM"
                              >
                                {isPushing === contact.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-[#745DF3]" />
                                ) : (
                                  <Zap className="w-4 h-4" />
                                )}
                              </button>
                              
                              <div className="relative group/actions">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                  className="p-2 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-[#101828] hover:shadow-sm"
                                >
                                  <MoreHorizontal className="w-5 h-5" />
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-2xl z-20 py-2 hidden group-hover/actions:block">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedContact(contact);
                                    }}
                                    className="w-full text-left px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Users className="w-4 h-4" />
                                    View Details
                                  </button>
                                  <button 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm(`Delete ${contact.first_name}?`)) {
                                        const res = await fetch(`/api/leads/${contact.id}`, { method: 'DELETE' });
                                        if (res.ok) {
                                          setContacts(prev => prev.filter(c => c.id !== contact.id));
                                          showToast('Contact deleted');
                                        }
                                      }
                                    }}
                                    className="w-full text-left px-5 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Contact
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Users className="w-12 h-12 text-gray-200" />
                              <p className="text-sm font-bold text-gray-400 capitalize">No contacts found.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-8 border-t border-gray-50 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Showing {total > 0 ? (currentPage - 1) * 10 + 1 : 0} to {Math.min(currentPage * 10, total)} of {total} contacts
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="px-4 py-2 border border-gray-100 rounded-lg text-xs font-bold text-[#101828] hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage * 10 >= total || isLoading}
                    className="px-4 py-2 border border-gray-100 rounded-lg text-xs font-bold text-[#101828] hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Tag Modal */}
            <AnimatePresence>
              {showTagModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowTagModal(false)}
                    className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden text-center"
                  >
                    <div className="w-16 h-16 bg-[#745DF3]/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#745DF3]">
                      <TagIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-[#101828] tracking-tight mb-2">Tag Leads</h2>
                    <p className="text-sm text-gray-500 font-medium mb-8">Apply a tag to the {selectedIds.length} selected leads.</p>
                    
                    <input 
                      type="text" 
                      placeholder="e.g. Q1 Prospect"
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#745DF3] rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all mb-6"
                      value={bulkTagName}
                      onChange={(e) => setBulkTagName(e.target.value)}
                      autoFocus
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setShowTagModal(false)}
                        className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold text-sm hover:text-[#101828] transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleBulkTag}
                        disabled={!bulkTagName.trim()}
                        className="py-4 bg-[#101828] text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        Apply Tag
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Status Modal */}
            <AnimatePresence>
              {showStatusModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowStatusModal(false)}
                    className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden text-center"
                  >
                    <div className="w-16 h-16 bg-[#745DF3]/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#745DF3]">
                      <Activity className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-[#101828] tracking-tight mb-2">Update Status</h2>
                    <p className="text-sm text-gray-500 font-medium mb-8">Change status for {selectedIds.length} selected leads.</p>
                    
                    <div className="space-y-2 mb-8">
                      {['new', 'in_progress', 'converted', 'unsubscribed', 'bounced'].map((s) => (
                        <button 
                          key={s}
                          onClick={() => handleBulkStatus(s)}
                          className="w-full py-3 bg-gray-50 hover:bg-[#745DF3]/5 hover:text-[#745DF3] rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-gray-600"
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setShowStatusModal(false)}
                      className="w-full py-4 text-gray-400 font-bold text-sm hover:text-[#101828] transition-all"
                    >
                      Cancel
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Upload Modal Overlay */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 pb-0 flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#101828] tracking-tight">Import Contacts</h2>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {!isUploading ? (
                  <label className="p-12 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:border-[#745DF3]/40 transition-all cursor-pointer bg-gray-50/50">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                      <FileText className="w-8 h-8 text-[#745DF3]" />
                    </div>
                    <h3 className="text-lg font-black text-[#101828] mb-1">Click to upload or drag and drop</h3>
                    <p className="text-sm text-gray-400 font-medium">CSV files only (Max. 10MB)</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".csv" 
                      onChange={handleFileUpload}
                    />
                  </label>
                ) : (
                  <div className="p-12 border-2 border-gray-50 rounded-[2rem] flex flex-col items-center justify-center text-center bg-gray-50/30">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm relative overflow-hidden">
                      <Loader2 className="w-8 h-8 text-[#745DF3] animate-spin relative z-10" />
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${uploadProgress}%` }}
                        className="absolute bottom-0 left-0 right-0 bg-[#745DF3]/10"
                      />
                    </div>
                    <h3 className="text-lg font-black text-[#101828] mb-1">Processing File...</h3>
                    <p className="text-sm text-gray-400 font-medium mb-6">Analyzing headers and validating records</p>
                    
                    <div className="w-full max-w-xs bg-gray-100 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-[#745DF3]"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-[#745DF3] mt-2 uppercase tracking-widest">{uploadProgress}% Complete</p>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Quick Tips</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-[#101828]">Include Headers</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Make sure your first row has Name and Email titles.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-[#101828]">Proper Encoding</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Use UTF-8 encoding for the best results.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 flex items-center gap-4">
                <button 
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-sm text-gray-500 hover:text-[#101828] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                {!isUploading && (
                  <label className="flex-2 py-4 bg-[#101828] text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all px-12 group cursor-pointer text-center">
                    Select File
                    <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                  </label>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 pb-0 flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#101828] tracking-tight">Add New Contact</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddContact} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">First Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#745DF3] focus:bg-white rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all"
                      placeholder="e.g. John"
                      value={newContact.firstName}
                      onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#745DF3] focus:bg-white rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all"
                      placeholder="e.g. Doe"
                      value={newContact.lastName}
                      onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#745DF3] focus:bg-white rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all"
                    placeholder="name@company.com"
                    value={newContact.email}
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Company</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#745DF3] focus:bg-white rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all"
                    placeholder="e.g. Acme Corp"
                    value={newContact.company}
                    onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Assign Tag</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#745DF3] focus:bg-white rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all appearance-none"
                    value={newContact.tag}
                    onChange={(e) => setNewContact({...newContact, tag: e.target.value})}
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="SaaS Founder">SaaS Founder</option>
                    <option value="High Priority">High Priority</option>
                    <option value="Inbound">Inbound</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-sm text-gray-500 hover:text-[#101828] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-[#745DF3] text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#745DF3]/20"
                  >
                    Add Contact
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Tag Modal */}
      <AnimatePresence>
        {showTagModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTagModal(false)}
              className="absolute inset-0 bg-[#101828]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8"
            >
              <h2 className="text-xl font-black text-[#101828] mb-2">Tag {selectedIds.length} Leads</h2>
              <p className="text-sm text-gray-500 font-medium mb-6">Enter a tag to apply to all selected contacts.</p>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g. VIP Customer"
                  className="w-full bg-gray-50 border border-gray-100 focus:border-[#745DF3] focus:bg-white rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all"
                  value={bulkTagName}
                  onChange={(e) => setBulkTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBulkTag()}
                />
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowTagModal(false)}
                    className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-bold text-xs text-gray-500 hover:text-[#101828] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleBulkTag}
                    disabled={!bulkTagName.trim()}
                    className="flex-1 py-3 bg-[#745DF3] text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-[#745DF3]/20"
                  >
                    Apply Tag
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contact Details Panel */}
      <AnimatePresence>
        {selectedContact && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContact(null)}
              className="absolute inset-0 bg-[#101828]/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-gray-50">
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={() => setSelectedContact(null)}
                    className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all">
                      <Star className={`w-5 h-5 ${selectedContact.custom_fields?.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-[2rem] bg-gray-100 flex items-center justify-center text-[#101828] font-black text-2xl uppercase mb-6 shadow-sm">
                    {selectedContact.first_name?.[0] || '?'}{selectedContact.last_name?.[0] || ''}
                  </div>
                  <h2 className="text-2xl font-black text-[#101828] tracking-tight">{selectedContact.first_name} {selectedContact.last_name}</h2>
                  <p className="text-gray-500 font-medium mb-4">{selectedContact.email}</p>
                  <div className="flex items-center gap-2">
                    {selectedContact.tags?.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold border border-gray-100">
                        {tag}
                      </span>
                    ))}
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      selectedContact.status === 'new' ? 'bg-emerald-50 text-emerald-600' : 
                      selectedContact.status === 'unsubscribed' ? 'bg-orange-50 text-orange-600' : 
                      'bg-red-50 text-red-600'
                    }`}>
                      {selectedContact.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Contact Activity</h3>
                  <div className="space-y-4">
                    {isLoadingActivity ? (
                      <div className="flex flex-col items-center py-10 gap-3">
                        <Loader2 className="w-6 h-6 text-[#745DF3] animate-spin" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading history...</p>
                      </div>
                    ) : activities.length > 0 ? activities.map((item, i) => (
                      <div key={item.id || i} className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer group border border-transparent hover:border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#745DF3] transition-colors">
                          {item.type === 'email_opened' ? <Clock className="w-5 h-5" /> : 
                           item.type === 'email_sent' ? <Mail className="w-5 h-5" /> :
                           item.type === 'lead_created' ? <Plus className="w-5 h-5" /> :
                           item.type === 'lead_tagged' ? <TagIcon className="w-5 h-5" /> :
                           <TrendingUp className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#101828] capitalize">{item.type?.replace(/_/g, ' ')}</p>
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5">{item.description}</p>
                          <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">
                            {new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed"> No activity logged for this <br/> contact yet. </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Engagement Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Opens</p>
                      <p className="text-xl font-black text-[#101828]">
                        {activities.filter(a => a.type === 'email_opened').length}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Clicks</p>
                      <p className="text-xl font-black text-[#101828]">
                        {activities.filter(a => a.type === 'email_clicked').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex items-center gap-3">
                <button 
                  onClick={() => window.location.href = `mailto:${selectedContact.email}`}
                  className="flex-1 py-4 bg-[#101828] text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
                <button 
                  onClick={async () => {
                    if (confirm(`Delete ${selectedContact.first_name}?`)) {
                      const res = await fetch(`/api/leads/${selectedContact.id}`, { method: 'DELETE' });
                      if (res.ok) {
                        setContacts(prev => prev.filter(c => c.id !== selectedContact.id));
                        setSelectedContact(null);
                        showToast('Contact deleted');
                      }
                    }
                  }}
                  className="p-4 bg-white border border-gray-200 text-red-500 rounded-2xl hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={`fixed bottom-8 right-8 z-[100] ${toast.type === 'success' ? 'bg-[#101828]' : 'bg-red-600'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3`}
          >
            <div className={`w-8 h-8 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-white/20'} flex items-center justify-center`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-white" /> : <AlertCircle className="w-4 h-4 text-white" />}
            </div>
            <span className="text-sm font-bold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
