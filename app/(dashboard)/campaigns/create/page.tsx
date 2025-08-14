'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCampaignStore } from '@/store/useCampaignStore'
import { 
  ArrowLeft, 
  Mail, 
  Users, 
  Calendar, 
  Eye,
  Send,
  Save,
  Wand2
} from 'lucide-react'

export default function CreateCampaignPage() {
  const router = useRouter()
  const { createCampaign } = useCampaignStore()
  
  const [isCreating, setIsCreating] = useState(false)
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'one-time' as const
  })

  const handleCreateDraft = async () => {
    if (!campaignData.name.trim()) {
      alert('Please enter a campaign name')
      return
    }

    try {
      setIsCreating(true)
      const campaign = await createCampaign({
        ...campaignData,
        status: 'draft'
      })
      
      // For now, redirect back to campaigns list
      // Later we'll redirect to the campaign builder
      router.push('/campaigns')
      
    } catch (error) {
      console.error('Failed to create campaign:', error)
      alert('Failed to create campaign. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/campaigns"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
        <p className="mt-1 text-lg text-gray-600">
          Build and send beautiful email campaigns to your contacts
        </p>
      </div>

      {/* Quick Start Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Campaign Details</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                value={campaignData.name}
                onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Welcome Email, Monthly Newsletter"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject Line
              </label>
              <input
                type="text"
                id="subject"
                value={campaignData.subject}
                onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Welcome to our community!"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Type
              </label>
              <select
                id="type"
                value={campaignData.type}
                onChange={(e) => setCampaignData(prev => ({ ...prev, type: e.target.value as 'one-time' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="one-time">One-time Campaign</option>
                <option value="recurring" disabled>Recurring Campaign (Coming Soon)</option>
              </select>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Email Content (Optional)
              </label>
              <textarea
                id="content"
                value={campaignData.content}
                onChange={(e) => setCampaignData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                placeholder="Start writing your email content or leave blank to use our builder..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/campaigns')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateDraft}
              disabled={isCreating || !campaignData.name.trim()}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Draft
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Coming Soon: Full Campaign Builder</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <Wand2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Drag & Drop Editor</h4>
              <p className="text-sm text-blue-700">Build beautiful emails with our visual editor</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Contact Selection</h4>
              <p className="text-sm text-blue-700">Choose specific contacts or segments</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Scheduling</h4>
              <p className="text-sm text-blue-700">Send immediately or schedule for later</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Preview & Testing</h4>
              <p className="text-sm text-blue-700">Test emails before sending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}