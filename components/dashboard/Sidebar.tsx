'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Server, 
  Flame, 
  Send, 
  Zap,
  Inbox, 
  Database, 
  FileText, 
  CreditCard, 
  Share2, 
  Settings, 
  Users, 
  UserSquare2, 
  BarChart3, 
  User, 
  ChevronRight,
  ChevronLeft,
  Activity,
  Bell,
  ArrowUpCircle,
  Settings2
} from 'lucide-react';

const navigation = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      { name: 'Recent Activity', href: '/dashboard/activity', icon: Activity },
    ]
  },
  {
    title: 'Outbound',
    items: [
      { name: 'Campaigns', href: '/dashboard/campaigns', icon: Send },
      { name: 'PowerSend', href: '/dashboard/powersend', icon: Zap },
      { name: 'Warmup', href: '/dashboard/warmup', icon: Flame },
      { name: 'Email Provider', href: '/dashboard/providers', icon: Server },
    ]
  },
  {
    title: 'Sales & CRM',
    items: [
      { name: 'Unibox', href: '/dashboard/unibox', icon: Inbox },
      { name: 'CRM', href: '/dashboard/crm', icon: Database },
      { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Templates', href: '/dashboard/templates', icon: FileText },
      { name: 'Team Dashboard', href: '/dashboard/team', icon: UserSquare2 },
      { name: 'Affiliates', href: '/dashboard/affiliates', icon: Share2 },
    ]
  },
  {
    title: 'Account',
    items: [
      { name: 'Profile', href: '/dashboard/profile', icon: User },
      { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [plan, setPlan] = useState<string>('starter');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetch('/api/billing/subscription')
      .then(res => res.json())
      .then(data => {
        if (data.plan_tier) setPlan(data.plan_tier.toLowerCase());
      })
      .catch(err => console.error('Sidebar sub fetch error:', err));
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('dashboard-sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('dashboard-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const isEnterprise = plan === 'enterprise';

  return (
    <div className={`${isCollapsed ? 'w-24' : 'w-72'} h-screen border-r border-gray-100 bg-white flex flex-col sticky top-0 overflow-y-auto no-scrollbar transition-all duration-200`}>
      {/* Logo */}
      <div className={`p-6 ${isCollapsed ? 'pb-4' : 'pb-6'}`}>
        <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard">
          <Image 
            src="/leadflow-black.png" 
            alt="LeadFlow" 
            width={isCollapsed ? 36 : 120} 
            height={32} 
            className={`h-7 object-contain ${isCollapsed ? 'w-9' : 'w-auto'}`}
            priority
          />
        </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed(prev => !prev)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} pb-8 space-y-8`}>
        {navigation.map((section) => (
          <div key={section.title}>
            {!isCollapsed && (
              <h3 className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                // Check if current path starts with the item's href (to handle subpages)
                // Dashboard '/' is a special case to avoid matching everything
                const isActive = item.href === '/dashboard' 
                  ? pathname === '/dashboard' 
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl transition-all group
                      ${isActive 
                        ? 'bg-[#745DF3]/5 text-[#745DF3] font-bold' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#745DF3]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    {!isCollapsed && <span className="text-sm tracking-tight">{item.name}</span>}
                    {isActive && !isCollapsed && (
                      <motion.div 
                        layoutId="active-pill"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-[#745DF3]"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 mt-auto">
        <div className="space-y-2">
          <Link
            href="/dashboard/billing"
            className={`flex items-center justify-center gap-2 w-full ${isCollapsed ? 'px-2' : 'px-4'} py-4 bg-[#745DF3] text-white rounded-2xl transition-all font-bold text-sm hover:bg-[#6349df] shadow-lg shadow-[#745DF3]/20 group`}
            title={isCollapsed ? (isEnterprise ? 'Manage Billing' : 'Upgrade Plan') : undefined}
          >
            {isEnterprise ? (
              <>
                <Settings2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                {!isCollapsed && 'Manage Billing'}
              </>
            ) : (
              <>
                <ArrowUpCircle className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                {!isCollapsed && 'Upgrade Plan'}
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
