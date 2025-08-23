// ./app/(dashboard)/campaigns/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCampaignStore } from '@/store/useCampaignStore'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  Mail, 
  Search, 
  Plus, 
  MoreVertical,  
  Play, 
  Pause, 
  Copy, 
  Trash2, 
  Calendar,
  Users,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Square,
  RotateCcw
} from 'lucide-react'
import clsx from 'clsx'

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => { 
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function CampaignsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const {
    campaigns: allCampaigns,
    loading,
    fetchCampaigns,
    deleteCampaign,
    duplicateCampaign,
    updateCampaign,
    subscribeToRealtime,
    unsubscribeFromRealtime
  } = useCampaignStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Client-side filtering
  const filteredCampaigns = useMemo(() => {
    let filtered = [...allCampaigns]

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(campaign => 
        campaign.name.toLowerCase().includes(query) ||
        (campaign.subject && campaign.subject.toLowerCase().includes(query)) ||
        (campaign.description && campaign.description.toLowerCase().includes(query))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter)
    }

    return filtered
  }, [allCampaigns, debouncedSearchQuery, statusFilter])

  useEffect(() => {
    fetchCampaigns()
    
    // Subscribe to real-time updates
    if (user?.organization_id) {
      subscribeToRealtime(user.organization_id)
    }

    return () => {
      unsubscribeFromRealtime()
    }
  }, [fetchCampaigns, subscribeToRealtime, unsubscribeFromRealtime, user?.organization_id])

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await deleteCampaign(campaignId)
      setShowDeleteModal(false)
      setCampaignToDelete(null)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handleDuplicateCampaign = async (campaignId: string) => {
    try {
      await duplicateCampaign(campaignId) 
    } catch (error) {
      console.error('Duplicate failed:', error)
    }
  }

  // Updated campaign action handler using EmailScheduler
  const handleCampaignAction = async (campaignId: string, action: 'launch' | 'pause' | 'resume' | 'stop') => {
    if (actionLoading[campaignId]) return

    setActionLoading(prev => ({ ...prev, [campaignId]: true }))
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/${action}`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${action} campaign`)
      }
      
      const result = await response.json()
      
      // Show appropriate success message
      if (action === 'launch') {
        alert(`🚀 Campaign launched! ${result.contactsScheduled || 'Contacts'} scheduled for sending.`)
      } else if (action === 'pause') {
        alert('⏸️ Campaign paused. Email sending has been stopped.')
      } else if (action === 'resume') {
        alert('▶️ Campaign resumed. Email sending will continue.')
      } else if (action === 'stop') {
        alert('🛑 Campaign stopped permanently.')
      }
      
      // Refresh campaigns list to show updated status
      await fetchCampaigns()
      
    } catch (error) {
      console.error(`Failed to ${action} campaign:`, error)
      alert(error instanceof Error ? error.message : `Failed to ${action} campaign`)
    } finally {
      setActionLoading(prev => ({ ...prev, [campaignId]: false }))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </span>
        )
      case 'sending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <TrendingUp className="h-3 w-3 mr-1" />
            Sending
          </span>
        )
      case 'paused':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Pause className="h-3 w-3 mr-1" />
            Paused
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        )
      case 'stopped':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Square className="h-3 w-3 mr-1" />
            Stopped
          </span>
        )
      // Legacy status support
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Calendar className="h-3 w-3 mr-1" />
            Scheduled
          </span>
        )
      case 'sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sent
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        )
    }
  }

  const getOpenRate = (campaign: any) => {
    if (campaign.total_recipients === 0) return 0
    return ((campaign.opened / campaign.total_recipients) * 100).toFixed(1)
  }

  const getClickRate = (campaign: any) => {
    if (campaign.total_recipients === 0) return 0
    return ((campaign.clicked / campaign.total_recipients) * 100).toFixed(1)
  }

  // Function to render action buttons based on campaign status
  const renderActionButtons = (campaign: any) => {
    const isLoading = actionLoading[campaign.id]
    
    return (
      <div className="flex items-center justify-end space-x-2">
        {/* Edit button - goes to edit page */}
        <Link
          href={`/campaigns/${campaign.id}/edit`}
          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
          title="Edit campaign"
          onClick={(e) => e.stopPropagation()}
        >
          <Edit className="h-4 w-4" />
        </Link>

        {/* View button - goes to campaign detail */}
        <Link
          href={`/campaigns/${campaign.id}`}
          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
          title="View campaign"
          onClick={(e) => e.stopPropagation()}
        >
          <Eye className="h-4 w-4" />
        </Link>

        {/* Campaign Status Actions */}
        {campaign.status === 'draft' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCampaignAction(campaign.id, 'launch')
            }}
            disabled={isLoading || campaign.total_recipients === 0}
            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title={campaign.total_recipients === 0 ? "Add contacts before launching" : "Launch campaign"}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
        )}

        {campaign.status === 'sending' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCampaignAction(campaign.id, 'pause')
              }}
              disabled={isLoading}
              className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50 disabled:opacity-50"
              title="Pause campaign"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Are you sure you want to stop this campaign? This cannot be undone.')) {
                  handleCampaignAction(campaign.id, 'stop')
                }
              }}
              disabled={isLoading}
              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
              title="Stop campaign"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          </>
        )}

        {campaign.status === 'paused' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCampaignAction(campaign.id, 'resume')
              }}
              disabled={isLoading}
              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
              title="Resume campaign"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Are you sure you want to stop this campaign? This cannot be undone.')) {
                  handleCampaignAction(campaign.id, 'stop')
                }
              }}
              disabled={isLoading}
              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
              title="Stop campaign"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          </>
        )}

        {/* Duplicate button - available for all campaigns */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDuplicateCampaign(campaign.id)
          }}
          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
          title="Duplicate campaign"
        >
          <Copy className="h-4 w-4" />
        </button>

        {/* Delete button - only for draft, completed, or stopped campaigns */}
        {['draft', 'completed', 'stopped'].includes(campaign.status) && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCampaignToDelete(campaign.id)
              setShowDeleteModal(true)
            }}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete campaign"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  if (loading && allCampaigns.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-1 text-lg text-gray-600">
            Create and manage your email marketing campaigns
          </p>
        </div>
        <Link
          href="/campaigns/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Link>
      </div>

      {/* Stats - Updated to reflect new statuses */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
              <p className="text-2xl font-semibold text-gray-900">{allCampaigns.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {allCampaigns.filter(c => ['sending', 'scheduled'].includes(c.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {allCampaigns.reduce((sum, c) => sum + c.total_recipients, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Eye className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Open Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {allCampaigns.length > 0 
                  ? (allCampaigns.reduce((sum, c) => sum + (c.total_recipients > 0 ? (c.opened / c.total_recipients) : 0), 0) / allCampaigns.length * 100).toFixed(1)
                  : '0'
                }%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Updated status options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sending">Sending</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="stopped">Stopped</option>
              {/* Legacy support */}
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && !loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No campaigns found' : 'No campaigns yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first email campaign to start engaging with your contacts'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/campaigns/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Campaign
            </Link>
          )}
        </div>
      ) : (
        /* Campaign Table */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td 
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {campaign.description || campaign.subject || 'No description'}
                        </div>
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    >
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    >
                      {campaign.total_recipients.toLocaleString()}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    >
                      <div className="text-sm text-gray-900">
                        {campaign.total_recipients > 0 ? (
                          <>
                            <div>Opens: {getOpenRate(campaign)}%</div>
                            <div className="text-xs text-gray-500">Clicks: {getClickRate(campaign)}%</div>
                          </>
                        ) : (
                          <span className="text-gray-400">No data</span>
                        )}
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    >
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {renderActionButtons(campaign)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Campaign</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this campaign? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-4 px-4 py-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => campaignToDelete && handleDeleteCampaign(campaignToDelete)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}