'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  Mail, 
  BarChart3, 
  Settings, 
  Search,
  ChevronRight,
  MoreHorizontal,
  Zap,
  Star,
  ShieldCheck,
  Target,
  ArrowUpRight,
  Clock,
  Filter,
  UserSquare2,
  X,
  MailPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

const roles = ['All', 'Admin', 'Manager', 'SDR', 'Sales'];

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'recent'>('performance');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('SDR');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('SDR'); // Current logged in user's role
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', role: '' });
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  useEffect(() => {
    fetchMembers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.user.role);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
        setStatsData(data.stats);
      }
    } catch (err) {
      console.error("Error fetching team:", err);
    } finally {
      setLoading(false);
    }
  };

  const teamStats = [
    { name: 'Total Members', value: statsData?.totalMembers?.toString() || '0', change: '+1', icon: Users },
    { name: 'Avg Reply Rate', value: statsData?.avgReplyRate || '0%', change: '+1.2%', icon: Zap },
    { name: 'Avg Open Rate', value: statsData?.avgOpenRate || '0%', change: '+3.5%', icon: TrendingUp },
    { name: 'Total Outbound', value: statsData?.totalOutbound || '0', change: '+12%', icon: Mail },
  ];

  const filteredMembers = members
    .filter(member => {
      const matchesTab = activeTab === 'All' || member.role.toLowerCase() === activeTab.toLowerCase();
      const matchesSearch = 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'performance') return (b.performance || 0) - (a.performance || 0);
      return b.activeCampaigns - a.activeCampaigns; // Default to campaign volume
    });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteError(null);
    
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      if (res.ok) {
        await fetchMembers();
        setIsInviteModalOpen(false);
        setInviteEmail('');
      } else {
        const data = await res.json();
        setInviteError(data.error || "Failed to send invitation");
      }
    } catch (err) {
      console.error("Failed to invite:", err);
      setInviteError("A network error occurred. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const deleteMember = async (id: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      try {
        const res = await fetch(`/api/team?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          setMembers(members.filter(m => m.id !== id));
          if (selectedMember?.id === id) setShowMemberDetails(false);
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to delete member');
        }
      } catch (err) {
        console.error("Failed to delete member:", err);
      }
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedMember.id,
          full_name: editForm.name,
          role: editForm.role
        })
      });

      if (res.ok) {
        await fetchMembers();
        setIsEditing(false);
        setSelectedMember({
          ...selectedMember,
          name: editForm.name,
          role: editForm.role
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update member');
      }
    } catch (err) {
      console.error("Failed to update member:", err);
    }
  };

  const toggleAutoJoin = async () => {
    setIsUpdatingSettings(true);
    try {
      const newVal = !statsData?.org?.autoJoinEnabled;
      const res = await fetch('/api/team/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoJoinEnabled: newVal })
      });

      if (res.ok) {
        await fetchMembers();
      }
    } catch (err) {
      console.error("Failed to update auto-join:", err);
    } finally {
      setIsUpdatingSettings(false);
    }
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
                <h1 className="text-3xl font-black text-[#101828] tracking-tight">Team Dashboard</h1>
                <p className="text-gray-500 font-medium mt-1">Monitor individual performance, manage roles, and scale your outbound team.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-[#101828] hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Settings className="w-4 h-4 text-[#745DF3]" />
                  Team Settings
                </button>
                {userRole === 'admin' && (
                  <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-[#101828] rounded-2xl text-sm font-bold text-white hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 group"
                  >
                    <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Invite Member
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-[#745DF3] animate-spin mb-4" />
                <p className="text-gray-400 font-medium">Loading organization data...</p>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {teamStats.map((stat, i) => (
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
                              <ArrowUpRight className="w-2.5 h-2.5" />
                              {stat.change}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Leaderboard / High Performers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                      <div className="p-8 border-b border-gray-50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                            {roles.map((role) => {
                              const count = role === 'All' 
                                ? members.length 
                                : members.filter(m => m.role.toLowerCase() === role.toLowerCase()).length;
                              
                              if (count === 0 && role !== 'All' && activeTab !== role) return null;

                              return (
                                <button
                                  key={role}
                                  onClick={() => setActiveTab(role)}
                                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                                    activeTab === role 
                                      ? 'bg-[#745DF3]/5 text-[#745DF3]' 
                                      : 'text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {role}
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                    activeTab === role ? 'bg-[#745DF3]/10' : 'bg-gray-100'
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
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm font-medium w-full md:w-64 focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                              />
                            </div>
                            
                            <div className="relative">
                              <button 
                                onClick={() => setShowFilterMenu(!showFilterMenu)}
                                className={`p-2.5 rounded-2xl transition-all ${
                                  showFilterMenu || sortBy !== 'performance'
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
                                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3 pl-1">Sort By</label>
                                          <div className="space-y-1">
                                            {[
                                              { id: 'performance', label: 'Efficiency Score', icon: Target },
                                              { id: 'name', label: 'Alphabetical', icon: Users },
                                              { id: 'recent', label: 'Active Campaigns', icon: MailPlus }
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
                                        
                                        {sortBy !== 'performance' && (
                                          <button
                                            onClick={() => {
                                              setSortBy('performance');
                                              setShowFilterMenu(false);
                                            }}
                                            className="w-full py-2 text-xs font-bold text-[#745DF3] hover:underline"
                                          >
                                            Reset Sort
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

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-50">
                              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Active Campaigns</th>
                              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Open Rate</th>
                              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Reply Rate</th>
                              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Efficiency</th>
                              <th className="px-8 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredMembers.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                  <div className="flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                                      <Users className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-black text-[#101828] mb-1">No members found</h3>
                                    <p className="text-gray-400 text-sm font-medium mb-6">
                                      {members.length === 0 ? "You haven't added any team members yet." : "No results match your current filters."}
                                    </p>
                                    <button 
                                      onClick={() => {
                                        if (members.length === 0) setIsInviteModalOpen(true);
                                        else {
                                          setActiveTab('All');
                                          setSearchQuery('');
                                          setSortBy('performance');
                                        }
                                      }}
                                      className="px-6 py-3 bg-[#101828] text-white rounded-xl text-sm font-bold shadow-xl shadow-[#101828]/10"
                                    >
                                      {members.length === 0 ? "Invite Member" : "Clear Filters"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredMembers.map((member) => (
                                <tr 
                                  key={member.id} 
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setShowMemberDetails(true);
                                  }}
                                  className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50/50 last:border-0 cursor-pointer"
                                >
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#745DF3] to-[#9281f7] flex items-center justify-center text-white text-xs font-black">
                                        {member.avatar}
                                      </div>
                                      <div>
                                        <p className="text-sm font-black text-[#101828]">{member.name}</p>
                                        <p className="text-[11px] font-bold text-gray-400">{member.role}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className="text-sm font-bold text-[#101828]">{member.activeCampaigns}</span>
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className="text-sm font-bold text-[#101828]">{member.openRate}</span>
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className="text-sm font-bold text-[#101828]">{member.replyRate}</span>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-[#745DF3] rounded-full" 
                                          style={{ width: `${member.performance}%` }}
                                        />
                                      </div>
                                      <span className="text-[11px] font-black text-[#101828]">{member.performance}%</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                        member.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                                        member.status === 'Invited' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'
                                      }`}>
                                        {member.status}
                                      </span>
                                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Top Performer Card */}
                    <div className="bg-[#101828] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                        <Star className="w-32 h-32 text-white fill-white" />
                      </div>
                      
                      <div className="relative z-10">
                        <span className="px-3 py-1 bg-[#745DF3] rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 inline-block">Top Performer</span>
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl font-black">
                            {filteredMembers[0]?.avatar || 'LF'}
                          </div>
                          <div>
                            <h4 className="text-xl font-black tracking-tight text-white">{filteredMembers[0]?.name || 'Leadflow User'}</h4>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{filteredMembers[0]?.role || 'Team Member'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                          <div className="bg-white/5 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-tight">Efficiency</p>
                            <p className="text-lg font-black tracking-tight text-white">{filteredMembers[0]?.performance || 0}%</p>
                          </div>
                          <div className="bg-white/5 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-tight">Reply Rate</p>
                            <p className="text-lg font-black tracking-tight text-white">{filteredMembers[0]?.replyRate || '0%'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team Activity Card */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                      <h3 className="text-lg font-black text-[#101828] tracking-tight mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#745DF3]" />
                        Recent Activity
                      </h3>
                      <div className="space-y-6">
                        {statsData?.logs && statsData.logs.length > 0 ? statsData.logs.slice(0, 4).map((log: any) => (
                          <div key={log.id} className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-[#745DF3]">
                              {log.avatar}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#101828] leading-snug">
                                {log.user.split(' ')[0]}
                                <span className="font-medium text-gray-500"> {log.action}</span>
                              </p>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        )) : (
                           <p className="text-sm font-bold text-gray-400 ">No recent activity detected.</p>
                        )}
                      </div>
                      <button 
                        onClick={() => setIsAuditLogOpen(true)}
                        className="w-full mt-8 py-3 bg-gray-50 rounded-2xl text-xs font-black text-[#101828] hover:bg-gray-100 transition-all"
                      >
                        View Full Audit Log
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-[#101828]">Team Settings</h2>
                  <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Workspace Share Link</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
                        {typeof window !== 'undefined' ? `${window.location.origin}/join/${statsData?.org?.slug}?t=${statsData?.org?.joinToken}` : `loading...`}
                      </div>
                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/join/${statsData?.org?.slug}?t=${statsData?.org?.joinToken}`;
                          navigator.clipboard.writeText(url);
                        }}
                        className="px-4 py-3 bg-[#101828] text-white rounded-xl text-xs font-black hover:bg-[#745DF3] transition-colors shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase">Anyone with this link can {statsData?.org?.autoJoinEnabled ? 'join' : 'request access'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-white border border-gray-100 rounded-2xl">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Member Limit</h4>
                      <p className="text-2xl font-black text-[#101828]">
                        {members.length} <span className="text-gray-300">/ {statsData?.org?.memberLimit || 5}</span>
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Plan: {statsData?.org?.plan || 'Free'}</p>
                    </div>
                    <div className="p-6 bg-white border border-gray-100 rounded-2xl">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Auto-Join</h4>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${statsData?.org?.autoJoinEnabled ? 'text-[#745DF3]' : 'text-gray-500'}`}>
                          {statsData?.org?.autoJoinEnabled ? 'On' : 'Off'}
                        </span>
                        <button 
                          disabled={isUpdatingSettings}
                          onClick={toggleAutoJoin}
                          className={`w-12 h-6 rounded-full relative transition-colors ${statsData?.org?.autoJoinEnabled ? 'bg-[#745DF3]' : 'bg-gray-100'} ${isUpdatingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <motion.div 
                            animate={{ x: statsData?.org?.autoJoinEnabled ? 24 : 4 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center" 
                          >
                            {isUpdatingSettings && <Loader2 className="w-2.5 h-2.5 text-[#745DF3] animate-spin" />}
                          </motion.div>
                        </button>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase leading-relaxed">
                        {statsData?.org?.autoJoinEnabled 
                          ? 'New members join instantly via link'
                          : 'Admins must approve link requests'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audit Log Modal */}
      <AnimatePresence>
        {isAuditLogOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuditLogOpen(false)}
              className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#101828]">Audit Log</h2>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Full Organization History</p>
                </div>
                <button onClick={() => setIsAuditLogOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                {statsData?.logs && statsData.logs.length > 0 ? (
                  statsData.logs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 border border-gray-50 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-black text-[#745DF3]">
                        {log.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#101828]">
                          {log.user} 
                          <span className="font-medium text-gray-500"> — </span>
                          {log.action}
                        </p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{log.date}</p>
                      </div>
                      <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded">
                        SUCCESS
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center opacity-50">
                    <Clock className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-sm font-bold text-gray-400">No activity logs found yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#745DF3]/10 flex items-center justify-center text-[#745DF3]">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={() => setIsInviteModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-[#101828] tracking-tight">Invite Teammate</h2>
                  <p className="text-gray-500 font-medium mt-1">Add a new member to your workspace.</p>
                </div>

                <form onSubmit={handleInvite} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="email" 
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['SDR', 'Account Executive', 'Manager', 'Admin'].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setInviteRole(role)}
                          className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all ${
                            inviteRole === role 
                              ? 'bg-[#745DF3] border-[#745DF3] text-white' 
                              : 'bg-white border-gray-100 text-gray-500 hover:border-[#745DF3]/30'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {inviteError && (
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600 animate-shake">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p className="text-xs font-bold">{inviteError}</p>
                    </div>
                  )}

                  <button 
                    disabled={isInviting || !inviteEmail}
                    className="w-full py-4 bg-[#101828] text-white rounded-2xl text-sm font-black hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isInviting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Sending Invite...
                      </>
                    ) : (
                      <>
                        <MailPlus className="w-4 h-4" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Details Panel */}
      <AnimatePresence>
        {showMemberDetails && selectedMember && (
          <div className="fixed inset-0 z-50">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMemberDetails(false)}
              className="absolute inset-0 bg-[#101828]/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-[#101828]">Member Profile</h2>
                <button 
                  onClick={() => setShowMemberDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                {isEditing ? (
                  <form onSubmit={handleUpdateMember} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['SDR', 'Account Executive', 'Manager', 'Admin'].map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, role })}
                            className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all ${
                              editForm.role === role 
                                ? 'bg-[#745DF3] border-[#745DF3] text-white' 
                                : 'bg-white border-gray-100 text-gray-500 hover:border-[#745DF3]/30'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button 
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl text-sm font-black hover:bg-gray-100 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-4 bg-[#101828] text-white rounded-2xl text-sm font-black hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Profile Header */}
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#745DF3] to-[#9281f7] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-[#745DF3]/20">
                        {selectedMember.avatar}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-[#101828] tracking-tight">{selectedMember.name}</h3>
                        <p className="text-gray-500 font-bold">{selectedMember.role}</p>
                        <div className="mt-2 inline-flex">
                          {selectedMember.status === 'Active' ? (
                            <div className="items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Authorized
                            </div>
                          ) : (
                            <div className="items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest flex">
                              <Clock className="w-2.5 h-2.5" />
                              Pending Invite
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Efficiency', value: `${selectedMember.performance}%`, icon: Zap },
                        { label: 'Campaigns', value: selectedMember.activeCampaigns, icon: Target },
                        { label: 'Open Rate', value: selectedMember.openRate, icon: TrendingUp },
                        { label: 'Reply Rate', value: selectedMember.replyRate, icon: BarChart3 },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <stat.icon className="w-3.5 h-3.5 text-[#745DF3]" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                          </div>
                          <p className="text-xl font-black text-[#101828]">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Info List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-[#101828]">{selectedMember.email}</span>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedMember.email);
                            alert('Email copied to clipboard');
                          }}
                          className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-[#101828]">Permissions</span>
                        </div>
                        <span className="text-xs font-bold text-gray-500">{selectedMember.role === 'Admin' ? 'Full Access' : 'Standard Access'}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-[#101828]">Joined</span>
                        </div>
                        <span className="text-xs font-bold text-gray-500">{selectedMember.joinedDate}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 space-y-3">
                      {selectedMember.role === 'Admin' ? (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrative Protection</p>
                          <p className="text-xs font-bold text-gray-500 mt-1 px-4">Admin accounts cannot be edited or removed from the dashboard for security reasons.</p>
                        </div>
                      ) : userRole !== 'admin' ? (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">View Only Mode</p>
                          <p className="text-xs font-bold text-gray-500 mt-1 px-4">Only administrators have permission to manage team members.</p>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setEditForm({ name: selectedMember.name, role: selectedMember.role });
                              setIsEditing(true);
                            }}
                            className="w-full py-4 bg-[#745DF3] text-white rounded-2xl text-sm font-black hover:bg-[#745DF3]/90 transition-all shadow-xl shadow-[#745DF3]/10"
                          >
                            Edit Member Details
                          </button>
                          <button 
                            onClick={() => deleteMember(selectedMember.id)}
                            className="w-full py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl text-sm font-black hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove from Team
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
