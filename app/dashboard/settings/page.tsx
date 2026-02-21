'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { useLogout } from '@/components/providers/LogoutProvider';
import { 
  User, 
  Lock, 
  Bell, 
  Zap, 
  LogOut, 
  Trash2, 
  Check, 
  ChevronRight, 
  Mail, 
  Camera,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

const settingsTabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'security', name: 'Security', icon: Lock },
  { id: 'notifications', name: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const { openLogoutModal } = useLogout();

  // New state for interactivity
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Media State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    jobTitle: '',
    bio: '',
    timezone: 'UTC'
  });

  const [notifPrefs, setNotifPrefs] = useState({
    campaign_updates: true,
    email_events: true,
    lead_discovery: true,
    billing_alerts: true,
    team_activity: true,
    security_logs: true
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (data.user) {
        setProfileData({
          name: data.user.full_name || '',
          email: data.user.email || '',
          jobTitle: data.user.job_title || '',
          bio: data.user.bio || '',
          timezone: data.user.timezone || 'UTC'
        });
        setAvatarUrl(data.user.avatar_url);
        setBannerUrl(data.user.banner_url);
        
        if (data.user.notification_prefs) {
          setNotifPrefs(data.user.notification_prefs);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profileData.name,
          jobTitle: profileData.jobTitle,
          bio: profileData.bio,
          timezone: profileData.timezone
        })
      });

      if (res.ok) {
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
        if (type === 'avatar') setAvatarUrl(data.url);
        else setBannerUrl(data.url);
        
        // Save URL to profile
        await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: data.url })
        });

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

  const handleUpdatePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert("Passwords do not match!");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNotificationMsg('Password changed securely.');
        setShowNotification(true);
        setPasswordForm({ current: '', new: '', confirm: '' });
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        alert(data.error || "Failed to update password");
      }
    } catch (err) {
      console.error("Failed to update password", err);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const saveNotifPrefs = async (updatedPrefs: any) => {
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPrefs: updatedPrefs })
      });
    } catch (err) {
      console.error("Failed to save notification preferences", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' })
      });
      const data = await res.json();
      if (res.ok) {
        // Clear cookies and redirect
        window.location.href = '/signin?deleted=true';
      } else {
        alert(data.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error("Failed to delete account", err);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    const updated = {
      ...notifPrefs,
      [key]: !notifPrefs[key]
    };
    setNotifPrefs(updated);
    saveNotifPrefs(updated);
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
          <div className="max-w-[1400px] mx-auto space-y-10">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-[#101828] tracking-tight">Settings</h1>
                <p className="text-gray-500 font-medium mt-1">Manage your account preferences and security settings.</p>
              </div>

              {/* Success Notification */}
              <AnimatePresence>
                {showNotification && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-[#101828] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <Check className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold tracking-tight">{notificationMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Settings Navigation */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-4 shadow-sm space-y-1">
                  {settingsTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${
                        activeTab === tab.id 
                          ? 'bg-[#745DF3] text-white shadow-xl shadow-[#745DF3]/20 font-black' 
                          : 'text-gray-500 hover:bg-gray-50 font-bold'
                      }`}
                    >
                      <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                      <span className="text-sm tracking-tight">{tab.name}</span>
                      {activeTab === tab.id && (
                        <motion.div layoutId="active-indicator" className="ml-auto">
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                  <div className="pt-4 mt-4 border-t border-gray-50">
                    <button 
                      onClick={openLogoutModal}
                      className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-50 font-black transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm tracking-tight">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Settings Content */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {activeTab === 'profile' && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Banner & Avatar Section */}
                      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-2 shadow-sm relative overflow-hidden">
                        {/* Hidden Inputs */}
                        <input 
                          type="file" 
                          ref={bannerInputRef} 
                          onChange={(e) => handleFileUpload(e, 'banner')} 
                          className="hidden" 
                          accept="image/*"
                        />
                        <input 
                          type="file" 
                          ref={avatarInputRef} 
                          onChange={(e) => handleFileUpload(e, 'avatar')} 
                          className="hidden" 
                          accept="image/*"
                        />

                        {/* Banner */}
                        <div 
                          onClick={() => bannerInputRef.current?.click()}
                          className="h-32 w-full bg-gradient-to-r from-[#745DF3] to-[#9281f7] rounded-[2rem] shadow-sm overflow-hidden relative group cursor-pointer"
                        >
                          {bannerUrl ? (
                            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-white text-[10px] font-black flex items-center gap-2">
                              {isUploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                              Change Banner
                            </div>
                          </div>
                        </div>

                        {/* Avatar */}
                        <div className="px-10 pb-10 -mt-12 relative z-10 flex flex-col md:flex-row items-end gap-6">
                          <div className="relative group">
                            <div 
                              onClick={() => avatarInputRef.current?.click()}
                              className="w-32 h-32 rounded-[3rem] bg-white p-1.5 shadow-2xl cursor-pointer"
                            >
                              <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-[#745DF3] to-[#9281f7] flex items-center justify-center text-4xl font-black text-white overflow-hidden relative group/avatar">
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  profileData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || <User className="w-8 h-8" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all">
                                  {isUploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="pb-2">
                            <h3 className="text-2xl font-black text-[#101828] leading-tight">Profile Appearance</h3>
                            <p className="text-gray-500 text-sm font-medium">Update your photo and brand banner.</p>
                          </div>
                          <div className="md:ml-auto pb-2 flex gap-2">
                            <button 
                              onClick={() => avatarInputRef.current?.click()}
                              className="px-6 py-2.5 bg-[#745DF3] text-white rounded-xl text-xs font-black hover:shadow-lg hover:shadow-[#745DF3]/20 transition-all"
                            >
                              Upload Photo
                            </button>
                            <button 
                              onClick={() => {
                                setAvatarUrl(null);
                                setBannerUrl(null);
                              }}
                              className="px-6 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-xs font-black hover:bg-gray-100 transition-all"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Personal Info */}
                      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm">
                        <h3 className="text-xl font-black text-[#101828] mb-8">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Full Name</label>
                            <input 
                              type="text" 
                              value={profileData.name}
                              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-inter"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Email Address</label>
                            <input 
                              type="email" 
                              value={profileData.email}
                              disabled
                              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-400 cursor-not-allowed font-inter"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Job Title</label>
                            <input 
                              type="text" 
                              value={profileData.jobTitle}
                              onChange={(e) => setProfileData({...profileData, jobTitle: e.target.value})}
                              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-inter"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Timezone</label>
                            <select 
                              value={profileData.timezone}
                              onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all appearance-none cursor-pointer font-inter"
                            >
                              <option value="UTC">UTC (Greenwich Mean Time)</option>
                              <option value="America/New_York">EST (Eastern Standard Time)</option>
                              <option value="America/Chicago">CST (Central Standard Time)</option>
                              <option value="America/Denver">MST (Mountain Standard Time)</option>
                              <option value="America/Los_Angeles">PST (Pacific Standard Time)</option>
                              <option value="Europe/London">GMT (London, UK)</option>
                              <option value="Europe/Paris">CET (Paris, France)</option>
                              <option value="Asia/Dubai">GST (Dubai, UAE)</option>
                              <option value="Asia/Singapore">SGT (Singapore)</option>
                              <option value="Australia/Sydney">AEST (Sydney, Australia)</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-8 space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Professional Bio</label>
                          <textarea 
                            value={profileData.bio}
                            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-inter min-h-[120px] resize-none"
                            placeholder="Tell us about yourself..."
                          />
                        </div>
                        <div className="flex justify-end mt-10">
                          <button 
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className={`px-10 py-4 bg-[#101828] text-white rounded-2xl text-sm font-black hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm">
                        <h3 className="text-xl font-black text-[#101828] mb-8">Password Settings</h3>
                        <div className="space-y-6 max-w-md">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Current Password</label>
                            <div className="relative">
                              <input 
                                type={showPassword ? 'text' : 'password'} 
                                value={passwordForm.current}
                                onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-inter"
                                placeholder="••••••••••••"
                              />
                              <button 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">New Password</label>
                            <input 
                              type="password" 
                              value={passwordForm.new}
                              onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-inter"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Confirm New Password</label>
                            <input 
                              type="password" 
                              value={passwordForm.confirm}
                              onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all font-inter"
                            />
                          </div>
                          <button 
                            onClick={handleUpdatePassword}
                            disabled={isUpdatingPassword}
                            className={`px-8 py-3.5 bg-[#745DF3] text-white rounded-2xl text-sm font-black hover:bg-[#745DF3]/90 transition-all flex items-center gap-2 ${isUpdatingPassword ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            {isUpdatingPassword ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              'Update Password'
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <div className="bg-red-50/50 rounded-[2.5rem] border border-red-100 p-10 shadow-sm">
                        <h3 className="text-xl font-black text-red-600 mb-2">Danger Zone</h3>
                        <p className="text-gray-500 text-sm font-medium mb-4">Once you delete your account, there is no going back. All your data, campaigns, leads, and team members will be permanently removed.</p>
                        
                        {!showDeleteConfirm ? (
                          <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-8 py-4 bg-red-600 text-white rounded-2xl text-sm font-black hover:bg-red-700 transition-all shadow-xl shadow-red-600/10 flex items-center gap-2"
                          >
                            <Trash2 className="w-5 h-5" />
                            Delete Account Permanently
                          </button>
                        ) : (
                          <div className="space-y-4 max-w-md">
                            <div className="p-4 bg-red-100 rounded-2xl border border-red-200">
                              <p className="text-sm font-bold text-red-700">Type <span className="font-black">DELETE</span> to confirm account deletion. This action cannot be undone.</p>
                            </div>
                            <input
                              type="text"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              placeholder="Type DELETE to confirm"
                              className="w-full px-6 py-4 bg-white border border-red-200 rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-red-300 transition-all font-inter"
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                className={`px-8 py-3.5 bg-red-600 text-white rounded-2xl text-sm font-black transition-all flex items-center gap-2 ${deleteConfirmText !== 'DELETE' || isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-4 h-4" />
                                    Confirm Delete
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                                className="px-8 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-black hover:bg-gray-200 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'notifications' && (
                    <motion.div
                      key="notifications"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm"
                    >
                      <h3 className="text-xl font-black text-[#101828] mb-8">Notification Preferences</h3>
                      <div className="space-y-10">
                        {(Object.keys(notifPrefs) as Array<keyof typeof notifPrefs>).map((key) => {
                          const labels: Record<string, { title: string; desc: string }> = {
                            campaign_updates: { title: 'Campaign Updates', desc: 'Alerts when campaigns launch, pause, or finish.' },
                            email_events: { title: 'Email Events', desc: 'Notifications for opens, clicks, and replies.' },
                            lead_discovery: { title: 'New Leads Found', desc: 'Instantly notify when Prospecting AI finds leads.' },
                            billing_alerts: { title: 'Billing & Usage', desc: 'Monthly invoices and usage limit warnings.' },
                            team_activity: { title: 'Team Activity', desc: 'Comments and mentions from your workspace team.' },
                            security_logs: { title: 'Security Logs', desc: 'New logins, password changes, and API key rotations.' }
                          };
                          const label = labels[key] || { title: key, desc: '' };
                          
                          return (
                            <div key={key} className="flex items-start justify-between gap-10">
                              <div className="flex-1">
                                <h4 className="font-black text-[#101828] mb-1">{label.title}</h4>
                                <p className="text-sm text-gray-500 font-medium">{label.desc}</p>
                              </div>
                              <div className="flex items-center gap-6">
                                <button 
                                  onClick={() => toggleNotif(key)}
                                  className="flex items-center gap-3 cursor-pointer group focus:outline-none"
                                >
                                  <div className={`w-12 h-6 rounded-full transition-all relative ${notifPrefs[key] ? 'bg-[#745DF3]' : 'bg-gray-200'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifPrefs[key] ? 'left-7' : 'left-1'}`} />
                                  </div>
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{notifPrefs[key] ? 'ON' : 'OFF'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
