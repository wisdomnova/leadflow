// components/EmailAccountBanner.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Mail, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export function EmailAccountBanner() {
  const { user } = useAuth()
  const [showBanner, setShowBanner] = useState(false)
  const [emailAccounts, setEmailAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchEmailAccounts = async () => {
      try {
        const response = await fetch('/api/email-accounts')
        if (response.ok) {
          const data = await response.json()
          const accounts = data.accounts || []
          setEmailAccounts(accounts)

          const activeAccounts = accounts.filter((acc: any) => 
            acc.status === 'active' || acc.status === 'warming_up'
          )

          // Show banner if no active email accounts
          setShowBanner(activeAccounts.length === 0)
        }
      } catch (error) {
        console.error('Error fetching email accounts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmailAccounts()
  }, [user])

  if (loading || !showBanner) return null

  return (
    <AnimatePresence>
      <motion.div 
        className="mx-6 mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, type: "spring" }}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-md">
              <Mail className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-blue-900 mb-2">
              Connect Your Email to Start Sending Campaigns
            </h3>
            <p className="text-base text-blue-800 mb-4 leading-relaxed">
              Connect your Gmail or Outlook account to send campaigns with better deliverability. 
              Your emails will be sent from your own account, not a shared server.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/email-accounts"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
              >
                <Mail className="w-4 h-4 mr-2" />
                Connect Email Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <button
                onClick={() => setShowBanner(false)}
                className="inline-flex items-center px-6 py-3 bg-white text-blue-700 text-sm font-semibold rounded-xl border border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                Maybe Later
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}