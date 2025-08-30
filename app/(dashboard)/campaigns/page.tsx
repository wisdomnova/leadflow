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
  RotateCcw,
  MoreVertical,
  Activity,
  MousePointer,
  Send,
  Filter,
  Grid3X3,
  List,
  Zap,
  Target,
  Settings
} from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

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

// Campaign Card Component
const CampaignCard = ({ 
  campaign, 
  onEdit, 
  onView, 
  onDuplicate, 
  onDelete, 
  onAction,
  actionLoading 
}: {
  campaign: any
  onEdit: () => void
  onView: () => void
  onDuplicate: () => void
  onDelete: () => void
  onAction: (action: 'launch' | 'pause' | 'resume' | 'stop') => void
  actionLoading: boolean
}) => {
  const [showDropdown, setShowDropdown] = useState(false)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="h-3 w-3" />,
          label: 'Draft',
          dot: 'bg-gray-400'
        }
      case 'ready':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Target className="h-3 w-3" />,
        label: 'Ready to Launch',
        dot: 'bg-blue-500'
      }
      case 'sending':
      case 'active':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Activity className="h-3 w-3" />,
          label: 'Sending',
          dot: 'bg-green-500 animate-pulse'
        }
      case 'paused':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Pause className="h-3 w-3" />,
          label: 'Paused',
          dot: 'bg-yellow-500'
        }
      case 'completed':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <CheckCircle className="h-3 w-3" />,
          label: 'Completed',
          dot: 'bg-blue-500'
        }
      case 'stopped':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <Square className="h-3 w-3" />,
          label: 'Stopped',
          dot: 'bg-red-500'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="h-3 w-3" />,
          label: status,
          dot: 'bg-gray-400'
        }
    }
  }

  const statusConfig = getStatusConfig(campaign.status)
  const openRate = campaign.total_recipients > 0 ? ((campaign.opened / campaign.total_recipients) * 100).toFixed(1) : '0'
  const clickRate = campaign.total_recipients > 0 ? ((campaign.clicked / campaign.total_recipients) * 100).toFixed(1) : '0'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
    >
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${statusConfig.color}`}>
                {statusConfig.icon}
                <span className="ml-1.5">{statusConfig.label}</span>
              </span>
            </div>
            <h3 
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
              onClick={onView}
            >
              {campaign.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {campaign.description || campaign.subject || 'No description'}
            </p>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => { onEdit(); setShowDropdown(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-3" />
                  Edit Campaign
                </button>
                <button
                  onClick={() => { onView(); setShowDropdown(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Eye className="h-4 w-4 mr-3" /> 
                  View Details
                </button>
                <button
                  onClick={() => { onDuplicate(); setShowDropdown(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Copy className="h-4 w-4 mr-3" />
                  Duplicate
                </button>
                
                {/* Add a separator line before delete */}
                {['draft', 'ready', 'completed', 'stopped'].includes(campaign.status) && (
                  <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => { onDelete(); setShowDropdown(false) }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      Delete Campaign
                    </button>
                  </>
                )}
                
                {/* Show warning for active campaigns */}
                {['sending', 'paused'].includes(campaign.status) && (
                  <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 rounded-lg mx-2">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Stop campaign first to delete
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {campaign.total_recipients.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Recipients</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{openRate}%</div>
            <div className="text-xs text-gray-500">Open Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{clickRate}%</div>
            <div className="text-xs text-gray-500">Click Rate</div>
          </div>
        </div>
      </div>

      {/* Card Footer - Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Created {new Date(campaign.created_at).toLocaleDateString()}
          </div>
          
          <div className="flex items-center space-x-2">
            {(campaign.status === 'draft' || campaign.status === 'ready') && (
              <button
                onClick={() => onAction('launch')} 
                disabled={actionLoading || campaign.total_recipients === 0}
                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                ) : (
                  <Play className="h-3 w-3 mr-1.5" />
                )}
                Launch
              </button>
            )}

            {(campaign.status === 'sending' || campaign.status === 'active') && (
              <button
                onClick={() => onAction('pause')}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-yellow-700 bg-white rounded-lg hover:bg-yellow-50 disabled:opacity-50 text-xs font-medium transition-colors"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-1.5"></div>
                ) : (
                  <Pause className="h-3 w-3 mr-1.5" />
                )}
                Pause
              </button>
            )}

            {campaign.status === 'paused' && (
              <button
                onClick={() => onAction('resume')}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-xs font-medium transition-colors"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                ) : (
                  <RotateCcw className="h-3 w-3 mr-1.5" />
                )}
                Resume
              </button>
            )}

            <button
              onClick={onView}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 text-xs font-medium transition-colors"
            >
              <Eye className="h-3 w-3 mr-1.5" />
              View
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
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

  const clearCreateCampaignState = () => {
    localStorage.removeItem('createCampaign_currentStep')
    localStorage.removeItem('createCampaign_data')
    localStorage.removeItem('createCampaign_id')
    localStorage.removeItem('createCampaign_template')
    localStorage.removeItem('createCampaign_showForm')
    localStorage.removeItem('createCampaign_selectedContacts')
    localStorage.removeItem('createCampaign_lastActive')
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await deleteCampaign(campaignId)
      
      // Clear localStorage if this was the campaign being created
      const savedCampaignId = localStorage.getItem('createCampaign_id')
      if (savedCampaignId === campaignId) {
        clearCreateCampaignState()
      }
      
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

  // Stats calculations
  const stats = [
    {
      label: 'Total Campaigns',
      value: allCampaigns.length,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Active Campaigns',
      value: allCampaigns.filter(c => ['sending', 'active', 'scheduled'].includes(c.status)).length, // Add 'active' here
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Total Recipients',
      value: allCampaigns.reduce((sum, c) => sum + c.total_recipients, 0),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      format: 'number'
    },
    {
      label: 'Avg. Open Rate',
      value: allCampaigns.length > 0 
        ? (allCampaigns.reduce((sum, c) => sum + (c.total_recipients > 0 ? (c.opened / c.total_recipients) : 0), 0) / allCampaigns.length * 100)
        : 0,
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      format: 'percentage'
    }
  ]

  if (loading && allCampaigns.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
              <p className="mt-1 text-gray-600">
                Create and manage your email marketing campaigns
              </p>
            </div>
            <Link
              href="/campaigns/create"
              onClick={clearCreateCampaignState}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              let displayValue: string | number = stat.value
              
              if (stat.format === 'number') {
                displayValue = stat.value.toLocaleString()
              } else if (stat.format === 'percentage') {
                displayValue = `${stat.value.toFixed(1)}%`
              }

              return (
                <motion.div
                  key={stat.label}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-colors"
                  />
                </div>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 min-w-[140px] transition-colors"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option> {/* Add this */}
                <option value="sending">Sending</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="stopped">Stopped</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={clsx(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              <span className="text-sm text-gray-500">
                {filteredCampaigns.length} of {allCampaigns.length} campaigns
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredCampaigns.length === 0 && !loading ? (
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No campaigns found' : 'No campaigns yet'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters to find the campaigns you\'re looking for.'
                : 'Create your first email campaign to start engaging with your contacts and growing your business.'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/campaigns/create"
                  onClick={clearCreateCampaignState}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Link>
                <Link
                  href="/campaigns/templates"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Browse Templates
                </Link>
              </div>
            )}
          </motion.div>
        ) : (
          /* Campaigns Grid/Table */
          <div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredCampaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onEdit={() => router.push(`/campaigns/${campaign.id}/edit`)}
                      onView={() => router.push(`/campaigns/${campaign.id}`)}
                      onDuplicate={() => handleDuplicateCampaign(campaign.id)}
                      onDelete={() => {
                        setCampaignToDelete(campaign.id)
                        setShowDeleteModal(true)
                      }}
                      onAction={(action) => handleCampaignAction(campaign.id, action)}
                      actionLoading={actionLoading[campaign.id] || false}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* Table View - Your existing table implementation would go here */
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-900">Table view coming soon</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-500">Please use grid view for now.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Delete Campaign</h3>
                      <p className="text-sm text-gray-600">This action cannot be undone</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to delete this campaign? All associated data will be permanently removed.
                  </p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => campaignToDelete && handleDeleteCampaign(campaignToDelete)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors"
                    >
                      Delete Campaign
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}