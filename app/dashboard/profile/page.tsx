'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { useRouter } from 'next/navigation';
import { 
  User, 
  MapPin, 
  Mail, 
  Calendar, 
  Twitter, 
  Linkedin, 
  Globe,
  Settings,
  Edit3,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Users,
  Camera,
  X,
  Plus,
  Loader2,
  Check,
  AlertCircle,
  Star,
  Image as ImageIcon,
  Activity,
  Server,
  UserPlus,
  Send,
  Inbox,
  Flame,
  MousePointer2
} from 'lucide-react';

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

export default function ProfilePage() {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('Profile updated successfully!');
  
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Media State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    role: '',
    location: '',
    email: '',
    bio: '',
    joined: '',
    twitterUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
    plan: 'free',
    status: 'trialing',
    monthlyTargetGoal: 1000,
    responseRateGoal: 10,
    monthlyAttainment: 0,
    responseAttainment: 0
  });

  const [stats, setStats] = useState([
    { label: 'Campaigns', value: '0', icon: TrendingUp },
    { label: 'Active Leads', value: '0', icon: Users },
    { label: 'Replies', value: '0', icon: MessageSquare },
  ]);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchActivities()]);
  }, []);

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const res = await fetch('/api/activity?limit=5');
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
      if (data.user) {
        setProfile({
          name: data.user.full_name || '',
          role: data.user.job_title || '',
          location: data.user.location || '',
          email: data.user.email || '',
          bio: data.user.bio || '',
          joined: new Date(data.user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          twitterUrl: data.user.twitter_url || '',
          linkedinUrl: data.user.linkedin_url || '',
          websiteUrl: data.user.website_url || '',
          plan: data.user.organizations?.plan || 'free',
          status: data.user.organizations?.subscription_status || 'trialing',
          monthlyTargetGoal: data.user.monthly_target_goal || 1000,
          responseRateGoal: data.user.response_rate_goal || 10,
          monthlyAttainment: data.stats?.attainment?.monthly || 0,
          responseAttainment: data.stats?.attainment?.response || 0
        });
        setAvatarUrl(data.user.avatar_url);
        setBannerUrl(data.user.banner_url);
        
        if (data.stats) {
          setStats([
            { label: 'Campaigns', value: data.stats.campaigns.toString(), icon: TrendingUp },
            { label: 'Active Leads', value: data.stats.activeLeads.toLocaleString(), icon: Users },
            { label: 'Replies', value: data.stats.replies.toLocaleString(), icon: MessageSquare },
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profile.name,
          jobTitle: profile.role,
          location: profile.location,
          bio: profile.bio,
          twitterUrl: profile.twitterUrl,
          linkedinUrl: profile.linkedinUrl,
          websiteUrl: profile.websiteUrl,
          avatarUrl,
          bannerUrl,
          monthlyTargetGoal: profile.monthlyTargetGoal,
          responseRateGoal: profile.responseRateGoal
        })
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setNotificationMsg('Profile updated successfully!');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'avatar') setIsUploadingAvatar(true);
    else setIsUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.url) {
        if (type === 'avatar') {
          setAvatarUrl(data.url);
          // Auto-save the new avatar URL
          await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl: data.url })
          });
        } else {
          setBannerUrl(data.url);
          // Auto-save the new banner URL
          await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bannerUrl: data.url })
          });
        }
        setNotificationMsg(`${type === 'avatar' ? 'Avatar' : 'Banner'} updated successfully!`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (err) {
      console.error(`Failed to upload ${type}`, err);
    } finally {
      setIsUploadingAvatar(false);
      setIsUploadingBanner(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FBFBFB]">
        <Loader2 className="w-12 h-12 text-[#745DF3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FBFBFB] font-jakarta overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
          <div className="max-w-[1000px] mx-auto space-y-8">
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
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold tracking-tight">{notificationMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile Hero */}
            <div className="relative">
              <input 
                type="file" 
                ref={bannerInputRef} 
                onChange={(e) => handleFileUpload(e, 'banner')} 
                className="hidden" 
                accept="image/*"
              />
              <div 
                onClick={() => bannerInputRef.current?.click()}
                className="h-48 w-full bg-gradient-to-r from-[#745DF3] to-[#9281f7] rounded-[3rem] shadow-2xl overflow-hidden relative group cursor-pointer"
              >
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-white text-xs font-black flex items-center gap-2">
                    {isUploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    Change Banner
                  </div>
                </div>
              </div>
              
              <div className="px-8 -mt-20 flex flex-col md:flex-row items-end gap-6 relative z-10">
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  onChange={(e) => handleFileUpload(e, 'avatar')} 
                  className="hidden" 
                  accept="image/*"
                />
                <div className="w-40 h-40 rounded-[3.5rem] bg-white p-2 shadow-2xl border border-gray-100/50 relative group">
                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-full h-full rounded-[3rem] bg-[#101828] flex items-center justify-center text-5xl font-black text-white relative overflow-hidden cursor-pointer"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || <User className="w-12 h-12" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      {isUploadingAvatar ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <Camera className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-1 pb-4 flex items-center justify-between w-full">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-4xl font-black text-[#101828] tracking-tight">{profile.name || 'Anonymous User'}</h1>
                      <CheckCircle2 className={`w-6 h-6 ${profile.status === 'active' ? 'text-[#745DF3]' : 'text-gray-300'} fill-current opacity-20`} />
                    </div>
                    <p className="text-gray-500 font-bold mt-1">{profile.role || 'Member'}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#101828] text-white rounded-2xl text-sm font-black hover:scale-105 transition-all shadow-xl shadow-[#101828]/20"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Info */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                  <h3 className="text-sm font-black text-[#101828] uppercase tracking-widest mb-6">About</h3>
                  
                  {profile.bio && (
                    <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-gray-500 font-bold text-sm">
                      <MapPin className="w-4 h-4 text-[#745DF3]" />
                      {profile.location || 'Remote'}
                    </div>
                    <div className="flex items-center gap-4 text-gray-500 font-bold text-sm">
                      <Mail className="w-4 h-4 text-[#745DF3]" />
                      {profile.email}
                    </div>
                    <div className="flex items-center gap-4 text-gray-500 font-bold text-sm">
                      <Calendar className="w-4 h-4 text-[#745DF3]" />
                      Joined {profile.joined}
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-50">
                    <h3 className="text-sm font-black text-[#101828] uppercase tracking-widest mb-6">Social</h3>
                    <div className="flex gap-4">
                      <a href={profile.twitterUrl || '#'} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-2xl transition-all ${profile.twitterUrl ? 'bg-gray-50 text-gray-400 hover:text-[#745DF3] hover:bg-[#745DF3]/5' : 'bg-gray-50 text-gray-200 cursor-not-allowed'}`}>
                        <Twitter className="w-5 h-5" />
                      </a>
                      <a href={profile.linkedinUrl || '#'} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-2xl transition-all ${profile.linkedinUrl ? 'bg-gray-50 text-gray-400 hover:text-[#745DF3] hover:bg-[#745DF3]/5' : 'bg-gray-50 text-gray-200 cursor-not-allowed'}`}>
                        <Linkedin className="w-5 h-5" />
                      </a>
                      <a href={profile.websiteUrl || '#'} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-2xl transition-all ${profile.websiteUrl ? 'bg-gray-50 text-gray-400 hover:text-[#745DF3] hover:bg-[#745DF3]/5' : 'bg-gray-50 text-gray-200 cursor-not-allowed'}`}>
                        <Globe className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-[#101828] rounded-[2.5rem] p-8 shadow-xl">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Personal Goals</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-gray-400">Monthly Target Attainment</span>
                        <span className="text-xs font-black text-white">{profile.monthlyAttainment}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${profile.monthlyAttainment}%` }}
                          className="h-full bg-[#745DF3]"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">Target: {profile.monthlyTargetGoal} Emails/mo</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-gray-400">Response Goal Attainment</span>
                        <span className="text-xs font-black text-white">{profile.responseAttainment}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${profile.responseAttainment}%` }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">Target: {profile.responseRateGoal}% Rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm group hover:border-[#745DF3]/20 transition-all cursor-default text-center">
                      <div className="w-10 h-10 rounded-xl bg-[#745DF3]/5 flex items-center justify-center text-[#745DF3] mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-black text-[#101828] tracking-tight">{stat.value}</div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Activity Feed */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black text-[#101828] uppercase tracking-widest">Recent Activity</h3>
                    <button onClick={() => router.push('/dashboard/activity')} className="text-[10px] font-black text-[#745DF3] uppercase tracking-widest hover:underline">View All</button>
                  </div>
                  <div className="space-y-8">
                    {loadingActivities ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[#745DF3]" />
                      </div>
                    ) : activities.length > 0 ? (
                      activities.map((item, i) => {
                        const Icon = getEventIcon(item.action_type);
                        return (
                          <div key={item.id} className="flex gap-4 relative group">
                            {i !== activities.length - 1 && <div className="absolute left-2.5 top-8 w-px h-10 bg-gray-100" />}
                            <div className="w-6 h-6 rounded-full bg-white border-2 border-[#745DF3] z-10 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-[#745DF3]" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-[#101828] group-hover:text-[#745DF3] transition-colors line-clamp-1">
                                {item.description}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{timeAgo(item.created_at)}</p>
                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded">
                                  {item.action_type.split('.')[0]}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No activity yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Plan Banner */}
                <div className="bg-[#101828] rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <TrendingUp className="w-48 h-48 text-white" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-[#745DF3] rounded-lg text-[10px] font-black uppercase tracking-widest">Active Plan</span>
                        <h4 className="text-xl font-black capitalize">{profile.plan} {profile.status === 'active' ? 'Pro' : 'Trial'}</h4>
                      </div>
                      <p className="text-gray-400 text-sm font-medium">
                        {profile.plan === 'enterprise' 
                          ? 'You are on the highest tier. Contact support for custom limits.' 
                          : 'Unlock enterprise features and unlimited sending.'}
                      </p>
                    </div>
                    <button 
                      onClick={() => router.push('/dashboard/billing')}
                      className="px-8 py-3.5 bg-white text-[#101828] rounded-2xl text-xs font-black shadow-xl hover:scale-105 transition-all whitespace-nowrap"
                    >
                      {profile.plan === 'enterprise' ? 'Manage Billing' : 'Upgrade My Account'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {isEditModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditModalOpen(false)}
                className="fixed inset-0 bg-[#101828]/40 backdrop-blur-sm z-[100]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-[3rem] p-12 z-[101] shadow-2xl overflow-hidden"
              >
                <div className="absolute top-8 right-8">
                  <button onClick={() => setIsEditModalOpen(false)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-[#101828] hover:bg-gray-100 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-10">
                  <h2 className="text-3xl font-black text-[#101828] tracking-tight">Edit Profile</h2>
                  <p className="text-gray-500 font-medium mt-2">Update your personal information and profile settings.</p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Full Name</label>
                      <input 
                        required
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Job Title</label>
                      <input 
                        required
                        type="text" 
                        value={profile.role}
                        onChange={(e) => setProfile({...profile, role: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Location</label>
                      <input 
                        type="text" 
                        value={profile.location}
                        onChange={(e) => setProfile({...profile, location: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Email Address</label>
                      <input 
                        required
                        type="email" 
                        value={profile.email}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all opacity-60 cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Biography</label>
                    <textarea 
                      value={profile.bio}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      rows={3}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Twitter</label>
                      <input 
                        type="url" 
                        value={profile.twitterUrl}
                        onChange={(e) => setProfile({...profile, twitterUrl: e.target.value})}
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-[10px] font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">LinkedIn</label>
                      <input 
                        type="url" 
                        value={profile.linkedinUrl}
                        onChange={(e) => setProfile({...profile, linkedinUrl: e.target.value})}
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-[10px] font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Website</label>
                      <input 
                        type="url" 
                        value={profile.websiteUrl}
                        onChange={(e) => setProfile({...profile, websiteUrl: e.target.value})}
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-[10px] font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Monthly Sending Target</label>
                      <input 
                        type="number" 
                        min="0"
                        value={profile.monthlyTargetGoal}
                        onChange={(e) => setProfile({...profile, monthlyTargetGoal: parseInt(e.target.value)})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                        placeholder="e.g. 1000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Target Response Rate (%)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        step="0.1"
                        value={profile.responseRateGoal}
                        onChange={(e) => setProfile({...profile, responseRateGoal: parseFloat(e.target.value)})}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl text-sm font-black hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className={`flex-1 py-4 bg-[#745DF3] text-white rounded-2xl text-sm font-black hover:bg-[#745DF3]/90 transition-all shadow-xl shadow-[#745DF3]/10 flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
