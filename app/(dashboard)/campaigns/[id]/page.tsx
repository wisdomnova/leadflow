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
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

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

// Campaign Controls Component
const CampaignControls = ({ 
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
      
      // Refresh campaign data
      onStatusChange()
      
    } catch (error) {
      console.error(`Failed to ${actionType} campaign:`, error)
      alert(error instanceof Error ? error.message : `Failed to ${actionType} campaign`)
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sending': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'stopped': return 'bg-red-100 text-red-800'
      // Legacy support
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'sent': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Calendar className="h-4 w-4" />
      case 'sending': return <TrendingUp className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'stopped': return <Square className="h-4 w-4" />
      // Legacy support
      case 'scheduled': return <Calendar className="h-4 w-4" />
      case 'sent': return <CheckCircle className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Campaign Status</h3>
          <div className="flex items-center mt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
              {getStatusIcon(campaign.status)}
              <span className="ml-2 capitalize">{campaign.status}</span>
            </span>
            {campaign.launched_at && (
              <span className="ml-4 text-sm text-gray-500">
                Launched {new Date(campaign.launched_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Users className="h-4 w-4 mr-1" />
            {contactCount} contacts
          </div>
          {['sending', 'scheduled'].includes(campaign.status) && (
            <div className="flex items-center text-sm text-green-600">
              <Clock className="h-4 w-4 mr-1" />
              Active
            </div>
          )}
        </div>
      </div>

      {/* Campaign Controls */}
      <div className="flex items-center space-x-3">
        {(campaign.status === 'draft') && (
          <button
            onClick={() => handleAction('launch')}
            disabled={loading || contactCount === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && action === 'launch' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {loading && action === 'launch' ? 'Launching...' : 'Launch Campaign'}
          </button>
        )}

        {(campaign.status === 'sending' || campaign.status === 'scheduled') && (
          <>
            <button
              onClick={() => handleAction('pause')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
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
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
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

        {(campaign.status === 'completed' || campaign.status === 'stopped' || campaign.status === 'sent') && (
          <div className="text-sm text-gray-500">
            Campaign {campaign.status}. No actions available.
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-1">💡 Campaign Controls</h4>
        <div className="text-xs text-blue-700 space-y-1">
          {(campaign.status === 'draft') && (
            <p><strong>Launch:</strong> Start sending emails to all contacts in this campaign</p>
          )}
          {(campaign.status === 'sending' || campaign.status === 'scheduled') && (
            <>
              <p><strong>Pause:</strong> Temporarily stop sending emails (can be resumed later)</p>
              <p><strong>Stop:</strong> Permanently stop the campaign (cannot be undone)</p>
            </>
          )}
          {campaign.status === 'paused' && (
            <>
              <p><strong>Resume:</strong> Continue sending emails from where you left off</p>
              <p><strong>Stop:</strong> Permanently stop the campaign (cannot be undone)</p>
            </>
          )}
        </div>
      </div>

      {contactCount === 0 && campaign.status === 'draft' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ Add contacts to this campaign before launching
          </p>
        </div>
      )}
    </div>
  )
}
 
// CSV Import Modal Component
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
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [mapping, setMapping] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    phone: ''
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      parseCSVPreview(selectedFile)
    } else {
      alert('Please select a valid CSV file')
    }
  }

  const parseCSVPreview = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const rows = lines.slice(1, 4).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || ''
          return obj
        }, {} as any)
      })
      
      setPreview(rows)
      
      // Auto-detect mappings
      const autoMapping = { ...mapping }
      headers.forEach(header => {
        const lower = header.toLowerCase()
        if (lower.includes('email') || lower === 'email') autoMapping.email = header
        if (lower.includes('first') || lower === 'firstname' || lower === 'first_name') autoMapping.first_name = header
        if (lower.includes('last') || lower === 'lastname' || lower === 'last_name') autoMapping.last_name = header
        if (lower.includes('company') || lower === 'company') autoMapping.company = header
        if (lower.includes('phone') || lower === 'phone') autoMapping.phone = header
      })
      setMapping(autoMapping)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!file || !mapping.email || !mapping.first_name || !mapping.last_name) {
      alert('Please select a file and map required fields (Email, First Name, Last Name)')
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mapping', JSON.stringify(mapping))

      const response = await fetch(`/api/campaigns/${campaignId}/contacts/import`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Successfully imported ${result.imported} contacts!${result.duplicates > 0 ? ` (${result.duplicates} duplicates skipped)` : ''}`)
        onImportComplete()
        onClose()
      } else {
        alert(result.error || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Import failed')
    } finally {
      setImporting(false)
    }
  }

  const headers = preview.length > 0 ? Object.keys(preview[0]) : []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Import Contacts from CSV</h3>
          
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h4>
              <p className="text-gray-500 mb-4">
                Choose a CSV file with your contact information
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                Select CSV File
              </label>
              
              <div className="mt-6 text-left max-w-md mx-auto">
                <h5 className="font-medium text-gray-900 mb-2">CSV Format Requirements:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Include headers in the first row</li>
                  <li>• Required fields: Email, First Name, Last Name</li>
                  <li>• Optional fields: Company, Phone</li>
                  <li>• Example: email,first_name,last_name,company,phone</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">
                    File loaded: {file.name} ({preview.length}+ contacts detected)
                  </span>
                </div>
              </div>

              {/* Field Mapping */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Map CSV Columns</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Column <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.email}
                      onChange={(e) => setMapping(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select column...</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name Column <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.first_name}
                      onChange={(e) => setMapping(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select column...</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name Column <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={mapping.last_name}
                      onChange={(e) => setMapping(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select column...</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Column
                    </label>
                    <select
                      value={mapping.company}
                      onChange={(e) => setMapping(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select column...</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Column
                    </label>
                    <select
                      value={mapping.phone}
                      onChange={(e) => setMapping(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select column...</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Preview (First 3 rows)</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">First Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.map((row, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{mapping.email ? row[mapping.email] : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{mapping.first_name ? row[mapping.first_name] : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{mapping.last_name ? row[mapping.last_name] : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{mapping.company ? row[mapping.company] : '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{mapping.phone ? row[mapping.phone] : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            {file && (
              <button
                onClick={handleImport}
                disabled={importing || !mapping.email || !mapping.first_name || !mapping.last_name}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Import Contacts'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  
  const { campaigns, fetchCampaigns, updateCampaign, loading } = useCampaignStore()
  const [campaign, setCampaign] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'performance'>('overview')
  
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
    if (activeTab === 'contacts' && campaignId) {
      fetchCampaignContacts()
    }
  }, [activeTab, campaignId])

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

  // Updated to refresh campaign data after status changes
  const handleCampaignStatusChange = async () => {
    await fetchCampaigns() // This will update the campaign in store
    // Also update local state
    if (campaigns.length > 0 && campaignId) {
      const foundCampaign = campaigns.find(c => c.id === campaignId)
      if (foundCampaign) {
        setCampaign(foundCampaign)
      }
    }
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
      case 'sending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <TrendingUp className="h-4 w-4 mr-1" />
            Sending
          </span>
        )
      case 'paused':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Pause className="h-4 w-4 mr-1" />
            Paused
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Completed
          </span>
        )
      case 'stopped':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <Square className="h-4 w-4 mr-1" />
            Stopped
          </span>
        )
      // Legacy support
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Calendar className="h-4 w-4 mr-1" />
            Scheduled
          </span>
        )
      case 'sent':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <Eye className="h-4 w-4 mr-1" />
            Sent
          </span>
        )
      default:
        return null
    }
  }

  const getContactStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        )
      case 'sent':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Send className="h-3 w-3 mr-1" />
            Sent
          </span>
        )
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </span>
        )
      case 'opened':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Eye className="h-3 w-3 mr-1" />
            Opened
          </span>
        )
      case 'clicked':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            <Target className="h-3 w-3 mr-1" />
            Clicked
          </span>
        )
      case 'bounced':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Bounced
          </span>
        )
      case 'unsubscribed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unsubscribed
          </span>
        )
      default:
        return null
    }
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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Eye },
    { id: 'contacts', name: 'Contacts', icon: Users, count: contacts.length },
    { id: 'performance', name: 'Performance', icon: Target }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => router.push('/campaigns')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              {getStatusBadge(campaign.status)}
            </div>
            <p className="text-gray-600 mt-1">
              {campaign.description || 'No description'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/campaigns/${campaign.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </div>
        </div>

        {/* Campaign Controls Component */}
        <CampaignControls 
          campaign={campaign}
          contactCount={contacts.length}
          onStatusChange={handleCampaignStatusChange}
        />

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recipients</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {contacts.length.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Delivered</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {contacts.filter(c => ['delivered', 'opened', 'clicked'].includes(c.status)).length.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Opens</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {contacts.filter(c => ['opened', 'clicked'].includes(c.status)).length.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Clicks</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {contacts.filter(c => c.status === 'clicked').length.toLocaleString()}
                </p>
              </div>
            </div>
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
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="text-center py-12">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Overview</h3>
              <p className="text-gray-500 mb-6">
                Overview details will be implemented here.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="p-6">
            {/* Contacts Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Campaign Contacts</h3>
                <p className="text-sm text-gray-500">
                  {contacts.length} total contacts
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </button>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="opened">Opened</option>
                  <option value="clicked">Clicked</option>
                  <option value="bounced">Bounced</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>
            </div>

            {/* Contacts Table */}
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
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </button>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contact.email}
                            </div>
                            {contact.phone && (
                              <div className="text-xs text-gray-400">
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.company || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getContactStatusBadge(contact.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(contact.added_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveContact(contact.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Remove contact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="p-6">
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Analytics</h3>
              <p className="text-gray-500 mb-6">
                Performance analytics will be implemented here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Contact</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="john@example.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newContact.first_name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="John"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newContact.last_name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={newContact.company}
                    onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Acme Corp"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowAddContactModal(false)}
                  className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContact}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Contact
                </button>
              </div>
            </div>
          </div>
        </div> 
      )}

      {/* CSV Import Modal */}
      <CSVImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        campaignId={campaignId}
        onImportComplete={fetchCampaignContacts}
      />
    </div>
  )
}