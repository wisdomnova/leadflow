// ./app/(dashboard)/campaigns/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCampaignStore } from '@/store/useCampaignStore'
import SequenceBuilder from '@/components/campaigns/SequenceBuilder'
import ContactSelector from '@/components/campaigns/ContactSelector'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Settings, 
  Clock, 
  Calendar, 
  Send, 
  CheckCircle, 
  Pause, 
  Play,
  RotateCcw,
  Mail,
  Users,
  Target,
  Activity,
  Square,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

export default function EditCampaignPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  
  const { campaigns, fetchCampaigns, updateCampaign, loading } = useCampaignStore()
  const [campaign, setCampaign] = useState<any>(null)
  const [activeStep, setActiveStep] = useState<'settings' | 'sequence' | 'contacts'>('settings')
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '', 
    type: 'sequence' as 'sequence' | 'single',
    from_name: '',
    from_email: ''
  })
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const handleCampaignAction = async (action: 'launch' | 'pause' | 'resume' | 'stop') => {
    if (actionLoading) return

    setActionLoading(true)
    
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
      
      // Refresh campaign data to show updated status
      await fetchCampaigns()
      const updatedCampaign = campaigns.find(c => c.id === campaignId)
      if (updatedCampaign) {
        setCampaign(updatedCampaign)
      }
      
    } catch (error) {
      console.error(`Failed to ${action} campaign:`, error)
      alert(error instanceof Error ? error.message : `Failed to ${action} campaign`)
    } finally {
      setActionLoading(false)
    }
  }

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
      
      setCampaign((prev: any) => ({
        ...prev,
        ...campaignData
      }))
      
      alert('✅ Campaign settings saved successfully!')
    } catch (error) {
      console.error('Failed to update campaign:', error)
      alert('❌ Failed to save campaign settings')
    } finally {
      setSaving(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="h-4 w-4" />,
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
      case 'running':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Activity className="h-4 w-4" />,
          label: status === 'running' ? 'Running' : 'Sending',
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
          icon: <Clock className="h-4 w-4" />,
          label: status,
          description: 'Campaign status'
        }
    }
  }

  if (loading || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(campaign.status)
  const canEditCampaign = ['draft', 'ready'].includes(campaign.status)

  const steps = [
    { 
      id: 'settings', 
      name: 'Campaign Settings', 
      description: 'Basic information',
      icon: Settings,
      color: 'blue'
    },
    { 
      id: 'sequence', 
      name: 'Email Sequence', 
      description: 'Create your emails',
      icon: Mail,
      color: 'purple'
    },
    { 
      id: 'contacts', 
      name: 'Contacts', 
      description: 'Manage recipients',
      icon: Users,
      color: 'green'
    }
  ]

  const getStepStatus = (stepId: string) => {
    if (stepId === activeStep) return 'current'
    return 'available'
  }

  const getStepColor = (stepId: string) => {
    const status = getStepStatus(stepId)
    if (status === 'current') return 'bg-blue-600 border-blue-600'
    return 'bg-gray-100 border-gray-300 hover:bg-gray-200'
  }

  const getStepTextColor = (stepId: string) => {
    const status = getStepStatus(stepId)
    if (status === 'current') return 'text-white'
    return 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push(`/campaigns/${campaignId}`)}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaign
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/campaigns/${campaignId}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Campaign
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Edit Campaign
              </h1>
              <p className="text-xl text-gray-600">
                {campaign.name}
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-3 mb-3">
                {/* Campaign Control Buttons */}
                {(campaign.status === 'draft' || campaign.status === 'ready') && (
                  <button
                    onClick={() => handleCampaignAction('launch')}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 text-white rounded-xl hover:shadow-md disabled:opacity-50 text-sm font-medium transition-all"
                    style={{ backgroundColor: '#25b43d' }}
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Launch Campaign
                  </button>
                )}

                {(campaign.status === 'sending' || campaign.status === 'active' || campaign.status === 'running') && (
                  <button
                    onClick={() => handleCampaignAction('pause')}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                    style={{ 
                      borderColor: '#6366f1',
                      color: '#6366f1',
                      backgroundColor: 'white'
                    }}
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: '#6366f1' }}></div>
                    ) : (
                      <Pause className="h-4 w-4 mr-2" />
                    )}
                    Pause
                  </button>
                )}

                {campaign.status === 'paused' && (
                  <button
                    onClick={() => handleCampaignAction('resume')}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 text-white rounded-xl hover:shadow-md disabled:opacity-50 text-sm font-medium transition-all"
                    style={{ backgroundColor: '#25b43d' }}
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Resume
                  </button>
                )}

                {(campaign.status === 'sending' || campaign.status === 'active' || campaign.status === 'running' || campaign.status === 'paused') && (
                  <button
                    onClick={() => handleCampaignAction('stop')}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 border rounded-xl hover:bg-red-50 disabled:opacity-50 text-sm font-medium transition-all"
                    style={{ 
                      borderColor: '#dc2626',
                      color: '#dc2626',
                      backgroundColor: 'white'
                    }}
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: '#dc2626' }}></div>
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    Stop
                  </button>
                )}
              </div>

              <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium border ${statusConfig.color}`}>
                {statusConfig.icon}
                <span className="ml-2">{statusConfig.label}</span>
              </span>
              <p className="text-sm text-gray-600 mt-2">{statusConfig.description}</p>
            </div>
          </div>

          {/* Warning for active campaigns */}
          {!canEditCampaign && (
            <motion.div 
              className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-yellow-800 font-medium">Limited Editing Available</p>
                  <p className="text-yellow-700 text-sm mt-1">
                    This campaign is {campaign.status}. Some settings cannot be modified while the campaign is active.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Navigation Steps */}
        <motion.div 
          className="mb-12"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div 
                key={step.id} 
                className="flex items-center"
                variants={staggerItem}
              >
                <div className="flex items-center">
                  <button
                    onClick={() => setActiveStep(step.id as any)}
                    className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-300 ${getStepColor(step.id)} cursor-pointer hover:scale-105 hover:shadow-lg ${activeStep === step.id ? 'shadow-xl shadow-blue-200' : ''}`}
                  >
                    <step.icon className={`w-8 h-8 ${getStepTextColor(step.id)}`} />
                    
                    {activeStep === step.id && (
                      <div className="absolute inset-0 rounded-2xl bg-blue-600 animate-ping opacity-20"></div>
                    )}
                  </button>
                  
                  <div className="ml-4">
                    <div className={`font-semibold transition-colors ${
                      activeStep === step.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                    <div className="text-sm text-gray-500">{step.description}</div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-8">
                    <div className="h-1 rounded-full bg-gray-200"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeStep === 'settings' && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-12">
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Settings</h2>
                  <p className="text-gray-600 mb-8">Update your campaign's basic information and sender details.</p>
                  
                  <div className="space-y-8">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Campaign Name
                          </label>
                          <input
                            type="text"
                            value={campaignData.name}
                            onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                            disabled={!canEditCampaign}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
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
                            disabled={!canEditCampaign}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                            placeholder="Describe your campaign"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sender Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sender Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                          <input
                            type="text"
                            value={campaignData.from_name}
                            onChange={(e) => setCampaignData(prev => ({ ...prev, from_name: e.target.value }))}
                            disabled={!canEditCampaign}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                          <input
                            type="email"
                            value={campaignData.from_email}
                            onChange={(e) => setCampaignData(prev => ({ ...prev, from_email: e.target.value }))}
                            disabled={!canEditCampaign}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                            placeholder="john@company.com"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        This information will appear in the "From" field of your emails
                      </p>
                    </div>

                    {/* Campaign Type */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Type</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div 
                          className={`p-6 border-2 rounded-2xl transition-all ${
                            campaignData.type === 'sequence' 
                              ? 'border-blue-600 bg-blue-50' 
                              : 'border-gray-200'
                          } ${canEditCampaign ? 'cursor-pointer hover:border-gray-300' : 'opacity-50'}`}
                          onClick={() => canEditCampaign && setCampaignData(prev => ({ ...prev, type: 'sequence' }))}
                          whileHover={canEditCampaign ? { scale: 1.02 } : {}}
                          whileTap={canEditCampaign ? { scale: 0.98 } : {}}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="campaignType"
                              value="sequence"
                              checked={campaignData.type === 'sequence'}
                              onChange={() => setCampaignData(prev => ({ ...prev, type: 'sequence' }))}
                              disabled={!canEditCampaign}
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">Email Sequence</div>
                              <div className="text-xs text-gray-500">Multiple emails with delays</div>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div 
                          className={`p-6 border-2 rounded-2xl transition-all ${
                            campaignData.type === 'single' 
                              ? 'border-blue-600 bg-blue-50' 
                              : 'border-gray-200'
                          } ${canEditCampaign ? 'cursor-pointer hover:border-gray-300' : 'opacity-50'}`}
                          onClick={() => canEditCampaign && setCampaignData(prev => ({ ...prev, type: 'single' }))}
                          whileHover={canEditCampaign ? { scale: 1.02 } : {}}
                          whileTap={canEditCampaign ? { scale: 0.98 } : {}}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="campaignType"
                              value="single"
                              checked={campaignData.type === 'single'}
                              onChange={() => setCampaignData(prev => ({ ...prev, type: 'single' }))}
                              disabled={!canEditCampaign}
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">Single Email</div>
                              <div className="text-xs text-gray-500">One email sent immediately</div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Campaign Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
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
                        <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
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
                    {canEditCampaign && (
                      <div className="pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Changes will be saved and applied to your campaign
                          </div>
                          <button
                            onClick={handleSaveCampaignDetails}
                            disabled={saving}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'sequence' && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-12">
                <SequenceBuilder 
                  campaignId={campaignId}
                  onSave={() => {
                    alert('✅ Email sequence saved successfully!')
                  }}
                  readOnly={!canEditCampaign}
                />
              </div>
            </div>
          )}

          {activeStep === 'contacts' && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-12">
                <ContactSelector
                  campaignId={campaignId}
                  onContactsSelected={(contactIds) => {
                    console.log('Contacts selected:', contactIds)
                  }}
                  selectedContactIds={[]}
                  readOnly={!canEditCampaign}
                  onSaveAsDraft={async () => {
                    if (canEditCampaign) {
                      alert('✅ Contacts saved successfully!')
                    }
                  }}
                  onNavigateToContacts={() => {
                    router.push('/contacts')
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}