// app/(dashboard)/affiliate/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Users, TrendingUp, Copy, Share } from 'lucide-react'

export default function AffiliateDashboard() {
  const [affiliate, setAffiliate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchAffiliate()
  }, [])

  const fetchAffiliate = async () => {
    try {
      const response = await fetch('/api/affiliate/dashboard')
      const data = await response.json()
      
      if (response.ok) {
        setAffiliate(data)
      } else if (response.status === 404) {
        // No affiliate account yet
        setAffiliate(null)
      }
    } catch (error) {
      console.error('Failed to fetch affiliate data:', error)
    } finally {
      setLoading(false)
    }
  }

  const joinAffiliate = async () => {
    try {
      const response = await fetch('/api/affiliate/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_email: 'your@email.com', // You'd get this from a form
          payment_method: 'stripe'
        })
      })
      
      if (response.ok) {
        fetchAffiliate() // Refresh data
      }
    } catch (error) {
      console.error('Failed to join affiliate program:', error)
    }
  }

  const copyReferralLink = async () => {
    if (affiliate?.affiliate.referral_link) {
      await navigator.clipboard.writeText(affiliate.affiliate.referral_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!affiliate) {
    return (
      <div className="p-8">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Join Our Affiliate Program</h1>
          <p className="text-gray-600 mb-6">Earn 15% lifetime commission on every referral!</p>
          <button 
            onClick={joinAffiliate}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Join Now
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Affiliate Dashboard</h1>
        <p className="text-gray-600">Track your referrals and earnings</p>
      </div>

      {/* Status Badge */}
      {affiliate.affiliate.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-medium">Your affiliate account is pending approval.</p>
        </div>
      )}

      {/* Referral Link */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Referral Link</h2>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={affiliate.affiliate.referral_link}
            readOnly
            className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 text-sm"
          />
          <button
            onClick={copyReferralLink}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{affiliate.affiliate.total_referrals}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${affiliate.affiliate.pending_earnings.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${affiliate.affiliate.total_earnings.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  )
}