// ./app/(dashboard)/campaigns/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation' 
import { useCampaignStore } from '@/store/useCampaignStore'
import { 
  ArrowLeft, 
  Edit, 
  Play, 
  Pause, 
  Users,  
  Mail, 
  Eye, 
  Clock,
  Calendar,
  Settings,
  Send,
  Target,
  Plus,
  Upload,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Download,
  Square,
  RotateCcw,
  TrendingUp,
  BarChart3,
  MousePointer,
  Zap,
  Copy,
  ExternalLink,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Contact {
  id: string
  email: string
  first_name: string
  last_name: string
  company?: string
  phone?: string
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed'
  added_at: string
  sent_at?: string
  opened_at?: string 
  clicked_at?: string
}

// Campaign Status Card Component
const CampaignStatusCard = ({ 
  campaign, 
  contactCount, 
  onStatusChange 
}: { 
  campaign: any
  contactCount: number
  onStatusChange: () => void
}) => {
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<string | null>(null)

  const handleAction = async (actionType: 'launch' | 'pause' | 'resume' | 'stop') => {
    if (loading) return
    
    setLoading(true)
    setAction(actionType)
    
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/${actionType}`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${actionType} campaign`)
      }
      
      const result = await response.json()
      
      // Show success message
      if (actionType === 'launch') {
        alert(`🚀 Campaign launched! ${result.contactsScheduled || contactCount} contacts scheduled for sending.`)
      } else if (actionType === 'pause') {
        alert('⏸️ Campaign paused. Email sending has been stopped.')
      } else if (actionType === 'resume') {
        alert('▶️ Campaign resumed. Email sending will continue.')
      } else if (actionType === 'stop') {
        alert('🛑 Campaign stopped permanently.')
      }
      
      onStatusChange()
      
    } catch (error) {
      console.error(`Failed to ${actionType} campaign:`, error)
      alert(error instanceof Error ? error.message : `Failed to ${actionType} campaign`)
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Calendar className="h-4 w-4" />,
          label: 'Draft',
          description: 'Campaign is being prepared'
        }
      case 'ready':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Target className="h-4 w-4" />,
          label: 'Ready to Launch',
          description: 'Campaign is ready to be launched'
        }
      case 'sending':
      case 'active': // Add this line
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Activity className="h-4 w-4" />,
          label: 'Sending',
          description: 'Emails are being sent'
        }
      case 'paused':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Pause className="h-4 w-4" />,
          label: 'Paused',
          description: 'Campaign is temporarily stopped'
        }
      case 'completed':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Completed',
          description: 'All emails have been sent'
        }
      case 'stopped':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <Square className="h-4 w-4" />,
          label: 'Stopped',
          description: 'Campaign was stopped'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Calendar className="h-4 w-4" />,
          label: status,
          description: 'Campaign status'
        }
    }
  }

  const statusConfig = getStatusConfig(campaign.status)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${statusConfig.color}`}>
              {statusConfig.icon}
              <span className="ml-2">{statusConfig.label}</span>
            </span>
            {campaign.launched_at && (
              <span className="text-sm text-gray-500">
                Launched {new Date(campaign.launched_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">{statusConfig.description}</p>
          
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            <span className="font-medium">{contactCount}</span>
            <span className="ml-1">{contactCount === 1 ? 'contact' : 'contacts'}</span>
            {['sending', 'active', 'scheduled'].includes(campaign.status) && (
              <>
                <div className="mx-3 w-1 h-1 bg-gray-400 rounded-full"></div>
                <Activity className="h-4 w-4 mr-1 text-green-500" />
                <span className="text-green-600 font-medium">Active</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {(campaign.status === 'draft' || campaign.status === 'ready') && (
          <button
            onClick={() => handleAction('launch')}
            disabled={loading || contactCount === 0} 
            className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading && action === 'launch' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {loading && action === 'launch' ? 'Launching...' : 'Launch Campaign'}
          </button>
        )}

        {(campaign.status === 'sending' || campaign.status === 'active' || campaign.status === 'scheduled') && (
          <>
            <button
              onClick={() => handleAction('pause')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
            >
              {loading && action === 'pause' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              {loading && action === 'pause' ? 'Pausing...' : 'Pause'}
            </button>
            
            <button
              onClick={() => {
                if (confirm('Are you sure you want to stop this campaign? This cannot be undone.')) {
                  handleAction('stop')
                }
              }}
              disabled={loading}
              className="inline-flex items-center px-4 py-2.5 border border-red-300 text-red-700 bg-white rounded-xl hover:bg-red-50 disabled:opacity-50 font-medium transition-colors"
            >
              {loading && action === 'stop' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              {loading && action === 'stop' ? 'Stopping...' : 'Stop'}
            </button>
          </>
        )}

        {campaign.status === 'paused' && (
          <>
            <button
              onClick={() => handleAction('resume')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
            >
              {loading && action === 'resume' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              {loading && action === 'resume' ? 'Resuming...' : 'Resume'}
            </button>
            
            <button
              onClick={() => {
                if (confirm('Are you sure you want to stop this campaign? This cannot be undone.')) {
                  handleAction('stop')
                }
              }}
              disabled={loading}
              className="inline-flex items-center px-4 py-2.5 border border-red-300 text-red-700 bg-white rounded-xl hover:bg-red-50 disabled:opacity-50 font-medium transition-colors"
            >
              {loading && action === 'stop' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              {loading && action === 'stop' ? 'Stopping...' : 'Stop'}
            </button>
          </>
        )}

        {(campaign.status === 'completed' || campaign.status === 'stopped') && (
          <div className="text-sm text-gray-500 py-2">
            Campaign {campaign.status === 'completed' ? 'completed' : 'stopped'}
          </div>
        )}
      </div>

      {/* Update the warning message to also handle 'ready' status */}
      {contactCount === 0 && (campaign.status === 'draft' || campaign.status === 'ready') && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              Add contacts to launch this campaign
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Performance Stats Component
const PerformanceStats = ({ contacts }: { contacts: Contact[] }) => {
  // Calculate stats based on actual contact statuses (now driven by email_events)
  const totalContacts = contacts.length
  const deliveredCount = contacts.filter(c => ['delivered', 'opened', 'clicked'].includes(c.status)).length
  const openedCount = contacts.filter(c => ['opened', 'clicked'].includes(c.status)).length
  const clickedCount = contacts.filter(c => c.status === 'clicked').length
  const bouncedCount = contacts.filter(c => c.status === 'bounced').length

  const stats = [
    {
      label: 'Total Contacts',
      value: totalContacts,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Delivered',
      value: deliveredCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      percentage: totalContacts > 0 ? Math.round((deliveredCount / totalContacts) * 100) : 0
    },
    {
      label: 'Opened',
      value: openedCount,
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      percentage: deliveredCount > 0 ? Math.round((openedCount / deliveredCount) * 100) : 0 // Open rate based on delivered
    },
    {
      label: 'Clicked',
      value: clickedCount,
      icon: MousePointer,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      percentage: openedCount > 0 ? Math.round((clickedCount / openedCount) * 100) : 0 // Click rate based on opened
    },
    {
      label: 'Bounced',
      value: bouncedCount,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      percentage: totalContacts > 0 ? Math.round((bouncedCount / totalContacts) * 100) : 0
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div 
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              {stat.percentage !== undefined && (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {stat.percentage}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {stat.label}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// CSV Import Modal remains the same as before
const CSVImportModal = ({ 
  isOpen, 
  onClose, 
  campaignId,
  onImportComplete 
}: { 
  isOpen: boolean
  onClose: () => void
  campaignId: string
  onImportComplete: () => void
}) => {
  // ... same implementation as before
  return null // placeholder
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  
  const { campaigns, fetchCampaigns, loading } = useCampaignStore()
  const [campaign, setCampaign] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'contacts' | 'performance'>('contacts')
  
  // Contact management state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddContactModal, setShowAddContactModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [newContact, setNewContact] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    phone: ''
  })

  useEffect(() => {
    if (campaigns.length === 0) {
      fetchCampaigns()
    }
  }, [campaigns.length, fetchCampaigns])

  useEffect(() => {
    if (campaigns.length > 0 && campaignId) {
      const foundCampaign = campaigns.find(c => c.id === campaignId)
      if (foundCampaign) {
        setCampaign(foundCampaign)
      }
    }
  }, [campaigns, campaignId])

  useEffect(() => {
    if (campaignId) {
      fetchCampaignContacts()
    }
  }, [campaignId])

  const fetchCampaignContacts = async () => {
    setContactsLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setContactsLoading(false)
    }
  }

  const handleAddContact = async () => {
    if (!newContact.email || !newContact.first_name || !newContact.last_name) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      })

      if (response.ok) {
        await fetchCampaignContacts()
        setShowAddContactModal(false)
        setNewContact({ email: '', first_name: '', last_name: '', company: '', phone: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add contact')
      }
    } catch (error) {
      console.error('Failed to add contact:', error)
      alert('Failed to add contact')
    }
  }

  const handleRemoveContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to remove this contact from the campaign?')) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts/${contactId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCampaignContacts()
      } else {
        alert('Failed to remove contact')
      }
    } catch (error) {
      console.error('Failed to remove contact:', error)
      alert('Failed to remove contact')
    }
  }

  const handleCampaignStatusChange = async () => {
    await fetchCampaigns()
    if (campaigns.length > 0 && campaignId) {
      const foundCampaign = campaigns.find(c => c.id === campaignId)
      if (foundCampaign) {
        setCampaign(foundCampaign)
      }
    }
  }

  const getContactStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Pending' },
      sent: { color: 'bg-blue-100 text-blue-800', icon: Send, label: 'Sent' },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
      opened: { color: 'bg-purple-100 text-purple-800', icon: Eye, label: 'Opened' },
      clicked: { color: 'bg-orange-100 text-orange-800', icon: MousePointer, label: 'Clicked' },
      bounced: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Bounced' },
      unsubscribed: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Unsubscribed' }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchQuery === '' || 
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading || !campaign) {
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/campaigns')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                <p className="text-gray-600 mt-1">
                  {campaign.description || 'No description provided'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Campaign link copied to clipboard!')
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </button>
              <Link
                href={`/campaigns/${campaign.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Campaign
              </Link>
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Reports
              </button>
            </div>
          </div>

          {/* Performance Stats */}
          <PerformanceStats contacts={contacts} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Campaign Status */}
          <div className="lg:col-span-1">
            <CampaignStatusCard 
              campaign={campaign}
              contactCount={contacts.length}
              onStatusChange={handleCampaignStatusChange}
            />
          </div>

          {/* Right Column - Contacts & Performance */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-200 bg-gray-50">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'contacts', name: 'Contacts', icon: Users, count: contacts.length },
                    { id: 'performance', name: 'Performance', icon: BarChart3 }
                  ].map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {tab.name}
                        {tab.count !== undefined && (
                          <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-medium">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'contacts' && (
                  <div className="space-y-6">
                    {/* Contacts Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Campaign Contacts</h3>
                        <p className="text-sm text-gray-600">
                          {contacts.length} total contacts in this campaign
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowImportModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import CSV
                        </button>
                        <button
                          onClick={() => setShowAddContactModal(true)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Contact
                        </button>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                          />
                        </div>
                      </div>
                      
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 min-w-[140px]"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="sent">Sent</option>
                        <option value="delivered">Delivered</option>
                        <option value="opened">Opened</option>
                        <option value="clicked">Clicked</option>
                        <option value="bounced">Bounced</option>
                        <option value="unsubscribed">Unsubscribed</option>
                      </select>
                    </div>

                    {/* Contacts List */}
                    {contactsLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading contacts...</p>
                      </div>
                    ) : filteredContacts.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {contacts.length === 0 ? 'No contacts added yet' : 'No contacts found'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                          {contacts.length === 0 
                            ? 'Add contacts to this campaign to start sending emails.'
                            : 'Try adjusting your search or filters.'
                          }
                        </p>
                        {contacts.length === 0 && (
                          <div className="flex justify-center space-x-3">
                            <button
                              onClick={() => setShowAddContactModal(true)}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Contact
                            </button>
                            <button
                              onClick={() => setShowImportModal(true)}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Import CSV
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredContacts.map((contact) => (
                          <motion.div
                            key={contact.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {contact.first_name} {contact.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{contact.email}</div>
                                {contact.company && (
                                  <div className="text-xs text-gray-400">{contact.company}</div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              {getContactStatusBadge(contact.status)}
                              <button
                                onClick={() => handleRemoveContact(contact.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                title="Remove contact"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Analytics</h3>
                    <p className="text-gray-500">
                      Detailed performance analytics coming soon.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Contact Modal - Implementation needed */}
      {/* CSV Import Modal - Implementation needed */}
    </div>
  )
}