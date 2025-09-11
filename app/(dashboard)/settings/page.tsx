// ./app/(dashboard)/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Bell, 
  Shield, 
  Save,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Check,
  Globe,
  Clock
} from 'lucide-react'
import clsx from 'clsx'

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

interface UserSettings {
  name: string
  email: string
  company: string
  timezone: string
  language: string
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  securityAlerts: boolean
  theme: 'light' | 'dark' | 'auto'
}

// Custom Select Component
interface CustomSelectProps {
  value: string
  options: { value: string; label: string; icon?: any }[]
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  icon?: any
}

function CustomSelect({ value, options, onChange, className, placeholder, icon: Icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={clsx("relative", className)}>
      <button
        type="button"
        className="relative w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-xl shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:border-transparent hover:bg-gray-50 transition-all duration-200"
        style={{ 
          '--tw-ring-color': THEME_COLORS.primary
        } as any}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center">
          {Icon && <Icon className="h-4 w-4 mr-3 text-gray-400" />}
          <span className="block truncate text-gray-900 font-medium">
            {selectedOption?.label || placeholder || 'Select...'}
          </span>
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown 
            className={clsx(
              "h-4 w-4 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
            >
              <div className="py-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    className={clsx(
                      "w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors duration-150",
                      value === option.value && "text-white font-medium"
                    )}
                    style={value === option.value ? { backgroundColor: THEME_COLORS.primary } : {}}
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center">
                      {option.icon && <option.icon className="h-4 w-4 mr-3 text-gray-400" />}
                      <span className={value === option.value ? "text-white" : "text-gray-900"}>
                        {option.label}
                      </span>
                    </div>
                    {value === option.value && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [settings, setSettings] = useState<UserSettings>({
    name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
    email: user?.email || '',
    company: user?.organizations?.name || '',
    timezone: 'UTC',
    language: 'en',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    theme: 'light'
  })
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email,
        company: user?.organizations?.name || ''
      }))
    }
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.name,
          timezone: settings.timezone,
          language: settings.language
        })
      })

      if (response.ok) {
        // Show success message
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    }
    setIsSaving(false)
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          marketingEmails: settings.marketingEmails,
          securityAlerts: settings.securityAlerts
        })
      })

      if (response.ok) {
        // Show success message
      }
    } catch (error) {
      console.error('Failed to save notifications:', error)
    }
    setIsSaving(false)
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      // Show error
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      if (response.ok) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        // Show success message
      }
    } catch (error) {
      console.error('Failed to change password:', error)
    }
    setIsSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      return
    }

    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE'
      })

      if (response.ok) {
        // Redirect to sign out
        window.location.href = '/auth/signin'
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (EST)' },
    { value: 'America/Chicago', label: 'Central Time (CST)' },
    { value: 'America/Denver', label: 'Mountain Time (MST)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PST)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    { value: 'America/Toronto', label: 'Toronto (EST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' }
  ]

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'fr', label: 'Français (French)' },
    { value: 'de', label: 'Deutsch (German)' },
    { value: 'it', label: 'Italiano (Italian)' },
    { value: 'pt', label: 'Português (Portuguese)' },
    { value: 'ja', label: '日本語 (Japanese)' },
    { value: 'ko', label: '한국어 (Korean)' },
    { value: 'zh', label: '中文 (Chinese)' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Settings
          </h1>
          <p className="text-lg text-gray-600">
            Manage your account preferences and settings
          </p>
        </motion.div>

        <motion.div
          className="space-y-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >

          {/* Profile Settings */}
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
            variants={staggerItem}
          >
            <div className="flex items-center mb-8">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-md"
                style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
              >
                <User className="h-6 w-6" style={{ color: THEME_COLORS.primary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
                <p className="text-gray-600">Update your personal information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 shadow-sm transition-all duration-200"
                  style={{ 
                    '--tw-ring-color': THEME_COLORS.primary
                  } as any}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  value={settings.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 shadow-sm"
                />
                <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Organization
                </label>
                <input
                  type="text"
                  value={settings.company}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 shadow-sm"
                />
                <p className="text-xs text-gray-500 mt-2">Organization is managed by your admin</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Timezone
                </label>
                <CustomSelect
                  value={settings.timezone}
                  options={timezones}
                  onChange={(value) => setSettings({ ...settings, timezone: value })}
                  icon={Clock}
                  placeholder="Select timezone"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Language
                </label>
                <div className="max-w-md">
                  <CustomSelect
                    value={settings.language}
                    options={languages}
                    onChange={(value) => setSettings({ ...settings, language: value })}
                    icon={Globe}
                    placeholder="Select language"
                  />
                </div>
              </div>
            </div>

            <motion.button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="inline-flex items-center px-8 py-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 font-medium shadow-sm"
              style={{ backgroundColor: THEME_COLORS.primary }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </motion.button>
          </motion.div>

          {/* Notification Settings */}
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
            variants={staggerItem}
          >
            <div className="flex items-center mb-8">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-md"
                style={{ backgroundColor: `${THEME_COLORS.secondary}20` }}
              >
                <Bell className="h-6 w-6" style={{ color: THEME_COLORS.secondary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                <p className="text-gray-600">Choose what notifications you receive</p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Email Notifications</h3>
                  <p className="text-sm text-gray-600 mt-1">Receive notifications via email</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'shadow-md' : 'bg-gray-200'
                  }`}
                  style={settings.emailNotifications ? { backgroundColor: THEME_COLORS.primary } : {}}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Push Notifications</h3>
                  <p className="text-sm text-gray-600 mt-1">Receive push notifications in your browser</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, pushNotifications: !settings.pushNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.pushNotifications ? 'shadow-md' : 'bg-gray-200'
                  }`}
                  style={settings.pushNotifications ? { backgroundColor: THEME_COLORS.primary } : {}}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Marketing Emails</h3>
                  <p className="text-sm text-gray-600 mt-1">Receive emails about new features and updates</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, marketingEmails: !settings.marketingEmails })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.marketingEmails ? 'shadow-md' : 'bg-gray-200'
                  }`}
                  style={settings.marketingEmails ? { backgroundColor: THEME_COLORS.primary } : {}}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      settings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Security Alerts</h3>
                  <p className="text-sm text-gray-600 mt-1">Important security and account notifications</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, securityAlerts: !settings.securityAlerts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.securityAlerts ? 'shadow-md' : 'bg-gray-200'
                  }`}
                  style={settings.securityAlerts ? { backgroundColor: THEME_COLORS.primary } : {}}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      settings.securityAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <motion.button
              onClick={handleSaveNotifications}
              disabled={isSaving}
              className="inline-flex items-center px-8 py-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 font-medium shadow-sm"
              style={{ backgroundColor: THEME_COLORS.primary }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Notifications'}
            </motion.button>
          </motion.div>

          {/* Security Settings */}
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
            variants={staggerItem}
          >
            <div className="flex items-center mb-8">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-md"
                style={{ backgroundColor: `${THEME_COLORS.accent}20` }}
              >
                <Shield className="h-6 w-6" style={{ color: THEME_COLORS.accent }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Security</h2>
                <p className="text-gray-600">Manage your account security</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent pr-12 text-gray-900 shadow-sm transition-all duration-200"
                    style={{ 
                      '--tw-ring-color': THEME_COLORS.primary
                    } as any}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 hover:bg-gray-50 rounded-r-xl transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 shadow-sm transition-all duration-200"
                  style={{ 
                    '--tw-ring-color': THEME_COLORS.primary
                  } as any}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 shadow-sm transition-all duration-200"
                  style={{ 
                    '--tw-ring-color': THEME_COLORS.primary
                  } as any}
                />
              </div>
            </div>

            <motion.button
              onClick={handleChangePassword}
              disabled={isSaving || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="inline-flex items-center px-8 py-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 font-medium shadow-sm"
              style={{ backgroundColor: THEME_COLORS.accent }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Shield className="h-4 w-4 mr-2" />
              {isSaving ? 'Changing...' : 'Change Password'}
            </motion.button>
          </motion.div>

          {/* Danger Zone */}
          <motion.div 
            className="bg-white rounded-2xl border border-red-200 shadow-lg p-8"
            variants={staggerItem}
          >
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mr-4 shadow-md">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Danger Zone</h2>
                <p className="text-gray-600">Irreversible and destructive actions</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Account</h3>
              <p className="text-red-700 mb-4">
                This will permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              <motion.button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 hover:shadow-lg transition-all duration-200 font-medium shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </motion.button>
            </div>
          </motion.div>

        </motion.div>

        {/* Delete Account Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div 
              className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div 
                className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account</h3>
                  <p className="text-gray-600">
                    This action cannot be undone. All your data will be permanently deleted.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Type "DELETE" to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 shadow-sm"
                    placeholder="DELETE"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button> 
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== 'DELETE'}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 hover:shadow-lg transition-all duration-200 disabled:opacity-50 font-medium"
                  >
                    Delete Account
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}