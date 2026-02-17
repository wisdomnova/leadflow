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

  useEffect(() => {
    fetch('/api/billing/subscription')
      .then(res => res.json())
      .then(data => {
        if (data.plan_tier) setPlan(data.plan_tier.toLowerCase());
      })
      .catch(err => console.error('Sidebar sub fetch error:', err));
  }, []);

  const isEnterprise = plan === 'enterprise';

  return (
    <div className="w-72 h-screen border-r border-gray-100 bg-white flex flex-col sticky top-0 overflow-y-auto no-scrollbar">
      {/* Logo */}
      <div className="p-8">
        <Link href="/dashboard">
          <Image 
            src="/leadflow-black.png" 
            alt="LeadFlow" 
            width={120} 
            height={32} 
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-8 space-y-8">
        {navigation.map((section) => (
          <div key={section.title}>
            <h3 className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              {section.title}
            </h3>
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
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                      ${isActive 
                        ? 'bg-[#745DF3]/5 text-[#745DF3] font-bold' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                  >
                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#745DF3]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    <span className="text-sm tracking-tight">{item.name}</span>
                    {isActive && (
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
            className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-[#745DF3] text-white rounded-2xl transition-all font-bold text-sm hover:bg-[#6349df] shadow-lg shadow-[#745DF3]/20 group"
          >
            {isEnterprise ? (
              <>
                <Settings2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Manage Billing
              </>
            ) : (
              <>
                <ArrowUpCircle className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                Upgrade Plan
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
