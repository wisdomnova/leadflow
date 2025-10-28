'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  BarChart3,  
  Settings,   
  HelpCircle,
  CreditCard,
  X,
  Menu,
  User,
  LogOut,
  FileText,
  Zap,
  Inbox,
  DollarSign,
  AtSign
} from 'lucide-react'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Email Accounts', href: '/email-accounts', icon: AtSign }, // Changed from Mail to AtSign
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Mail },
  { name: 'Inbox', href: '/inbox', icon: Inbox, badge: 'new' }, // 📥 New unified inbox
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Integrations', href: '/integrations', icon: Zap },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Affiliate', href: '/affiliate', icon: DollarSign }, // 💰 New affiliate section
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
  { name: 'Billing', href: '/billing', icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/auth/sign-in'
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          className="bg-white p-3 rounded-xl shadow-lg text-gray-600 hover:text-gray-900 transition-colors duration-200"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-900 bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 shrink-0 items-center justify-between px-6 border-b border-gray-200">
            <img
              className="h-13 w-auto"
              src="/leadflow.png"
              alt="LeadFlow"
            />
            <button
              type="button"
              className="lg:hidden text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-xl transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation - Clean and simple */}
          <nav className="flex-1 px-4 py-8 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative',
                    isActive
                      ? 'bg-[#0f66db] text-white'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'mr-4 h-6 w-6 flex-shrink-0 transition-colors',
                      isActive 
                        ? 'text-white' 
                        : 'text-gray-500 group-hover:text-gray-700'
                    )}
                  />
                  <span className="flex-1">{item.name}</span>
                  
                  {/* Badge for new features */}
                  {item.badge === 'new' && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                      New
                    </span>
                  )}
                  
                  {/* Special badge for Affiliate */}
                  {item.name === 'Affiliate' && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                      Earn $
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Profile - Clean design */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-xl bg-[#0f66db] flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {user?.first_name?.charAt(0) || 'U'}
                  </span>
                </div> 
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}