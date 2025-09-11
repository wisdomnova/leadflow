// ./components/layout/Header.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Settings, 
  LogOut, 
  CreditCard, 
  HelpCircle,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Building2,
  Users,
  Sun,
  Sunrise,
  Moon
} from 'lucide-react'
import clsx from 'clsx'

export function Header() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    subscribeToRealtime,
    unsubscribeFromRealtime
  } = useNotificationStore()

  const [notificationOpen, setNotificationOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.id && user?.organization_id) {
      fetchNotifications()
      subscribeToRealtime(user.id, user.organization_id)
    }
    return () => unsubscribeFromRealtime()
  }, [user?.id, user?.organization_id])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/sign-in')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read_at) {
      await markAsRead(notification.id)
    }
    if (notification.action_url) {
      router.push(notification.action_url)
    }
    setNotificationOpen(false)
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircle className="h-4 w-4 text-[#25b43d]" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Info className="h-4 w-4 text-[#0f66db]" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) {
      return {
        text: 'Good morning',
        icon: Sunrise,
        color: '#f59e0b' // amber
      }
    }
    if (hour < 18) {
      return {
        text: 'Good afternoon', 
        icon: Sun,
        color: '#eab308' // yellow
      }
    }
    return {
      text: 'Good evening',
      icon: Moon,
      color: '#6366f1' // indigo
    }
  }

  const greeting = getTimeBasedGreeting()
  const GreetingIcon = greeting.icon

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 justify-between items-center">
          
          {/* Left Side - Time-based Greeting */}
          <div className="flex-1 min-w-0">
            <motion.div 
              className="hidden lg:flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: `${greeting.color}20` }}
              >
                <GreetingIcon className="h-4 w-4" style={{ color: greeting.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {greeting.text}
                </p>
              </div>
            </motion.div>

            {/* Mobile title fallback */}
            <h1 className="text-xl font-semibold text-gray-900 truncate lg:hidden">
              Dashboard
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Notifications - Just the bell icon */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-3 bg-white hover:bg-gray-50 rounded-xl transition-colors duration-200"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notificationOpen && (
                  <motion.div 
                    className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center space-x-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-[#0f66db] hover:text-[#0f66db]/80 font-medium px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg"
                            >
                              Mark all read
                            </button>
                          )}
                          <button
                            onClick={() => setNotificationOpen(false)}
                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {loading ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0f66db] mx-auto"></div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm font-medium">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={clsx(
                                'p-4 hover:bg-gray-50 cursor-pointer',
                                !notification.read_at && 'bg-blue-50'
                              )}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                  {getSeverityIcon(notification.severity)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {formatTimeAgo(notification.created_at)}
                                  </p>
                                </div>
                                {!notification.read_at && (
                                  <div className="w-2 h-2 bg-[#0f66db] rounded-full"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile - With border */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 px-4 py-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors duration-200 h-12"
              >
                <div className="h-8 w-8 rounded-xl bg-[#0f66db] flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {user?.first_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">Account</p>
                </div>
                <ChevronDown className={clsx(
                  "h-4 w-4 text-gray-400 transition-transform",
                  userMenuOpen && "rotate-180"
                )} />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div 
                    className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-[#0f66db] flex items-center justify-center">
                          <span className="font-semibold text-white">
                            {user?.first_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user?.first_name} {user?.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                          <p className="text-xs text-[#0f66db] font-medium truncate">
                            {user?.organizations?.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      {[
                        { icon: Settings, label: 'Settings', href: '/settings' },
                        { icon: Building2, label: 'Organization', href: '/organization' },
                        { icon: Users, label: 'Team', href: '/team' },
                        { icon: CreditCard, label: 'Billing', href: '/billing' },
                        { icon: HelpCircle, label: 'Support', href: '/help' }
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            router.push(item.href)
                            setUserMenuOpen(false)
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#0f66db]"
                        >
                          <item.icon className="h-4 w-4 mr-3 text-gray-500" />
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 py-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Organization Info - With border */}
            <div className="hidden md:flex items-center space-x-3 px-4 py-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 h-12">
              <div className="w-8 h-8 rounded-xl bg-[#25b43d] flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.organizations?.name || 'Organization'}
                </p>
                <p className="text-xs text-gray-500">Company</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}