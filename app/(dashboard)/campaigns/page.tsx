// ./app/(dashboard)/campaigns/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion' 
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
  Settings,
  ChevronDown,
  Check,
  ArrowUpRight
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

// Status filter options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status', icon: Filter },
  { value: 'draft', label: 'Draft', icon: () => <div className="h-3 w-3 rounded-full bg-gray-400" /> },
  { value: 'ready', label: 'Ready', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.primary }} /> },
  { value: 'running', label: 'Running', icon: () => <div className="h-3 w-3 rounded-full animate-pulse" style={{ backgroundColor: THEME_COLORS.success }} /> },
  { value: 'active', label: 'Active', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.success }} /> },
  { value: 'sending', label: 'Sending', icon: () => <div className="h-3 w-3 rounded-full animate-pulse" style={{ backgroundColor: THEME_COLORS.success }} /> },
  { value: 'paused', label: 'Paused', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.secondary }} /> },
  { value: 'completed', label: 'Completed', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.accent }} /> },
  { value: 'stopped', label: 'Stopped', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.warning }} /> }
]

// Custom Select Component
interface CustomSelectProps {
  value: string
  options: typeof STATUS_OPTIONS
  onChange: (value: string) => void
  className?: string
}

function CustomSelect({ value, options, onChange, className }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(option => option.value === value) || options[0]

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
          <selectedOption.icon className="h-4 w-4 mr-3 text-gray-400" />
          <span className="block truncate text-gray-900 font-medium">{selectedOption.label}</span>
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
              className="absolute right-0 z-20 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="py-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    className={clsx(
                      "w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors duration-150",
                      value === option.value && "text-blue-600 font-medium"
                    )}
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center">
                      <option.icon className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-gray-900">{option.label}</span>
                    </div>
                    {value === option.value && (
                      <Check className="h-4 w-4" style={{ color: THEME_COLORS.primary }} />
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
type CampaignStatus =
  | 'draft'
  | 'ready'
  | 'active'
  | 'running'
  | 'sending'
  | 'paused'
  | 'completed'
  | 'stopped'
  | 'sent'
  | 'scheduled'

interface Campaign {
  id: string
  name: string
  description?: string
  subject?: string
  status: CampaignStatus
  total_recipients: number
  opened: number
  clicked: number
  created_at: string
  // add other fields as needed
}

const CampaignCard = ({ 
  campaign, 
  onEdit, 
  onView, 
  onDuplicate, 
  onDelete, 
  onAction,
  actionLoading 
}: {
  campaign: Campaign
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
          color: 'text-white',
          bg: 'bg-gray-400',
          icon: <Clock className="h-3 w-3" />,
          label: 'Draft'
        }
      case 'ready':
        return {
          color: 'text-white',
          bg: THEME_COLORS.primary,
          icon: <Target className="h-3 w-3" />,
          label: 'Ready to Launch'
        }
      case 'sending':
      case 'active':
      case 'running':
        return {
          color: 'text-white',
          bg: THEME_COLORS.success,
          icon: <Activity className="h-3 w-3" />,
          label: status === 'running' ? 'Running' : 'Sending'
        }
      case 'paused':
        return {
          color: 'text-white',
          bg: THEME_COLORS.secondary,
          icon: <Pause className="h-3 w-3" />,
          label: 'Paused'
        }
      case 'completed':
        return {
          color: 'text-white',
          bg: THEME_COLORS.accent,
          icon: <CheckCircle className="h-3 w-3" />,
          label: 'Completed'
        }
      case 'stopped':
        return {
          color: 'text-white',
          bg: THEME_COLORS.warning,
          icon: <Square className="h-3 w-3" />,
          label: 'Stopped'
        }
      default:
        return {
          color: 'text-white',
          bg: 'bg-gray-400',
          icon: <Clock className="h-3 w-3" />,
          label: status
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
      className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105"
    >
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <span 
                className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium shadow-sm"
                style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
              >
                {statusConfig.icon}
                <span className="ml-1.5">{statusConfig.label}</span>
              </span>
            </div>
            <h3 
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:underline transition-colors truncate"
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
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => { onEdit(); setShowDropdown(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-3" />
                    Edit Campaign
                  </button>
                  <button
                    onClick={() => { onView(); setShowDropdown(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-3" /> 
                    View Details
                  </button>
                  <button
                    onClick={() => { onDuplicate(); setShowDropdown(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-3" />
                    Duplicate
                  </button>
                  
                  {['draft', 'ready', 'completed', 'stopped'].includes(campaign.status) && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => { onDelete(); setShowDropdown(false) }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center transition-colors"
                        style={{ color: THEME_COLORS.warning }}
                      >
                        <Trash2 className="h-4 w-4 mr-3" />
                        Delete Campaign
                      </button>
                    </>
                  )}
                  
                  {['sending', 'active', 'running', 'paused'].includes(campaign.status) && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 rounded-lg mx-2">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Stop campaign first to delete
                      </div>
                    </>
                  )}
                </div>
              </>
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
                className="inline-flex items-center px-3 py-1.5 text-white rounded-xl hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-all"
                style={{ backgroundColor: THEME_COLORS.success }}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                ) : (
                  <Play className="h-3 w-3 mr-1.5" />
                )}
                Launch
              </button>
            )}

            {(campaign.status === 'sending' || campaign.status === 'active' || campaign.status === 'running') && (
              <button
                onClick={() => onAction('pause')}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                style={{ 
                  borderColor: THEME_COLORS.secondary,
                  color: THEME_COLORS.secondary,
                  backgroundColor: 'white'
                }}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 mr-1.5" style={{ borderColor: THEME_COLORS.secondary }}></div>
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
                className="inline-flex items-center px-3 py-1.5 text-white rounded-xl hover:shadow-md disabled:opacity-50 text-xs font-medium transition-all"
                style={{ backgroundColor: THEME_COLORS.success }}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                ) : (
                  <RotateCcw className="h-3 w-3 mr-1.5" />
                )}
                Resume
              </button>
            )}

            {(campaign.status === 'sending' || campaign.status === 'active' || campaign.status === 'running' || campaign.status === 'paused') && (
              <button
                onClick={() => onAction('stop')}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-1.5 border rounded-xl hover:bg-red-50 disabled:opacity-50 text-xs font-medium transition-all"
                style={{ 
                  borderColor: THEME_COLORS.warning,
                  color: THEME_COLORS.warning,
                  backgroundColor: 'white'
                }}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 mr-1.5" style={{ borderColor: THEME_COLORS.warning }}></div>
                ) : (
                  <Square className="h-3 w-3 mr-1.5" />
                )}
                Stop
              </button>
            )}

            <button
              onClick={onView}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 hover:shadow-md text-xs font-medium transition-all"
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
  
  // Add email account check state
  const [emailAccounts, setEmailAccounts] = useState<any[]>([])
  const [showEmailAccountModal, setShowEmailAccountModal] = useState(false)
  const [loadingEmailAccounts, setLoadingEmailAccounts] = useState(true)

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

  // Fetch email accounts
  useEffect(() => {
    const fetchEmailAccounts = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/email-accounts')
        if (response.ok) {
          const data = await response.json()
          setEmailAccounts(data.accounts || [])
        }
      } catch (error) {
        console.error('Error fetching email accounts:', error)
      } finally {
        setLoadingEmailAccounts(false)
      }
    }

    fetchEmailAccounts()
  }, [user])

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

  // Get status badge for table view
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: THEME_COLORS.secondary, label: 'Draft' },
      ready: { color: THEME_COLORS.primary, label: 'Ready' },
      active: { color: THEME_COLORS.success, label: 'Active' },
      running: { color: THEME_COLORS.success, label: 'Running' },
      sending: { color: THEME_COLORS.success, label: 'Sending' },
      paused: { color: THEME_COLORS.secondary, label: 'Paused' },
      completed: { color: THEME_COLORS.accent, label: 'Completed' },
      stopped: { color: THEME_COLORS.warning, label: 'Stopped' }
    }[status] || { color: '#6b7280', label: status }

    return (
      <span 
        className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium text-white"
        style={{ backgroundColor: statusConfig.color }}
      >
        {statusConfig.label}
      </span>
    )
  }

  // Stats calculations
  const stats = [
    {
      label: 'Total Campaigns',
      value: allCampaigns.length,
      icon: Mail,
      color: THEME_COLORS.primary
    },
    {
      label: 'Active Campaigns',
      value: allCampaigns.filter(c => ['sending', 'active', 'running', 'scheduled'].includes(c.status)).length,
      icon: Activity,
      color: THEME_COLORS.success
    },
    {
      label: 'Total Recipients',
      value: allCampaigns.reduce((sum, c) => sum + c.total_recipients, 0),
      icon: Users,
      color: THEME_COLORS.secondary,
      format: 'number'
    },
    {
      label: 'Avg. Open Rate',
      value: allCampaigns.length > 0 
        ? (allCampaigns.reduce((sum, c) => sum + (c.total_recipients > 0 ? (c.opened / c.total_recipients) : 0), 0) / allCampaigns.length * 100)
        : 0,
      icon: Eye,
      color: THEME_COLORS.accent,
      format: 'percentage'
    }
  ]

  if (loading && allCampaigns.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-full mx-auto px-6 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: THEME_COLORS.primary }}></div>
          </div>
        </div>
      </div>
    )
  }

  // Handle create campaign click
  const handleCreateCampaign = () => {
    if (loadingEmailAccounts) return
    
    const activeAccounts = emailAccounts.filter(acc => 
      acc.status === 'active' || acc.status === 'warming_up'
    )
    
    if (activeAccounts.length === 0) {
      setShowEmailAccountModal(true)
      return
    }
    
    clearCreateCampaignState()
    router.push('/campaigns/create')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="space-y-8">
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
              <p className="mt-1 text-lg text-gray-600">
                Create and manage your email marketing campaigns
              </p>
            </div>
            <button
              onClick={handleCreateCampaign}
              disabled={loadingEmailAccounts}
              className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              style={{ backgroundColor: THEME_COLORS.primary }}
            >
              {loadingEmailAccounts ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Campaign
            </button>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-105"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: stat.color }}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">{stat.label}</h3>
                  <p className="text-3xl font-bold text-gray-900">{displayValue}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Filters and Controls */}
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 shadow-sm"
                      style={{ 
                        '--tw-ring-color': THEME_COLORS.primary
                      } as any}
                    />
                  </div>
                </div>
                
                <CustomSelect
                  value={statusFilter}
                  options={STATUS_OPTIONS}
                  onChange={setStatusFilter}
                  className="w-56"
                />
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={clsx(
                      'p-2 rounded-lg transition-colors',
                      viewMode === 'grid' 
                        ? 'bg-white text-white shadow-md' 
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                    style={viewMode === 'grid' ? { backgroundColor: THEME_COLORS.primary } : {}}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={clsx(
                      'p-2 rounded-lg transition-colors',
                      viewMode === 'table' 
                        ? 'bg-white text-white shadow-md' 
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                    style={viewMode === 'table' ? { backgroundColor: THEME_COLORS.primary } : {}}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                
                <span className="text-sm text-gray-500">
                  {filteredCampaigns.length} of {allCampaigns.length} campaigns
                </span>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          {filteredCampaigns.length === 0 && !loading ? (
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md"
                style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
              >
                <Mail className="h-8 w-8" style={{ color: THEME_COLORS.primary }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No campaigns found' : 'No campaigns yet'}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters to find the campaigns you\'re looking for.'
                  : 'Create your first email campaign to start engaging with your contacts and growing your business.'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleCreateCampaign}
                    disabled={loadingEmailAccounts}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    {loadingEmailAccounts ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Your First Campaign
                  </button>
                  <Link
                    href="/campaigns/templates"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Link>
                </div>
              )}
            </motion.div>
          ) : (
            /* Campaigns Grid/Table */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
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
                /* Table View */
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Campaign
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Recipients
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Open Rate
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Click Rate
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th scope="col" className="relative px-6 py-4">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCampaigns.map((campaign, index) => {
                          const openRate = campaign.total_recipients > 0 ? ((campaign.opened / campaign.total_recipients) * 100).toFixed(1) : '0'
                          const clickRate = campaign.total_recipients > 0 ? ((campaign.clicked / campaign.total_recipients) * 100).toFixed(1) : '0'

                          // Fix: Ensure campaign.status is typed as CampaignStatus
                          const campaignStatus = campaign.status as CampaignStatus;

                          return (
                            <motion.tr  
                              key={campaign.id} 
                              className="hover:bg-gray-50 transition-colors duration-200"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div 
                                    className="flex-shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center shadow-md"
                                    style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                                  >
                                    <Mail className="h-6 w-6" style={{ color: THEME_COLORS.primary }} />
                                  </div>
                                  <div className="ml-4">
                                    <div 
                                      className="text-sm font-semibold text-gray-900 cursor-pointer hover:underline"
                                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                                    >
                                      {campaign.name}
                                    </div>
                                    <div className="text-sm text-gray-600 truncate max-w-xs">
                                      {campaign.description || campaign.subject || 'No description'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(campaignStatus)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {campaign.total_recipients.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {openRate}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {clickRate}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(campaign.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  {(campaignStatus === 'draft' || campaignStatus === 'ready') && (
                                    <button
                                      onClick={() => handleCampaignAction(campaign.id, 'launch')} 
                                      disabled={actionLoading[campaign.id] || campaign.total_recipients === 0}
                                      className="inline-flex items-center px-3 py-1.5 text-white rounded-xl hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-all"
                                      style={{ backgroundColor: THEME_COLORS.success }}
                                    >
                                      {actionLoading[campaign.id] ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      ) : (
                                        <Play className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}

                                  {(['sending', 'active', 'running'].includes(campaignStatus)) && (
                                    <button
                                      onClick={() => handleCampaignAction(campaign.id, 'pause')}
                                      disabled={actionLoading[campaign.id]}
                                      className="inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                                      style={{ 
                                        borderColor: THEME_COLORS.secondary,
                                        color: THEME_COLORS.secondary,
                                        backgroundColor: 'white'
                                      }}
                                    >
                                      {actionLoading[campaign.id] ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2" style={{ borderColor: THEME_COLORS.secondary }}></div>
                                      ) : (
                                        <Pause className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}

                                  {campaignStatus === 'paused' && (
                                    <button
                                      onClick={() => handleCampaignAction(campaign.id, 'resume')}
                                      disabled={actionLoading[campaign.id]}
                                      className="inline-flex items-center px-3 py-1.5 text-white rounded-xl hover:shadow-md disabled:opacity-50 text-xs font-medium transition-all"
                                      style={{ backgroundColor: THEME_COLORS.success }}
                                    >
                                      {actionLoading[campaign.id] ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      ) : (
                                        <RotateCcw className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}

                                  {(['sending', 'active', 'running', 'paused'].includes(campaignStatus)) && (
                                    <button
                                      onClick={() => handleCampaignAction(campaign.id, 'stop')}
                                      disabled={actionLoading[campaign.id]}
                                      className="inline-flex items-center px-3 py-1.5 border rounded-xl hover:bg-red-50 disabled:opacity-50 text-xs font-medium transition-all"
                                      style={{ 
                                        borderColor: THEME_COLORS.warning,
                                        color: THEME_COLORS.warning,
                                        backgroundColor: 'white'
                                      }}
                                    >
                                      {actionLoading[campaign.id] ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2" style={{ borderColor: THEME_COLORS.warning }}></div>
                                      ) : (
                                        <Square className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 hover:shadow-md text-xs font-medium transition-all"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>

                                  <div className="relative">
                                    <button
                                      onClick={() => {
                                        // Toggle dropdown for this specific campaign
                                        const newActionLoading = { ...actionLoading }
                                        const key = `dropdown_${campaign.id}`
                                        newActionLoading[key] = !newActionLoading[key]
                                        setActionLoading(newActionLoading)
                                      }}
                                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                      <MoreVertical className="h-4 w-4 text-gray-500" />
                                    </button>
                                    
                                    {actionLoading[`dropdown_${campaign.id}`] && (
                                      <>
                                        <div 
                                          className="fixed inset-0 z-10" 
                                          onClick={() => {
                                            const newActionLoading = { ...actionLoading }
                                            delete newActionLoading[`dropdown_${campaign.id}`]
                                            setActionLoading(newActionLoading)
                                          }}
                                        />
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                                          <button
                                            onClick={() => {
                                              router.push(`/campaigns/${campaign.id}/edit`)
                                              const newActionLoading = { ...actionLoading }
                                              delete newActionLoading[`dropdown_${campaign.id}`]
                                              setActionLoading(newActionLoading)
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                                          >
                                            <Edit className="h-4 w-4 mr-3" />
                                            Edit Campaign
                                          </button>
                                          <button
                                            onClick={() => {
                                              handleDuplicateCampaign(campaign.id)
                                              const newActionLoading = { ...actionLoading }
                                              delete newActionLoading[`dropdown_${campaign.id}`]
                                              setActionLoading(newActionLoading)
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                                          >
                                            <Copy className="h-4 w-4 mr-3" />
                                            Duplicate
                                          </button>
                                          
                                          {['sending', 'active', 'running', 'paused'].includes(campaign.status) && (
                                            <>
                                              <div className="border-t border-gray-100 my-1"></div>
                                              <button
                                                onClick={() => {
                                                  handleCampaignAction(campaign.id, 'stop')
                                                  const newActionLoading = { ...actionLoading }
                                                  delete newActionLoading[`dropdown_${campaign.id}`]
                                                  setActionLoading(newActionLoading)
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center transition-colors"
                                                style={{ color: THEME_COLORS.warning }}
                                              >
                                                <Square className="h-4 w-4 mr-3" />
                                                Stop Campaign
                                              </button>
                                            </>
                                          )}
                                          
                                          {['draft', 'ready', 'completed', 'stopped'].includes(campaign.status) && (
                                            <>
                                              <div className="border-t border-gray-100 my-1"></div>
                                              <button
                                                onClick={() => {
                                                  setCampaignToDelete(campaign.id)
                                                  setShowDeleteModal(true)
                                                  const newActionLoading = { ...actionLoading }
                                                  delete newActionLoading[`dropdown_${campaign.id}`]
                                                  setActionLoading(newActionLoading)
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center transition-colors"
                                                style={{ color: THEME_COLORS.warning }}
                                              >
                                                <Trash2 className="h-4 w-4 mr-3" />
                                                Delete Campaign
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Email Account Required Modal */}
          <AnimatePresence>
            {showEmailAccountModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <motion.div 
                  className="relative p-8 border w-[480px] max-w-[90vw] shadow-xl rounded-2xl bg-white"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center">
                    <div 
                      className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl mb-6 shadow-md"
                      style={{ backgroundColor: `${THEME_COLORS.warning}20` }}
                    >
                      <Mail className="h-8 w-8" style={{ color: THEME_COLORS.warning }} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Email Account Required</h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      You need to connect a Gmail or Outlook account before creating campaigns. This ensures better deliverability and allows you to send from your own email address.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowEmailAccountModal(false)}
                        className="flex-1 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => router.push('/email-accounts')}
                        className="flex-1 px-6 py-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                        style={{ backgroundColor: THEME_COLORS.primary }}
                      >
                        Connect Email Account
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Delete Modal */}
          <AnimatePresence>
            {showDeleteModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <motion.div 
                  className="relative p-8 border w-96 shadow-xl rounded-2xl bg-white"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center">
                    <div 
                      className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl mb-4 shadow-md"
                      style={{ backgroundColor: `${THEME_COLORS.warning}20` }}
                    >
                      <Trash2 className="h-8 w-8" style={{ color: THEME_COLORS.warning }} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Campaign</h3>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete this campaign? All associated data will be permanently removed.
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        className="flex-1 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => campaignToDelete && handleDeleteCampaign(campaignToDelete)}
                        className="flex-1 px-6 py-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                        style={{ backgroundColor: THEME_COLORS.warning }}
                      >
                        Delete Campaign
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}