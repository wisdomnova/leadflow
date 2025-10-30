// ./components/campaigns/CampaignContactSelector.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  X, 
  Check, 
  AlertTriangle, 
  CheckCircle,
  User,
  Mail,
  Building,
  Phone,
  FileText,
  Download,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react'
import { useCampaignContactsStore } from '@/store/useCampaignContactsStore'

// Theme colors
const THEME_COLORS = {
  primary: '#0f66db',
  success: '#25b43d',
  warning: '#dc2626',
  secondary: '#6366f1'
}

interface CampaignContactSelectorProps {
  campaignId: string
  onClose?: () => void
  mode?: 'select' | 'manage'  // select for choosing contacts, manage for viewing/editing
}

interface TabInfo {
  id: 'existing' | 'manual' | 'csv'
  label: string
  icon: React.ElementType
  description: string
}

const tabs: TabInfo[] = [
  {
    id: 'existing',
    label: 'Select Existing',
    icon: Users,
    description: 'Choose from your existing contacts'
  },
  {
    id: 'manual',
    label: 'Add Manually',
    icon: Plus,
    description: 'Enter contact details manually'
  },
  {
    id: 'csv',
    label: 'Upload CSV',
    icon: Upload,
    description: 'Import contacts from a CSV file'
  }
]

export default function CampaignContactSelector({ 
  campaignId, 
  onClose, 
  mode = 'select' 
}: CampaignContactSelectorProps) {
  const [activeTab, setActiveTab] = useState<'existing' | 'manual' | 'csv'>('existing')
  const [showVariableInfo, setShowVariableInfo] = useState(false)
  
  const {
    // Data
    allContacts,
    campaignContacts,
    campaignVariables,
    selectedContacts,
    searchQuery,
    statusFilter,
    
    // Loading states
    loading,
    allContactsLoading,
    variablesLoading,
    
    // Actions
    fetchAllContacts,
    fetchCampaignContacts,
    analyzeCampaignVariables,
    addExistingContactsToCampaign,
    setSearchQuery,
    setStatusFilter,
    toggleContactSelection,
    clearSelection,
    validateContactForCampaign
  } = useCampaignContactsStore()

  useEffect(() => {
    if (campaignId) {
      fetchCampaignContacts(campaignId)
      fetchAllContacts()
      analyzeCampaignVariables(campaignId)
    }
  }, [campaignId])

  // Filter contacts based on search and status
  const filteredContacts = allContacts.filter(contact => {
    const matchesSearch = searchQuery === '' || 
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.first_name && contact.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.last_name && contact.last_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase()))
    
    // Check if already in campaign
    const alreadyInCampaign = campaignContacts.some(cc => 
      cc.contact_id === contact.id || cc.email === contact.email
    )
    
    const matchesFilter = statusFilter === 'all' || 
      (statusFilter === 'available' && !alreadyInCampaign) ||
      (statusFilter === 'in-campaign' && alreadyInCampaign)
    
    return matchesSearch && matchesFilter
  })

  const handleAddSelectedContacts = async () => {
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact')
      return
    }

    const result = await addExistingContactsToCampaign(campaignId, selectedContacts)
    
    if (result.success) {
      alert(`✅ Successfully added ${selectedContacts.length} contact(s) to the campaign!`)
      clearSelection()
      // Refresh data
      fetchCampaignContacts(campaignId)
    } else {
      alert(`❌ Failed to add contacts: ${result.error}`)
    }
  }

  // Check contact compatibility with campaign variables
  const getContactValidation = (contact: any) => {
    return validateContactForCampaign(contact, campaignVariables)
  }

  if (variablesLoading || allContactsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: THEME_COLORS.primary }}></div>
          <p className="text-gray-500">Loading campaign data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Campaign Contacts</h2>
            <p className="text-gray-600 mt-1">
              {mode === 'select' ? 'Add contacts to your campaign' : 'Manage campaign contacts'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Variable Info Toggle */}
            <button
              onClick={() => setShowVariableInfo(!showVariableInfo)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              {showVariableInfo ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showVariableInfo ? 'Hide' : 'Show'} Variables
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Campaign Variables Info */}
        <AnimatePresence>
          {showVariableInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Campaign Variables ({campaignVariables.length})
              </h4>
              {campaignVariables.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {campaignVariables.map(variable => (
                    <div key={variable.key} className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full mr-2 ${variable.found ? 'bg-green-500' : 'bg-orange-500'}`} />
                      <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono text-gray-900">
                        {`{{${variable.key}}}`}
                      </code>
                      {variable.sources.length > 0 && (
                        <span className="ml-1 text-xs text-gray-900">
                          ({variable.sources.join(', ')})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-700 text-sm">No template variables found in this campaign.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-6">
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'existing' && (
            <ExistingContactsTab
              contacts={filteredContacts}
              campaignContacts={campaignContacts}
              selectedContacts={selectedContacts}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              campaignVariables={campaignVariables}
              onSearchChange={setSearchQuery}
              onFilterChange={setStatusFilter}
              onToggleSelection={toggleContactSelection}
              onAddSelected={handleAddSelectedContacts}
              getContactValidation={getContactValidation}
            />
          )}
          
          {activeTab === 'manual' && (
            <ManualContactTab
              campaignId={campaignId}
              campaignVariables={campaignVariables}
              onSuccess={() => {
                fetchCampaignContacts(campaignId)
                setActiveTab('existing')
              }}
            />
          )}
          
          {activeTab === 'csv' && (
            <CSVImportTab
              campaignId={campaignId}
              campaignVariables={campaignVariables}
              onSuccess={() => {
                fetchCampaignContacts(campaignId)
                setActiveTab('existing')
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Existing Contacts Tab Component
function ExistingContactsTab({
  contacts,
  campaignContacts,
  selectedContacts,
  searchQuery,
  statusFilter,
  campaignVariables,
  onSearchChange,
  onFilterChange,
  onToggleSelection,
  onAddSelected,
  getContactValidation
}: any) {
  const statusOptions = [
    { value: 'all', label: 'All Contacts', count: contacts.length },
    { value: 'available', label: 'Available', count: contacts.filter((c: any) => !campaignContacts.some((cc: any) => cc.contact_id === c.id || cc.email === c.email)).length },
    { value: 'in-campaign', label: 'In Campaign', count: campaignContacts.length }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts by name, email, or company..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900"
              style={{ '--tw-ring-color': THEME_COLORS.primary } as any}
            />
          </div>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900"
          style={{ '--tw-ring-color': THEME_COLORS.primary } as any}
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.count})
            </option>
          ))}
        </select>
      </div>

      {/* Selection Summary */}
      {selectedContacts.length > 0 && (
        <div 
          className="flex items-center justify-between p-4 rounded-xl border"
          style={{ backgroundColor: `${THEME_COLORS.primary}15`, borderColor: `${THEME_COLORS.primary}30` }}
        >
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" style={{ color: THEME_COLORS.primary }} />
            <span className="font-medium text-gray-900">
              {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <button
            onClick={onAddSelected}
            className="px-6 py-2 rounded-xl text-white font-medium hover:shadow-lg transition-all"
            style={{ backgroundColor: THEME_COLORS.primary }}
          >
            Add to Campaign
          </button>
        </div>
      )}

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Import your first contacts to get started'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact: any) => {
            const isSelected = selectedContacts.includes(contact.id)
            const inCampaign = campaignContacts.some((cc: any) => 
              cc.contact_id === contact.id || cc.email === contact.email
            )
            const validation = getContactValidation(contact)
            
            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 border rounded-xl transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : inCampaign
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {!inCampaign && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(contact.id)}
                        className="mr-3 h-4 w-4 rounded border-gray-300"
                        style={{ accentColor: THEME_COLORS.primary }}
                      />
                    )}
                    
                    <div className="flex items-center flex-1">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
                        style={{ backgroundColor: `${THEME_COLORS.secondary}20` }}
                      >
                        <User className="h-5 w-5" style={{ color: THEME_COLORS.secondary }} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {contact.first_name && contact.last_name 
                              ? `${contact.first_name} ${contact.last_name}`
                              : contact.first_name || contact.last_name || 'Unnamed Contact'
                            }
                          </h4>
                          
                          {inCampaign && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                              In Campaign
                            </span>
                          )}
                          
                          {/* Validation Indicator */}
                          {!validation.isValid && (
                            <div title={`Missing: ${validation.missingFields.join(', ')}`}>
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </div>
                          )}
                          
                          {validation.isValid && validation.warnings.length === 0 && (
                            <div title="All required fields available">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mt-1 space-x-4">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-xs">{contact.email}</span>
                          </div>
                          
                          {contact.company && (
                            <div className="flex items-center">
                              <Building className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-xs">{contact.company}</span>
                            </div>
                          )}
                          
                          {contact.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Validation Details */}
                        {(!validation.isValid || validation.warnings.length > 0) && (
                          <div className="mt-2 space-y-1">
                            {validation.missingFields.length > 0 && (
                              <div className="text-xs text-orange-600">
                                Missing required: {validation.missingFields.join(', ')}
                              </div>
                            )}
                            {validation.warnings.length > 0 && (
                              <div className="text-xs text-yellow-600">
                                {validation.warnings[0]} {validation.warnings.length > 1 && `(+${validation.warnings.length - 1} more)`}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// Manual Contact Tab Component
function ManualContactTab({ campaignId, campaignVariables, onSuccess }: any) {
  const { addContactToCampaign } = useCampaignContactsStore()
  
  const [formData, setFormData] = useState<any>({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    phone: ''
  })
  const [saving, setSaving] = useState(false)
  
  // Add custom fields for campaign variables that don't match standard fields
  // from_name is handled specially as it can be derived from first_name + last_name
  const standardFields = ['email', 'first_name', 'last_name', 'company', 'phone', 'from_name', 'company_name', 'phone_number', 'email_address']
  const customVariables = campaignVariables.filter((v: any) => 
    !standardFields.includes(v.key.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const contactData = { ...formData }
      
      // Add custom variable fields
      customVariables.forEach((variable: any) => {
        if (formData[variable.key]) {
          if (!contactData.custom_fields) contactData.custom_fields = {}
          contactData.custom_fields[variable.key] = formData[variable.key]
        }
      })
      
      const result = await addContactToCampaign(campaignId, contactData)
      
      if (result.success) {
        alert('✅ Contact added successfully!')
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          company: '',
          phone: ''
        })
        // Clear custom fields
        customVariables.forEach((variable: any) => {
          setFormData((prev: any) => ({ ...prev, [variable.key]: '' }))
        })
        onSuccess()
      } else {
        alert(`❌ Failed to add contact: ${result.error}`)
      }
    } catch (error) {
      alert('❌ Failed to add contact')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Standard Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900"
              style={{ '--tw-ring-color': THEME_COLORS.primary } as any}
              placeholder="john@company.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name {campaignVariables.some((v: any) => v.key === 'first_name') && '*'}
            </label>
            <input
              type="text"
              required={campaignVariables.some((v: any) => v.key === 'first_name')}
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900"
              style={{ '--tw-ring-color': THEME_COLORS.primary } as any}
              placeholder="John"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name {campaignVariables.some((v: any) => v.key === 'last_name') && '*'}
            </label>
            <input
              type="text"
              required={campaignVariables.some((v: any) => v.key === 'last_name')}
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900"
              style={{ '--tw-ring-color': THEME_COLORS.primary } as any}
              placeholder="Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company {campaignVariables.some((v: any) => v.key === 'company') && '*'}
            </label>
            <input
              type="text"
              required={campaignVariables.some((v: any) => v.key === 'company')}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900"
              style={{ '--tw-ring-color': THEME_COLORS.primary } as any}
              placeholder="Acme Corp"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone {campaignVariables.some((v: any) => v.key === 'phone') && '*'}
            </label>
            <input
              type="tel"
              required={campaignVariables.some((v: any) => v.key === 'phone')}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900"
              style={{ '--tw-ring-color': THEME_COLORS.primary } as any}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          {/* Custom Variable Fields */}
          {customVariables.map((variable: any) => (
            <div key={variable.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {variable.key.charAt(0).toUpperCase() + variable.key.slice(1).replace(/_/g, ' ')} *
                <span className="text-xs text-gray-500 ml-1">
                  (Used in {variable.sources.join(', ')})
                </span>
              </label>
              <input
                type="text"
                required
                value={formData[variable.key] || ''}
                onChange={(e) => setFormData({ ...formData, [variable.key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900"
                style={{ '--tw-ring-color': THEME_COLORS.primary } as any}
                placeholder={`Enter ${variable.key.replace(/_/g, ' ')}`}
              />
            </div>
          ))}
        </div>
        
        {/* Helper info for variable equivalence */}
        {campaignVariables.some((v: any) => ['from_name', 'company_name', 'phone_number', 'email_address'].includes(v.key.toLowerCase())) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Smart Variable Matching</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              {campaignVariables.filter((v: any) => v.key.toLowerCase() === 'from_name').length > 0 && (
                <li>• <code className="bg-blue-100 px-1 rounded text-gray-900">{`{{from_name}}`}</code> will automatically use "First Name + Last Name"</li>
              )}
              {campaignVariables.filter((v: any) => v.key.toLowerCase() === 'company_name').length > 0 && (
                <li>• <code className="bg-blue-100 px-1 rounded text-gray-900">{`{{company_name}}`}</code> will use the "Company" field</li>
              )}
              {campaignVariables.filter((v: any) => v.key.toLowerCase() === 'phone_number').length > 0 && (
                <li>• <code className="bg-blue-100 px-1 rounded text-gray-900">{`{{phone_number}}`}</code> will use the "Phone" field</li>
              )}
              {campaignVariables.filter((v: any) => v.key.toLowerCase() === 'email_address').length > 0 && (
                <li>• <code className="bg-blue-100 px-1 rounded text-gray-900">{`{{email_address}}`}</code> will use the "Email" field</li>
              )}
            </ul>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-xl text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
            style={{ backgroundColor: THEME_COLORS.primary }}
          >
            {saving ? 'Adding...' : 'Add Contact'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// CSV Import Tab Component  
function CSVImportTab({ campaignId, campaignVariables, onSuccess }: any) {
  const {
    importFile,
    csvHeaders,
    csvData,
    importMapping,
    importOptions,
    importPreview,
    importing,
    processCSVFile,
    updateImportMapping,
    updateImportOptions,
    previewImport,
    executeImport
  } = useCampaignContactsStore()
  
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'import'>('upload')
  
  const handleFileSelect = async (file: File) => {
    const result = await processCSVFile(file)
    if (result.success) {
      setStep('map')
    } else {
      alert(`❌ Failed to process CSV: ${result.error}`)
    }
  }
  
  const handleMapping = async () => {
    const result = await previewImport()
    if (result.success) {
      setStep('preview')
    } else {
      alert(`❌ Failed to preview: ${result.error}`)
    }
  }
  
  const handleImport = async () => {
    setStep('import')
    const result = await executeImport(campaignId)
    
    if (result.success) {
      alert(`✅ Import completed! Imported: ${result.imported}, Updated: ${result.updated}`)
      onSuccess()
    } else {
      alert(`❌ Import failed: ${result.error}`)
      setStep('preview')
    }
  }

  if (step === 'upload') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="text-center space-y-6"
      >
        <div>
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
          <p className="text-gray-600">
            Upload a CSV file with your contacts. Make sure it includes an email column.
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </motion.div>
    )
  }

  if (step === 'map') {
    const availableFields = ['email', 'first_name', 'last_name', 'company', 'phone', ...campaignVariables.map((v: any) => v.key)]
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map CSV Columns</h3>
          <p className="text-gray-600">
            Map your CSV columns to contact fields. Email is required.
          </p>
        </div>
        
        <div className="grid gap-4">
          {csvHeaders.map(header => (
            <div key={header} className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  {header}
                </label>
                <div className="text-xs text-gray-500">
                  Sample: {csvData[0]?.[header] || 'N/A'}
                </div>
              </div>
              
              <div className="flex-1">
                <select
                  value={importMapping[header] || ''}
                  onChange={(e) => {
                    updateImportMapping({
                      ...importMapping,
                      [header]: e.target.value
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-gray-900"
                >
                  <option value="">Don't import</option>
                  {availableFields.map(field => (
                    <option key={field} value={field}>
                      {field.replace(/_/g, ' ').charAt(0).toUpperCase() + field.replace(/_/g, ' ').slice(1)}
                      {campaignVariables.some((v: any) => v.key === field) && ' *'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={() => setStep('upload')}
            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleMapping}
            disabled={!importMapping.email}
            className="px-6 py-2 rounded-xl text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: THEME_COLORS.primary }}
          >
            Preview Import
          </button>
        </div>
      </motion.div>
    )
  }

  if (step === 'preview') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Import Preview</h3>
          <p className="text-gray-600">
            Review the first 10 rows before importing {csvData.length} total contacts.
          </p>
        </div>
        
        {importPreview.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Validation</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {importPreview.map((contact, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm text-gray-500">{contact._rowNumber}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{contact.email}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">{contact.company || 'N/A'}</td>
                    <td className="px-3 py-2">
                      {contact._validation.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div title={`Missing: ${contact._validation.missingFields.join(', ')}`}>
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={() => setStep('map')}
            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Back to Mapping
          </button>
          <button
            onClick={handleImport}
            className="px-6 py-2 rounded-xl text-white font-medium"
            style={{ backgroundColor: THEME_COLORS.success }}
          >
            Import {csvData.length} Contacts
          </button>
        </div>
      </motion.div>
    )
  }

  if (step === 'import') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: THEME_COLORS.primary }}></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Contacts...</h3>
        <p className="text-gray-600">Please wait while we process your CSV file.</p>
      </motion.div>
    )
  }

  return null
}