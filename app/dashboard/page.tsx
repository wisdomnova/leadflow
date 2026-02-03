'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  Plus, 
  MoreHorizontal,
  ChevronRight,
  Target,
  Settings,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Mail,
  Inbox,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Activity,
  Users,
  UserPlus,
  Flame,
  Server,
  MousePointer2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import MissingAccountModal from '@/components/dashboard/MissingAccountModal';
import { TrialBanner } from '@/components/dashboard/TrialStatus';
import SubscriptionGuard from '@/components/dashboard/SubscriptionGuard';

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

export default function DashboardPage() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [isBookingSession, setIsBookingSession] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [trialDays, setTrialDays] = useState<number>(14);
  const [hasAccounts, setHasAccounts] = useState(false);
  const [isMissingAccountModalOpen, setIsMissingAccountModalOpen] = useState(false);
  const [services, setServices] = useState<any[]>([
    { 
      id: 'gmail', 
      name: 'Email Provider', 
      email: 'Loading status...', 
      status: 'Connecting', 
      icon: Mail, 
      color: 'blue',
      lastSync: '---'
    },
    { 
      id: 'stripe', 
      name: 'Stripe Billing', 
      email: 'Checking billing...', 
      status: 'Checking', 
      icon: ShieldCheck, 
      color: 'blue',
      lastSync: '---'
    },
  ]);

  useEffect(() => {
    Promise.all([
      fetchStats(), 
      fetchProfile(), 
      fetchActivities(),
      fetchServices()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchServices = async () => {
    try {
      const [accRes, subRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/billing/subscription')
      ]);
      
      if (accRes.ok && subRes.ok) {
        const accounts = await accRes.json();
        const subData = await subRes.json();

        setHasAccounts(Array.isArray(accounts) && accounts.length > 0);

        // Calculate trial days if trialing
        if (subData.trial_ends_at) {
          const ends = new Date(subData.trial_ends_at);
          const now = new Date();
          const diff = Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setTrialDays(diff > 0 ? diff : 0);
        }

        setServices([
          {
            id: 'email',
            name: 'Email Provider',
            email: accounts.length > 0 ? `${accounts.length} Active Accounts` : 'Click to connect your first mailbox',
            status: accounts.length > 0 ? 'Connected' : 'Setup Required',
            icon: Mail,
            color: accounts.length > 0 ? 'emerald' : 'blue',
            lastSync: accounts.length > 0 ? 'Now' : 'Never'
          },
          {
            id: 'stripe',
            name: 'Stripe Billing',
            email: (subData.status === 'active' || subData.status === 'trialing') ? 'Active Subscription' : 'Subscription Required',
            status: (subData.status === 'active' || subData.status === 'trialing') ? 'Healthy' : 'Inactive',
            icon: ShieldCheck,
            color: (subData.status === 'active' || subData.status === 'trialing') ? 'emerald' : 'blue',
            lastSync: 'Live'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const res = await fetch('/api/activity?limit=4');
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error("Failed to fetch activities", err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      setUserProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const fetchStats = async () => {
    try {
      const resp = await fetch('/api/stats');
      if (resp.ok) {
        const data = await resp.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const dashboardStats = statsData ? [
    { name: 'Total Emails Sent', value: (statsData.totalSent || 0).toLocaleString(), change: '', icon: Send },
    { name: 'Average Open Rate', value: (statsData.totalSent || 0) > 0 ? `${((statsData.totalOpened || 0) / statsData.totalSent * 100).toFixed(1)}%` : '0%', change: '', icon: MousePointer2 },
    { name: 'Average Reply Rate', value: (statsData.totalSent || 0) > 0 ? `${((statsData.totalReplied || 0) / statsData.totalSent * 100).toFixed(1)}%` : '0%', change: '', icon: MessageSquare },
    { name: 'Active Campaigns', value: (statsData.activeCampaigns || 0).toString(), change: '', icon: Target },
  ] : [
    { name: 'Total Emails Sent', value: '0', change: '', icon: Send },
    { name: 'Average Open Rate', value: '0%', change: '', icon: MousePointer2 },
    { name: 'Average Reply Rate', value: '0%', change: '', icon: MessageSquare },
    { name: 'Active Campaigns', value: '0', change: '', icon: Target },
  ];

  const chartData = statsData?.chartData?.length > 0 ? statsData.chartData : [
    { name: 'Mon', sent: 0, replies: 0 },
    { name: 'Tue', sent: 0, replies: 0 },
    { name: 'Wed', sent: 0, replies: 0 },
    { name: 'Thu', sent: 0, replies: 0 },
    { name: 'Fri', sent: 0, replies: 0 },
    { name: 'Sat', sent: 0, replies: 0 },
    { name: 'Sun', sent: 0, replies: 0 },
  ];

  const dashboardRecentCampaigns = statsData?.recentCampaigns?.map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.status === 'running' ? 'Active' : (c.status.charAt(0).toUpperCase() + c.status.slice(1)),
    sent: c.sent_count || 0,
    replies: c.reply_count || 0,
    rate: c.sent_count > 0 ? `${(c.reply_count / c.sent_count * 100).toFixed(1)}%` : '0%',
    color: c.status === 'running' ? 'emerald' : 'orange'
  })) || [];

  const handleSync = (id: string) => {
    setIsSyncing(id);
    setTimeout(() => {
      setIsSyncing(null);
      setNotificationMsg(`${id.charAt(0).toUpperCase() + id.slice(1)} synchronized successfully.`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, 2000);
  };

  const handleBookSession = () => {
    setIsBookingSession(true);
    setTimeout(() => {
      setIsBookingSession(false);
      setNotificationMsg('Feedback session scheduled with an expert!');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, 2000);
  };

  const handleCreateCampaignClick = () => {
    if (!hasAccounts) {
      setIsMissingAccountModalOpen(true);
    } else {
      router.push('/dashboard/campaigns/create');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#FBFBFB]">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#745DF3]" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <SubscriptionGuard>
            <div className="max-w-[1400px] mx-auto space-y-10">
            {/* Trial Banner */}
            <TrialBanner daysRemaining={trialDays} />

            {/* Notification Toast */}
            <AnimatePresence>
              {showNotification && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: -20, x: '-50%' }}
                  className="fixed top-24 left-1/2 z-[100] px-6 py-4 bg-[#101828] text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold text-white tracking-tight">{notificationMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-[#101828] tracking-tight">Performance Overview</h1>
                <p className="text-gray-500 font-medium mt-1">Welcome back, {userProfile?.user?.full_name?.split(' ')[0] || 'there'}. Here's what's happening with your sequences today.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <button 
                    onClick={() => {
                      const ranges = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'];
                      const currentIdx = ranges.indexOf(dateRange);
                      const nextRange = ranges[(currentIdx + 1) % ranges.length];
                      setDateRange(nextRange);
                      setNotificationMsg(`Updating view to ${nextRange}...`);
                      setShowNotification(true);
                      setTimeout(() => setShowNotification(false), 2000);
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-[#101828] hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <Clock className="w-4 h-4 text-[#745DF3]" />
                    {dateRange}
                  </button>
                </div>
                <button 
                  onClick={() => router.push('/dashboard/campaigns/create')}
                  className="flex items-center gap-2 px-5 py-3 bg-[#101828] rounded-2xl text-sm font-bold text-white hover:bg-black transition-all shadow-xl shadow-[#101828]/10 group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  New Campaign
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {dashboardStats.map((stat, i) => (
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

            {/* Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Main Chart Placeholder */}
              <div className="xl:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-black text-[#101828] tracking-tight">Activity Analytics</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Sent emails vs Positive replies</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#745DF3]" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Replies</span>
                      </div>
                    </div>
                  </div>

                  {/* Halved Height Chart */}
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#745DF3" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#745DF3" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" opacity={0.5} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 800, fill: '#9ca3af', letterSpacing: '0.1em' }} 
                        />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            padding: '10px 15px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="sent" 
                          stroke="#745DF3" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorSent)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="replies" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorReplies)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* New Stat Box (Histogram/Bar Chart) */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-black text-[#101828] tracking-tight">Outreach Volume</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Volume distribution by day</p>
                    </div>
                    <div className="px-3 py-1 bg-[#745DF3]/5 rounded-lg">
                      <span className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest">Last 7 Days</span>
                    </div>
                  </div>

                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" opacity={0.5} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 800, fill: '#9ca3af', letterSpacing: '0.1em' }} 
                        />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{ fill: '#745DF3', opacity: 0.05 }}
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            padding: '10px 15px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }} 
                        />
                        <Bar 
                          dataKey="sent" 
                          fill="#745DF3" 
                          radius={[6, 6, 0, 0]} 
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Campaigns Table */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 pb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-[#101828] tracking-tight">Recent Campaigns</h2>
                    <button className="text-sm font-bold text-[#745DF3] hover:underline flex items-center gap-1 group">
                      View all 
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Campaign</th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Sent</th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Replies</th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Reply Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dashboardRecentCampaigns.length > 0 ? (
                          dashboardRecentCampaigns.map((campaign: any) => (
                            <tr key={campaign.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => router.push('/dashboard/campaigns')}>
                              <td className="px-8 py-5">
                                <span className="font-bold text-[#101828] text-sm group-hover:text-[#745DF3] transition-colors">{campaign.name}</span>
                              </td>
                              <td className="px-8 py-5">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  campaign.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                }`}>
                                  {campaign.status}
                                </span>
                              </td>
                              <td className="px-8 py-5 font-bold text-[#101828] text-sm">{campaign.sent.toLocaleString()}</td>
                              <td className="px-8 py-5 font-bold text-[#101828] text-sm">{campaign.replies}</td>
                              <td className="px-8 py-5 font-bold text-emerald-500 text-sm">{campaign.rate}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                  <Send className="w-8 h-8" />
                                </div>
                                <div className="max-w-[240px]">
                                  <p className="text-sm font-black text-[#101828] mb-1">No Active Campaigns</p>
                                  <p className="text-xs font-bold text-gray-400 leading-relaxed uppercase tracking-widest">Your recent outreach efforts will appear here.</p>
                                </div>
                                <button 
                                  onClick={handleCreateCampaignClick}
                                  className="px-6 py-3 bg-[#101828] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                                >
                                  Create First Campaign
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sidebar Content (Right Side) */}
              <div className="space-y-8">
                {/* Recent Activity Mini-Feed */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-[#101828]">Recent Activity</h3>
                    <button 
                      onClick={() => router.push('/dashboard/activity')}
                      className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {loadingActivities ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-[#745DF3]" />
                      </div>
                    ) : activities.length > 0 ? (
                      activities.map((item, i) => {
                        const Icon = getEventIcon(item.action_type);
                        return (
                          <div key={item.id} className="group flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#101828] group-hover:text-white transition-all shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#101828] truncate group-hover:text-[#745DF3] transition-colors">{item.description}</p>
                              <p className="text-[10px] font-medium text-gray-400 mt-0.5">{timeAgo(item.created_at)}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No activity yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Support Card */}
                <div className="bg-[#101828] p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-[#101828]/20">
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-xl">
                      <MessageSquare className="w-6 h-6 text-[#745DF3]" />
                    </div>
                    <h3 className="text-xl font-black mb-2 leading-tight text-white">Need help with your campaign?</h3>
                    <p className="text-white/60 text-sm font-medium mb-8">Our growth experts are available to review your sequences and improve your reply rates.</p>
                    <button 
                      onClick={handleBookSession}
                      disabled={isBookingSession}
                      className="w-full py-4 bg-white text-[#101828] rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isBookingSession ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#745DF3]" />
                          Booking...
                        </>
                      ) : (
                        'Start Feedback Session'
                      )}
                    </button>
                  </div>
                  {/* Decorative Elements */}
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#745DF3]/20 blur-3xl rounded-full" />
                  <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full" />
                </div>

                {/* Connected Services (Updated & Interactive) */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-[#101828]">Connected Services</h3>
                    <div className="px-3 py-1 bg-emerald-50 rounded-lg flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">System Live</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {services.map((service) => (
                      <div 
                        key={service.id} 
                        className="group flex flex-col p-5 bg-gray-50/50 rounded-3xl border border-gray-100/50 hover:bg-white hover:border-[#745DF3]/20 hover:shadow-xl hover:shadow-[#745DF3]/5 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:bg-[#101828] group-hover:text-white ${
                              service.color === 'emerald' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                            }`}>
                              <service.icon className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[#101828] leading-tight">{service.name}</p>
                              <p className="text-[11px] font-bold text-gray-400 mt-0.5">{service.email}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleSync(service.id)}
                            disabled={isSyncing === service.id}
                            className={`p-2.5 rounded-xl transition-all ${
                              isSyncing === service.id 
                                ? 'bg-[#101828] text-white' 
                                : 'bg-white text-gray-400 hover:text-[#745DF3] shadow-sm'
                            }`}
                          >
                            {isSyncing === service.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Settings className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${service.status === 'Connected' || service.status === 'Healthy' ? 'bg-emerald-500' : 'bg-blue-400 animate-pulse'}`} />
                             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{service.status}</span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-300">Synced {service.lastSync}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => router.push('/dashboard/settings?tab=notifications')}
                    className="w-full mt-8 py-4 bg-[#745DF3]/5 text-[#745DF3] rounded-2xl text-xs font-black hover:bg-[#745DF3] hover:text-white transition-all flex items-center justify-center gap-2 group"
                  >
                    Manage Integrations 
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
            </div>
          </SubscriptionGuard>
        </div>
      </main>

      <MissingAccountModal 
        isOpen={isMissingAccountModalOpen}
        onClose={() => setIsMissingAccountModalOpen(false)}
      />
    </div>
  );
}
