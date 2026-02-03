'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import InternalLibraryModal from '@/components/dashboard/InternalLibraryModal';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Copy, 
  Trash2, 
  Edit3,
  Monitor,
  Smartphone,
  CheckCircle2,
  Clock,
  TrendingUp,
  Tag as TagIcon,
  ChevronRight,
  X,
  Zap,
  Layout,
  Star,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const categories = ['All', 'Cold Outreach', 'Follow-up', 'Onboarding', 'Newsletter', 'Support', 'Sales', 'Marketing'];

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'performance'>('recent');
  const [starredOnly, setStarredOnly] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'Cold Outreach'
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const templateStats = [
    { name: 'Total Templates', value: templates.length.toString(), change: '+', icon: FileText },
    { 
      name: 'Avg. Open Rate', 
      value: templates.length > 0 
        ? (templates.reduce((acc: number, t: any) => acc + (t.open_rate || 0), 0) / templates.length).toFixed(1) + '%' 
        : '0%', 
      change: '+', 
      icon: TrendingUp 
    },
    { 
      name: 'Avg. Reply Rate', 
      value: templates.length > 0 
        ? (templates.reduce((acc: number, t: any) => acc + (t.reply_rate || 0), 0) / templates.length).toFixed(1) + '%' 
        : '0%', 
      change: '+', 
      icon: Zap 
    },
    { 
      name: 'Starred Templates', 
      value: templates.filter((t: any) => t.is_starred).length.toString(), 
      change: '+', 
      icon: Star 
    },
  ];

  const filteredTemplates = templates
    .filter((template: any) => {
      const matchesTab = activeTab === 'All' || template.category === activeTab;
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (template.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStarred = !starredOnly || template.is_starred;
      return matchesTab && matchesSearch && matchesStarred;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'performance') return (b.open_rate || 0) - (a.open_rate || 0);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const handleToggleStar = async (id: string, currentStarred: boolean) => {
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: !currentStarred })
      });
      if (res.ok) {
        setTemplates(prev => prev.map((t: any) => 
          t.id === id ? { ...t, is_starred: !currentStarred } : t
        ));
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleDuplicate = async (template: any) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          name: `${template.name} (Copy)`,
          id: undefined,
          created_at: undefined,
          updated_at: undefined,
          is_starred: false,
          open_rate: 0,
          reply_rate: 0,
          use_count: 0
        })
      });
      if (res.ok) {
        const newTemplate = await res.json();
        setTemplates((prev: any[]) => [newTemplate, ...prev]);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates((prev: any[]) => prev.filter((t: any) => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        const res = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const updated = await res.json();
          setTemplates((prev: any[]) => prev.map((t: any) => t.id === updated.id ? updated : t));
        }
      } else {
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const newTemplate = await res.json();
          setTemplates((prev: any[]) => [newTemplate, ...prev]);
        }
      }
      setShowCreateModal(false);
      setEditingTemplate(null);
      setFormData({ name: '', subject: '', body: '', category: 'Cold Outreach' });
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({ 
      name: '', 
      subject: '', 
      body: '', 
      category: activeTab === 'All' ? 'Cold Outreach' : activeTab 
    });
    setShowCreateModal(true);
  };

  const openEditModal = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject || '',
      body: template.body || '',
      category: template.category || 'Cold Outreach'
    });
    setShowCreateModal(true);
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
                <h1 className="text-3xl font-black text-[#101828] tracking-tight">Templates</h1>
                <p className="text-gray-500 font-medium mt-1">Design, manage, and optimize your high-performing email templates.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowLibraryModal(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-[#101828] hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Layout className="w-4 h-4 text-[#745DF3]" />
                  Internal Library
                </button>
                <button 
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-5 py-3 bg-[#101828] rounded-2xl text-sm font-bold text-white hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Create Template
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {templateStats.map((stat, i) => (
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
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Template Directory */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    {categories.map((category) => {
                      const count = category === 'All' 
                        ? templates.length 
                        : templates.filter(t => t.category === category).length;
                      if (count === 0 && category !== 'All' && activeTab !== category) return null;
                      
                      return (
                        <button
                          key={category}
                          onClick={() => setActiveTab(category)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                            activeTab === category 
                              ? 'bg-[#745DF3]/5 text-[#745DF3]' 
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {category}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                            activeTab === category ? 'bg-[#745DF3]/10' : 'bg-gray-100'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium w-full md:w-64 focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className={`p-3 rounded-2xl transition-all ${
                          showFilterMenu || starredOnly || sortBy !== 'recent'
                            ? 'bg-[#745DF3]/10 text-[#745DF3]' 
                            : 'bg-gray-50 text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Filter className="w-5 h-5" />
                      </button>

                      <AnimatePresence>
                        {showFilterMenu && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowFilterMenu(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute right-0 mt-2 w-64 bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-200/50 p-4 z-20"
                            >
                              <div className="space-y-6">
                                <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Sort By</label>
                                  <div className="space-y-1">
                                    {[
                                      { id: 'recent', label: 'Recently Updated', icon: Clock },
                                      { id: 'name', label: 'Alphabetical', icon: FileText },
                                      { id: 'performance', label: 'Best Performance', icon: TrendingUp }
                                    ].map((option) => (
                                      <button
                                        key={option.id}
                                        onClick={() => {
                                          setSortBy(option.id as any);
                                          setShowFilterMenu(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                                          sortBy === option.id 
                                            ? 'bg-[#745DF3]/5 text-[#745DF3]' 
                                            : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <option.icon className="w-4 h-4" />
                                          {option.label}
                                        </div>
                                        {sortBy === option.id && <CheckCircle2 className="w-4 h-4" />}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50">
                                  <button
                                    onClick={() => {
                                      setStarredOnly(!starredOnly);
                                      setShowFilterMenu(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                                      starredOnly 
                                        ? 'bg-amber-50 text-amber-600' 
                                        : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Star className={`w-4 h-4 ${starredOnly ? 'fill-amber-500' : ''}`} />
                                      Starred Only
                                    </div>
                                    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${starredOnly ? 'bg-amber-500' : 'bg-gray-200'}`}>
                                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${starredOnly ? 'translate-x-5' : ''}`} />
                                    </div>
                                  </button>
                                </div>
                                
                                {(starredOnly || sortBy !== 'recent') && (
                                  <button
                                    onClick={() => {
                                      setSortBy('recent');
                                      setStarredOnly(false);
                                      setShowFilterMenu(false);
                                    }}
                                    className="w-full py-2 text-xs font-bold text-[#745DF3] hover:underline"
                                  >
                                    Reset Filters
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-[#745DF3] animate-spin mb-4" />
                    <p className="text-gray-400 font-medium">Loading your templates...</p>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-gray-300 shadow-sm mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-[#101828] mb-1">
                      {templates.length === 0 ? "No templates found" : "No matches found"}
                    </h3>
                    <p className="text-gray-400 text-sm font-medium mb-6">
                      {templates.length === 0 
                        ? "Start by creating your first sequence template." 
                        : "Try adjusting your filters or search query to find what you're looking for."}
                    </p>
                    {templates.length === 0 ? (
                      <button 
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-6 py-3 bg-[#101828] rounded-xl text-sm font-bold text-white hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10"
                      >
                        <Plus className="w-4 h-4" />
                        Create Template
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setActiveTab('All');
                          setStarredOnly(false);
                          setSortBy('recent');
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#101828] hover:bg-gray-50 transition-all"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {filteredTemplates.map((template, i) => (
                        <motion.div
                          key={template.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="group bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-[#745DF3]/5 hover:border-[#745DF3]/20 transition-all flex flex-col h-full"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-[#745DF3]/5 group-hover:text-[#745DF3] transition-colors`}>
                              <Mail className="w-5 h-5" />
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleToggleStar(template.id, template.is_starred)}
                                className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <Star 
                                  className={`w-4 h-4 ${template.is_starred ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                                />
                              </button>
                              <div className="relative group/menu">
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-all">
                                  <MoreHorizontal className="w-5 h-5" />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-2 z-10 hidden group-hover/menu:block border-gray-100">
                                  <button 
                                    onClick={() => openEditModal(template)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-[#101828] hover:bg-gray-50 rounded-xl transition-all"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    Edit Template
                                  </button>
                                  <button 
                                    onClick={() => handleDuplicate(template)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-[#101828] hover:bg-gray-50 rounded-xl transition-all"
                                  >
                                    <Copy className="w-4 h-4" />
                                    Duplicate
                                  </button>
                                  <div className="h-px bg-gray-50 my-1 mx-2" />
                                  <button 
                                    onClick={() => handleDelete(template.id)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mb-6 flex-1">
                            <h4 className="text-lg font-black text-[#101828] mb-1 line-clamp-1">{template.name}</h4>
                            <p className="text-[12px] font-bold text-gray-400 mb-3 truncate">{template.subject}</p>
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/50 group-hover:bg-white transition-colors min-h-[100px]">
                              <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">
                                {template.body}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                  <span className="text-[#101828]">{template.open_rate || 0}%</span>
                                  <span>Opens</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[#101828]">{template.reply_rate || 0}%</span>
                                  <span>Replies</span>
                                </div>
                              </div>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
                              </span>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                              <span className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:bg-[#745DF3]/5 group-hover:text-[#745DF3] transition-colors">
                                {template.category}
                              </span>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleDuplicate(template)}
                                  className="p-2 text-gray-400 hover:text-[#745DF3] transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => openEditModal(template)}
                                  className="p-2 text-gray-400 hover:text-[#745DF3] transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Internal Library Modal */}
      <InternalLibraryModal 
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onAdd={(newTemplate) => {
          setTemplates(prev => [newTemplate, ...prev]);
          setShowLibraryModal(false);
        }}
      />

      {/* Create/Edit Template Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCreateModal(false);
                setEditingTemplate(null);
                setFormData({ name: '', subject: '', body: '', category: 'Cold Outreach' });
              }}
              className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#101828] tracking-tight">
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </h2>
                  <p className="text-gray-400 text-sm font-medium">Design your email sequence template with variables.</p>
                </div>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTemplate(null);
                    setFormData({ name: '', subject: '', body: '', category: 'Cold Outreach' });
                  }}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                <form id="template-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Template Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-gray-50 border border-gray-100 focus:border-[#745DF3] focus:bg-white rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all"
                        placeholder="e.g. Series A Founder Outreach"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Email Subject</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-gray-50 border border-gray-100 focus:border-[#745DF3] focus:bg-white rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all"
                        placeholder="Quick question regarding {{company_name}}..."
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Category</label>
                      <div className="grid grid-cols-2 gap-3">
                        {categories.filter(c => c !== 'All').map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setFormData({...formData, category: cat})}
                            className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                              formData.category === cat 
                                ? 'bg-[#745DF3] border-[#745DF3] text-white shadow-lg shadow-[#745DF3]/20' 
                                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1 flex items-center justify-between">
                        Email Content
                        <span className="text-[9px] font-bold text-[#745DF3] bg-[#745DF3]/5 px-2 py-0.5 rounded-md lowercase tracking-tight">supports markdown</span>
                      </label>
                      <textarea 
                        required
                        className="w-full bg-gray-50 border border-gray-100 focus:border-[#745DF3] focus:bg-white rounded-3xl py-4 px-6 text-sm font-medium outline-none transition-all min-h-[250px] resize-none"
                        placeholder="Hi {{first_name}}, I was looking at your recent..."
                        value={formData.body}
                        onChange={(e) => setFormData({...formData, body: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-[2rem] border border-gray-100 p-8 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Preview</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                      </div>

                      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Subject</p>
                          <p className="text-sm font-bold text-[#101828]">
                            {formData.subject || 'Subject will appear here...'}
                          </p>
                        </div>
                        <div className="p-6 flex-1 text-sm text-gray-600 leading-relaxed font-medium">
                          <div className="whitespace-pre-wrap">
                            {formData.body || 'Your email content will be previewed here. Use {{variable_name}} to personalize your messages.'}
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex items-center gap-4">
                          <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Monitor className="w-4 h-4" />
                          </button>
                          <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Smartphone className="w-4 h-4" />
                          </button>
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400">Variables detected:</span>
                            <div className="flex gap-1">
                              {(formData.subject + formData.body).match(/{{(.*?)}}/g)?.map((v, i) => (
                                <span key={i} className="px-2 py-0.5 bg-[#745DF3]/10 text-[#745DF3] rounded-md text-[9px] font-black">
                                  {v.replace(/[{}]/g, '')}
                                </span>
                              )) || <span className="text-[9px] font-bold text-gray-300 ">None</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-6 text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Auto-save active</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingTemplate(null);
                      setFormData({ name: '', subject: '', body: '', category: 'Cold Outreach' });
                    }}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:text-[#101828] transition-all"
                  >
                    Discard Changes
                  </button>
                  <button 
                    form="template-form"
                    type="submit"
                    className="px-8 py-3 bg-[#101828] text-white rounded-xl text-sm font-bold hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10"
                  >
                    {editingTemplate ? 'Save Template' : 'Create Template'}
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
