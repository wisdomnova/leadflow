// ./app/(dashboard)/campaigns/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCampaignStore } from '@/store/useCampaignStore'
import SequenceBuilder from '@/components/campaigns/SequenceBuilder'
import { ArrowLeft, Save, Eye, Settings, Clock, Calendar, Send, CheckCircle, Pause } from 'lucide-react'

export default function EditCampaignPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  
  const { campaigns, fetchCampaigns, updateCampaign, loading } = useCampaignStore()
  const [campaign, setCampaign] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'sequence' | 'settings'>('sequence')
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    type: 'sequence' as 'sequence' | 'single',
    from_name: '',
    from_email: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Fetch campaigns if not already loaded
    if (campaigns.length === 0) {
      fetchCampaigns()
    }
  }, [campaigns.length, fetchCampaigns])

  useEffect(() => {
    // Find the campaign once campaigns are loaded
    if (campaigns.length > 0 && campaignId) {
      const foundCampaign = campaigns.find(c => c.id === campaignId)
      if (foundCampaign) {
        setCampaign(foundCampaign)
        setCampaignData({
          name: foundCampaign.name,
          description: foundCampaign.description || '',
          type: (foundCampaign.type === 'sequence' || foundCampaign.type === 'single') ? foundCampaign.type : 'sequence',
          from_name: foundCampaign.from_name || '',
          from_email: foundCampaign.from_email || ''
        })
      }
    }
  }, [campaigns, campaignId])

  const handleSaveCampaignDetails = async () => {
    if (!campaign) return

    setSaving(true)
    try {
      await updateCampaign(campaign.id, {
        name: campaignData.name,
        description: campaignData.description,
        type: campaignData.type,
        from_name: campaignData.from_name,
        from_email: campaignData.from_email
      })
      
      // Update local campaign state
      setCampaign((prev: any) => ({
        ...prev,
        ...campaignData
      }))
      
      // Show success feedback
      alert('Campaign settings saved successfully!')
    } catch (error) {
      console.error('Failed to update campaign:', error)
      alert('Failed to save campaign settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSequenceSave = () => {
    // Sequence is saved automatically in SequenceBuilder
    console.log('Sequence saved!')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <Clock className="h-4 w-4 mr-1" />
            Draft
          </span>
        )
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Calendar className="h-4 w-4 mr-1" />
            Scheduled
          </span>
        )
      case 'sending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Send className="h-4 w-4 mr-1" />
            Sending
          </span>
        )
      case 'sent':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Sent
          </span>
        )
      case 'paused':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            <Pause className="h-4 w-4 mr-1" />
            Paused
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        )
    }
  }

  if (loading || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'sequence', name: 'Email Sequence', icon: Eye },
    { id: 'settings', name: 'Campaign Settings', icon: Settings }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/campaigns/${campaignId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                {getStatusBadge(campaign.status)}
              </div>
              <p className="text-gray-600">Edit your campaign</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/campaigns/${campaignId}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Campaign
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'sequence' | 'settings')}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'sequence' && (
          <div className="p-6">
            <SequenceBuilder 
              campaignId={campaignId}
              onSave={handleSequenceSave}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Campaign Settings</h2>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter campaign name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={campaignData.description}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your campaign"
                  />
                </div>

                {/* Sender Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sender Information
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From Name</label>
                      <input
                        type="text"
                        value={campaignData.from_name}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, from_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From Email</label>
                      <input
                        type="email"
                        value={campaignData.from_email}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, from_email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This information will appear in the "From" field of your emails
                  </p>
                </div>

                {/* Campaign Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Campaign Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        campaignData.type === 'sequence' 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCampaignData(prev => ({ ...prev, type: 'sequence' }))}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="campaignType"
                          value="sequence"
                          checked={campaignData.type === 'sequence'}
                          onChange={() => setCampaignData(prev => ({ ...prev, type: 'sequence' }))}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">Email Sequence</div>
                          <div className="text-xs text-gray-500">2-5 emails with delays</div>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        campaignData.type === 'single' 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCampaignData(prev => ({ ...prev, type: 'single' }))}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="campaignType"
                          value="single"
                          checked={campaignData.type === 'single'}
                          onChange={() => setCampaignData(prev => ({ ...prev, type: 'single' }))}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">Single Email</div>
                          <div className="text-xs text-gray-500">One email sent immediately</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Campaign Status
                  </label>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(campaign.status)}
                      <div>
                        <div className="text-sm text-gray-900">
                          {campaign.status === 'draft' && 'Campaign is in draft mode'}
                          {campaign.status === 'scheduled' && 'Campaign is scheduled to launch'}
                          {campaign.status === 'sending' && 'Campaign is currently sending'}
                          {campaign.status === 'sent' && 'Campaign has been sent'}
                          {campaign.status === 'paused' && 'Campaign is paused'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {campaign.status === 'draft' && 'Add contacts and launch when ready'}
                          {campaign.status === 'scheduled' && `Scheduled for ${campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleDateString() : 'soon'}`}
                          {campaign.status === 'sending' && 'Emails are being sent to contacts'}
                          {campaign.status === 'sent' && `Completed on ${campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : 'unknown date'}`}
                          {campaign.status === 'paused' && 'Campaign sending is paused'}
                        </div>
                      </div>
                    </div>
                    
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => router.push(`/campaigns/${campaignId}`)}
                        className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                      >
                        Add contacts to launch →
                      </button>
                    )}
                  </div>
                </div>

                {/* Campaign Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Created</label>
                    <div className="text-sm text-gray-900">
                      {new Date(campaign.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Last Updated</label>
                    <div className="text-sm text-gray-900">
                      {new Date(campaign.updated_at || campaign.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Changes will be saved and applied to your campaign
                    </div>
                    <button
                      onClick={handleSaveCampaignDetails}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}