'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, CreditCard, LogOut, ChevronDown } from 'lucide-react';
import { useLogout } from '@/components/providers/LogoutProvider';

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openLogoutModal } = useLogout();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'LF';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pr-3 hover:bg-gray-50 rounded-full transition-all border border-transparent hover:border-gray-100"
      >
        {profile?.avatar_url ? (
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg shadow-[#745DF3]/10 relative">
             <Image 
               src={profile.avatar_url} 
               alt={profile.full_name || 'User'} 
               fill
               className="object-cover"
             />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#745DF3] flex items-center justify-center text-white font-black text-xs shadow-lg shadow-[#745DF3]/20 uppercase tracking-wider">
            {initials}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-bold text-[#101828] leading-tight">{profile?.full_name || 'User Profile'}</p>
          <p className="text-xs font-medium text-gray-500 leading-tight italic capitalize">
            {profile?.organizations?.plan ? `${profile.organizations.plan} Plan` : 'Free Plan'}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-[#101828]/5 overflow-hidden z-[100]"
          >
            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
              <p className="text-sm font-bold text-[#101828] truncate">{profile?.email}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold truncate">
                Workspace: {profile?.organizations?.name || 'My Workspace'}
              </p>
            </div>
            
            <div className="p-2">
              <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-[#101828] hover:bg-gray-50 rounded-xl transition-all group font-medium">
                <User className="w-4 h-4 text-gray-400 group-hover:text-[#745DF3]" />
                Profile
              </Link>
              <Link href="/dashboard/billing" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-[#101828] hover:bg-gray-50 rounded-xl transition-all group font-medium">
                <CreditCard className="w-4 h-4 text-gray-400 group-hover:text-[#745DF3]" />
                Billing
              </Link>
              <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-[#101828] hover:bg-gray-50 rounded-xl transition-all group font-medium">
                <Settings className="w-4 h-4 text-gray-400 group-hover:text-[#745DF3]" />
                Settings
              </Link>
            </div>

            <div className="p-2 border-t border-gray-50">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  openLogoutModal();
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
