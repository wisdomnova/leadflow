// ./app/(dashboard)/settings/page.tsx - Fixed to match your User interface

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { 
  User, 
  Bell, 
  Shield, 
  Save,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle
} from 'lucide-react'

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
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>({
    name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
    email: user?.email || '',
    company: '',
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
        email: user.email
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
          company: settings.company,
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
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' }
  ]

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Settings
          </h1>
          <p className="text-xl text-gray-600">
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
            className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10"
            variants={staggerItem}
          >
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mr-4">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
                <p className="text-gray-600">Update your personal information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={settings.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={settings.company}
                  onChange={(e) => setSettings({ ...settings, company: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <motion.button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </motion.button>
          </motion.div>

          {/* Notification Settings */}
          <motion.div 
            className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10"
            variants={staggerItem}
          >
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mr-4">
                <Bell className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                <p className="text-gray-600">Choose what notifications you receive</p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, pushNotifications: !settings.pushNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">Marketing Emails</h3>
                  <p className="text-sm text-gray-600">Receive emails about new features and updates</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, marketingEmails: !settings.marketingEmails })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.marketingEmails ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">Security Alerts</h3>
                  <p className="text-sm text-gray-600">Important security and account notifications</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, securityAlerts: !settings.securityAlerts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.securityAlerts ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.securityAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <motion.button
              onClick={handleSaveNotifications}
              disabled={isSaving}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Notifications'}
            </motion.button>
          </motion.div>

          {/* Security Settings */}
          <motion.div 
            className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10"
            variants={staggerItem}
          >
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Security</h2>
                <p className="text-gray-600">Manage your account security</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <motion.button
              onClick={handleChangePassword}
              disabled={isSaving || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Shield className="h-4 w-4 mr-2" />
              {isSaving ? 'Changing...' : 'Change Password'}
            </motion.button>
          </motion.div>

          {/* Danger Zone */}
          <motion.div 
            className="bg-white rounded-3xl border border-red-200 shadow-sm p-10"
            variants={staggerItem}
          >
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mr-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Danger Zone</h2>
                <p className="text-gray-600">Irreversible and destructive actions</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Account</h3>
              <p className="text-red-700 mb-4">
                This will permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              <motion.button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
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
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div 
              className="bg-white rounded-3xl p-8 max-w-md w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "DELETE" to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE'}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}