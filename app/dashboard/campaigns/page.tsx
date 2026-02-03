'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ConfirmModal from '@/components/dashboard/ConfirmModal';
import { 
  Send, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Play, 
  Pause, 
  BarChart3, 
  Target, 
  Users, 
  Mail, 
  TrendingUp,
  Clock,
  ChevronRight,
  AlertCircle,
  Zap,
  CheckCircle2,
  Settings2,
  Trash2,
  Edit,
  RotateCcw
} from 'lucide-react';

const campaignStats = [
  { name: 'Active Campaigns', value: '12', change: '+2', icon: Send },
  { name: 'Total Prospects', value: '45,802', change: '+2.4k', icon: Users },
  { name: 'Avg. Open Rate', value: '64.2%', change: '+3.1%', icon: TrendingUp },
  { name: 'Avg. Reply Rate', value: '18.5%', change: '+1.2%', icon: Target },
];

const initialMockCampaigns = [
  {
    id: 1,
    name: 'SaaS Founders - Series A',
    status: 'Sending',
    leads: 1240,
    sent: 840,
    opened: '72%',
    replied: '14%',
    progress: 68,
    tags: ['Outbound', 'LinkedIn'],
    updatedAt: '2 hours ago'
  },
  {
    id: 2,
    name: 'Enterprise CTOs - Q1 Outreach',
    status: 'Paused',
    leads: 2500,
    sent: 1200,
    opened: '61%',
    replied: '9%',
    progress: 48,
    tags: ['Cold Email'],
    updatedAt: '5 hours ago'
  },
  {
    id: 3,
    name: 'Growth Agencies - APAC',
    status: 'Completed',
    leads: 850,
    sent: 850,
    opened: '84%',
    replied: '22%',
    progress: 100,
    tags: ['Agency', 'APAC'],
    updatedAt: '1 day ago'
  },
  {
    id: 4,
    name: 'Real Estate Brokers - Florida',
    status: 'Draft',
    leads: 0,
    sent: 0,
    opened: '0%',
    replied: '0%',
    progress: 0,
    tags: ['Real Estate'],
    updatedAt: '3 days ago'
  },
  {
    id: 5,
    name: 'Fintech Executives',
    status: 'Scheduled',
    leads: 1800,
    sent: 0,
    opened: '0%',
    replied: '0%',
    progress: 0,
    tags: ['Finance'],
    updatedAt: '4 days ago'
  }
];

const statusFilters = ['All', 'Sending', 'Paused', 'Scheduled', 'Draft', 'Completed'];

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCampaigns();

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCampaigns = async () => {
    try {
      const resp = await fetch('/api/campaigns');
      if (resp.ok) {
        const data = await resp.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'running' ? 'paused' : 'running';
    try {
      const resp = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (resp.ok) {
        setCampaigns(prev => prev.map(c => {
          if (c.id === id) {
            return { ...c, status: newStatus };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const handleDeleteCampaign = async () => {
    if (campaignToDelete !== null) {
      try {
        const resp = await fetch(`/api/campaigns/${campaignToDelete}`, {
          method: 'DELETE',
        });
        if (resp.ok) {
          setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete));
          setCampaignToDelete(null);
          setIsDeleteModalOpen(false);
        }
      } catch (err) {
        console.error("Failed to delete campaign", err);
      }
    }
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'running').length;
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.total_leads || 0), 0);
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + (c.open_count || 0), 0);
  const totalReplied = campaigns.reduce((acc, c) => acc + (c.reply_count || 0), 0);

  const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const avgReplyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;

  const currentStats = [
    { name: 'Active Campaigns', value: activeCampaigns.toString(), change: '', icon: Send },
    { name: 'Total Prospects', value: totalLeads.toLocaleString(), change: '', icon: Users },
    { name: 'Avg. Open Rate', value: `${avgOpenRate.toFixed(1)}%`, change: '', icon: TrendingUp },
    { name: 'Avg. Reply Rate', value: `${avgReplyRate.toFixed(1)}%`, change: '', icon: Target },
  ];

  const filteredCampaigns = campaigns.filter(c => {
    let matchesFilter = true;
    if (activeFilter !== 'All') {
      const statusMap: Record<string, string> = {
        'Sending': 'running',
        'Paused': 'paused',
        'Scheduled': 'scheduled',
        'Draft': 'draft',
        'Completed': 'completed'
      };
      matchesFilter = c.status === statusMap[activeFilter];
    }
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#FCFCFD]">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#745DF3] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

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
                <h1 className="text-3xl font-black text-[#101828] tracking-tight">Campaigns</h1>
                <p className="text-gray-500 font-medium mt-1">Create, manage and monitor your outbound sequences.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push('/dashboard/analytics')}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-[#101828] hover:bg-gray-50 transition-all shadow-sm"
                >
                  <BarChart3 className="w-4 h-4 text-[#745DF3]" />
                  Global Analytics
                </button>
                <Link 
                  href="/dashboard/campaigns/create"
                  className="flex items-center gap-2 px-5 py-3 bg-[#101828] rounded-2xl text-sm font-bold text-white hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  New Campaign
                </Link>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {currentStats.map((stat, i) => (
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
                        {stat.change && (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
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

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-2 rounded-[28px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar lg:w-auto w-full">
                {statusFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                      activeFilter === filter 
                        ? 'bg-[#101828] text-white shadow-lg shadow-[#101828]/20' 
                        : 'text-gray-500 hover:text-[#101828] hover:bg-gray-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="relative lg:w-80 w-full px-2">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-5 py-2.5 bg-[#F9FAFB] border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#745DF3]/10 transition-all outline-none"
                />
              </div>
            </div>

              {/* Campaign Table */}
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest bg-[#FBFBFB]/50 border-b border-gray-50">Campaign Name</th>
                        <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest bg-[#FBFBFB]/50 border-b border-gray-50">Status</th>
                        <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest bg-[#FBFBFB]/50 border-b border-gray-50 text-center">Engagement</th>
                        <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest bg-[#FBFBFB]/50 border-b border-gray-50 text-center">Analytics</th>
                        <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest bg-[#FBFBFB]/50 border-b border-gray-50 text-center">Progress</th>
                        <th className="px-8 py-5 text-right bg-[#FBFBFB]/50 border-b border-gray-50"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      <AnimatePresence mode="popLayout">
                        {filteredCampaigns.map((campaign) => (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={campaign.id} 
                            className="group hover:bg-[#FBFBFB]/50 transition-colors"
                          >
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-1.5">
                                <span className="font-black text-[#101828] text-[15px] group-hover:text-[#745DF3] transition-colors cursor-pointer">{campaign.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-gray-400 capitalize flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Created {new Date(campaign.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                campaign.status === 'running' ? 'bg-emerald-50 text-emerald-600' :
                                campaign.status === 'paused' ? 'bg-amber-50 text-amber-600' :
                                campaign.status === 'draft' ? 'bg-gray-100 text-gray-500' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  campaign.status === 'running' ? 'bg-emerald-500 animate-pulse' :
                                  campaign.status === 'paused' ? 'bg-amber-500' :
                                  campaign.status === 'draft' ? 'bg-gray-400' :
                                  'bg-blue-500'
                                }`} />
                                {campaign.status === 'running' ? 'Sending' : campaign.status}
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex items-center justify-center gap-5">
                                <div className="text-center">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Open</p>
                                  <p className="text-sm font-black text-[#101828]">
                                    {campaign.sent_count > 0 ? Math.round((campaign.open_count / campaign.sent_count) * 100) : 0}%
                                  </p>
                                </div>
                                <div className="w-[1px] h-6 bg-gray-100" />
                                <div className="text-center">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Reply</p>
                                  <p className="text-sm font-black text-[#101828]">
                                    {campaign.sent_count > 0 ? Math.round((campaign.reply_count / campaign.sent_count) * 100) : 0}%
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-black text-[#101828]">{(campaign.sent_count || 0).toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Sent</span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col gap-2 min-w-[120px] mx-auto">
                                <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                  <span>{campaign.total_leads > 0 ? Math.round((campaign.sent_count / campaign.total_leads) * 100) : 0}%</span>
                                  <span>{campaign.total_leads || 0} leads</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${campaign.total_leads > 0 ? (campaign.sent_count / campaign.total_leads) * 100 : 0}%` }}
                                    transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                                    className={`h-full rounded-full ${
                                      campaign.status === 'running' ? 'bg-[#745DF3]' : 
                                      campaign.status === 'completed' ? 'bg-emerald-500' : 
                                      'bg-gray-200'
                                    }`} 
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right relative">
                              <div className="flex items-center justify-end gap-2">
                                {campaign.status === 'running' ? (
                                  <button 
                                    onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                    title="Pause Campaign"
                                  >
                                    <Pause className="w-5 h-5 fill-current" />
                                  </button>
                                ) : (campaign.status === 'paused' || campaign.status === 'draft') ? (
                                  <button 
                                    onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                    title="Start Campaign"
                                  >
                                    <Play className="w-5 h-5 fill-current" />
                                  </button>
                                ) : null}
                                
                                <div className="relative group/menu">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === campaign.id ? null : campaign.id);
                                    }}
                                    className={`p-2 rounded-xl transition-all ${
                                      activeMenuId === campaign.id ? 'bg-[#101828] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-[#101828]'
                                    }`}
                                  >
                                    <MoreHorizontal className="w-5 h-5" />
                                  </button>

                                  <AnimatePresence>
                                    {activeMenuId === campaign.id && (
                                      <>
                                        <div className="fixed inset-0 z-[100]" onClick={() => setActiveMenuId(null)} />
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                          className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-2xl z-[101] py-2"
                                        >
                                          <Link 
                                            href={`/dashboard/campaigns/${campaign.id}/edit`}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                          >
                                            <Edit className="w-4 h-4 text-gray-400" />
                                            Edit Details
                                          </Link>
                                          <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                            <Zap className="w-4 h-4 text-[#745DF3]" />
                                            Duplicate
                                          </button>
                                          <div className="my-1 border-t border-gray-50" />
                                          <button 
                                            onClick={() => {
                                              setCampaignToDelete(campaign.id);
                                              setIsDeleteModalOpen(true);
                                              setActiveMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                          </button>
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {campaigns.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center px-6 border-t border-gray-50">
                    <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
                      <Mail className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-black text-[#101828]">No campaigns found</h3>
                    <p className="text-gray-500 font-medium mt-2 max-w-xs">Ready to scale? Create your first campaign and start reaching out.</p>
                    <Link 
                      href="/dashboard/campaigns/create"
                      className="mt-6 inline-flex items-center gap-2 px-8 py-4 bg-[#101828] text-white rounded-2xl font-black shadow-xl shadow-[#101828]/10 hover:-translate-y-0.5 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Create Campaign
                    </Link>
                  </div>
                ) : (filteredCampaigns.length === 0 && (
                  <div className="py-24 flex flex-col items-center justify-center text-center px-6 border-t border-gray-50">
                    <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
                      <Search className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-black text-[#101828]">No results found</h3>
                    <p className="text-gray-500 font-medium mt-2 max-w-xs">Try adjusting your search or filters to find what you're looking for.</p>
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setActiveFilter('All');
                      }}
                      className="mt-6 text-[#745DF3] font-black text-sm hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCampaign}
        title="Delete Campaign"
        description="Are you sure you want to delete this campaign? All sequence history, lead status data, and analytics for this campaign will be permanently removed. This action cannot be reversed."
        confirmText="Yes, delete campaign"
        type="danger"
      />
    </div>
  );
}
