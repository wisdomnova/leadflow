// ./components/layout/Header.tsx - Removed glass transparency effects

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  UserCircle,
  CreditCard, 
  HelpCircle,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Menu
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

  // Initialize notifications and realtime
  useEffect(() => {
    if (user?.id && user?.organization_id) {
      fetchNotifications()
      subscribeToRealtime(user.id, user.organization_id)
    }

    return () => {
      unsubscribeFromRealtime()
    }
  }, [user?.id, user?.organization_id])

  // Close dropdowns when clicking outside
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
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate lg:hidden">
              Dashboard
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <motion.button 
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <motion.span 
                    className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full text-xs text-white flex items-center justify-center font-medium shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.span>
                )}
              </motion.button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notificationOpen && (
                  <motion.div 
                    className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center space-x-3">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              Mark all read
                            </button>
                          )}
                          <button
                            onClick={() => setNotificationOpen(false)}
                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Bell className="h-8 w-8 text-gray-300" />
                          </div>
                          <p className="text-sm font-medium">No notifications yet</p>
                          <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification, index) => (
                            <motion.div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={clsx(
                                'p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200',
                                !notification.read_at && 'bg-blue-50'
                              )}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ x: 4 }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-200">
                                    {getSeverityIcon(notification.severity)}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={clsx(
                                    'text-sm font-medium text-gray-900',
                                    !notification.read_at && 'font-semibold'
                                  )}>
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {formatTimeAgo(notification.created_at)}
                                  </p>
                                </div>
                                {!notification.read_at && (
                                  <div className="flex-shrink-0">
                                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm"></div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <motion.button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-white shadow-sm">
                  <span className="text-sm font-bold text-blue-700">
                    {user?.first_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.organizations?.name}
                  </p>
                </div>
                <ChevronDown className={clsx(
                  "h-4 w-4 text-gray-400 transition-transform duration-200",
                  userMenuOpen && "rotate-180"
                )} />
              </motion.button>

              {/* User Dropdown */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div 
                    className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 z-50"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-white shadow-sm">
                          <span className="text-lg font-bold text-blue-700">
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
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      {[
                        { icon: Settings, label: 'Settings', href: '/settings' },
                        { icon: CreditCard, label: 'Billing', href: '/billing' },
                        { icon: HelpCircle, label: 'Help & Support', href: '/help' }
                      ].map((item, index) => (
                        <motion.button
                          key={item.label}
                          onClick={() => {
                            router.push(item.href)
                            setUserMenuOpen(false)
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center mr-3">
                            <item.icon className="h-4 w-4 text-gray-600" />
                          </div>
                          {item.label}
                        </motion.button>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 py-2">
                      <motion.button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition-all duration-200"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                      >
                        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center mr-3">
                          <LogOut className="h-4 w-4 text-red-500" />
                        </div>
                        Sign out
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}