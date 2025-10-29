// ./app/(dashboard)/campaigns/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCampaignStore } from '@/store/useCampaignStore'
import SequenceBuilder from '@/components/campaigns/SequenceBuilder'
import CampaignTemplates from '@/components/campaigns/CampaignTemplates'
import ContactSelector from '@/components/campaigns/ContactSelector'
import { ArrowLeft, ArrowRight, Save, Mail, Settings, CheckCircle, Users, RotateCcw, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { 
  extractVariablesFromTemplate, 
  checkVariableAvailability, 
  getContactFieldMapping,
  type TemplateVariable 
} from '@/lib/template-variable-extractor'
import MissingVariablesForm from '@/components/campaigns/MissingVariablesForm'
import { useAuthStore } from '@/store/useAuthStore'

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

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

export default function CreateCampaignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createCampaign, isLoading } = useCampaignStore()
  const { user } = useAuthStore()
  
  // Add email account check state
  const [emailAccounts, setEmailAccounts] = useState<any[]>([])
  const [showEmailAccountModal, setShowEmailAccountModal] = useState(false)
  const [loadingEmailAccounts, setLoadingEmailAccounts] = useState(true)
  
  // Initialize state from URL params or localStorage
  const [currentStep, setCurrentStep] = useState(() => {
    // Check URL params first
    const urlStep = searchParams.get('step')
    if (urlStep) return parseInt(urlStep)
    
    // Then check localStorage
    const savedStep = localStorage.getItem('createCampaign_currentStep')
    return savedStep ? parseInt(savedStep) : 1
  })

  const [campaignData, setCampaignData] = useState(() => {
    const saved = localStorage.getItem('createCampaign_data')
    return saved ? JSON.parse(saved) : {
      name: '',
      description: '',
      type: 'sequence' as 'sequence' | 'single',
      from_name: '',
      from_email: ''
    }
  })

  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(() => {
    return localStorage.getItem('createCampaign_id') || null
  })

  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(() => {
    const saved = localStorage.getItem('createCampaign_template')
    return saved ? JSON.parse(saved) : null
  })
  const [showForm, setShowForm] = useState(() => {
    const saved = localStorage.getItem('createCampaign_showForm')
    return saved ? JSON.parse(saved) : false
  })

  // Add template variables state
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([])
  const [missingVariableValues, setMissingVariableValues] = useState<Record<string, string>>({})

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('createCampaign_currentStep', currentStep.toString())
  }, [currentStep])

  useEffect(() => {
    localStorage.setItem('createCampaign_data', JSON.stringify(campaignData))
  }, [campaignData])

  useEffect(() => {
    if (createdCampaignId) {
      localStorage.setItem('createCampaign_id', createdCampaignId)
    }
  }, [createdCampaignId])

  useEffect(() => {
    if (selectedTemplate) {
      localStorage.setItem('createCampaign_template', JSON.stringify(selectedTemplate))
    } else {
      localStorage.removeItem('createCampaign_template')
    }
  }, [selectedTemplate])

  useEffect(() => {
    localStorage.setItem('createCampaign_showForm', JSON.stringify(showForm))
  }, [showForm])

  // Update URL when step changes
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('step', currentStep.toString())
    if (createdCampaignId) {
      url.searchParams.set('campaignId', createdCampaignId)
    }
    window.history.replaceState({}, '', url.toString())
  }, [currentStep, createdCampaignId])

  // Check if we have a campaign ID in URL params on mount
  useEffect(() => {
    const urlCampaignId = searchParams.get('campaignId')
    if (urlCampaignId && !createdCampaignId) {
      setCreatedCampaignId(urlCampaignId)
    }
  }, [searchParams, createdCampaignId])

  // Clear localStorage when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only clear if user is actually leaving the site, not just refreshing
      if (performance.navigation?.type === 1) { // TYPE_RELOAD
        return
      }
      // Save state when navigating away
      localStorage.setItem('createCampaign_lastActive', Date.now().toString())
    }

    // Set up cleanup on page visibility change (when user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Save current state when tab becomes hidden
        localStorage.setItem('createCampaign_lastActive', Date.now().toString())
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Verify campaign still exists if we have an ID in localStorage
  useEffect(() => {
    const verifyCampaignExists = async () => {
      const savedCampaignId = localStorage.getItem('createCampaign_id')
      if (savedCampaignId && !createdCampaignId) {
        try {
          const response = await fetch(`/api/campaigns/${savedCampaignId}`)
          if (!response.ok) {
            // Campaign doesn't exist, clear localStorage
            console.log('Saved campaign no longer exists, clearing localStorage')
            clearSavedState()
            setCurrentStep(1)
            setCreatedCampaignId(null)
          } else {
            // Campaign exists, use it
            setCreatedCampaignId(savedCampaignId)
          }
        } catch (error) {
          // Error fetching campaign, clear localStorage
          console.log('Error verifying campaign, clearing localStorage')
          clearSavedState()
          setCurrentStep(1)
          setCreatedCampaignId(null)
        }
      }
    }

    verifyCampaignExists()
  }, [createdCampaignId])

  // Helper function to create template steps
  const createTemplateSteps = async (campaignId: string, steps: any[]) => {
    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        
        // Replace missing variables with static values
        let processedSubject = step.subject
        let processedContent = step.content
        
        Object.entries(missingVariableValues).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
          processedSubject = processedSubject.replace(regex, value)
          processedContent = processedContent.replace(regex, value)
        })
        
        await fetch(`/api/campaigns/${campaignId}/steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'email',
            subject: processedSubject,
            content: processedContent,
            delay_days: step.delay_days || 0,
            delay_hours: step.delay_hours || 0,
            order_index: i
          })
        })
      }
    } catch (error) {
      console.error('Failed to create template steps:', error)
    }
  }

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      console.log('Submitting campaign data:', campaignData)
      
      const campaign = await createCampaign({
        name: campaignData.name,
        description: campaignData.description,
        type: campaignData.type,
        from_name: campaignData.from_name,
        from_email: campaignData.from_email,
        status: 'draft'
      })
      
      console.log('Campaign created successfully:', campaign)
      setCreatedCampaignId(campaign.id)
      
      // If using a template, create the email steps automatically
      if (selectedTemplate) {
        await createTemplateSteps(campaign.id, selectedTemplate.steps)
      }
      
      setCurrentStep(2)
    } catch (error) {
      console.error('Failed to create campaign:', error)
      alert('Failed to create campaign. Please try again.')
    }
  }

  const handleSequenceSave = () => {
    setCurrentStep(3)
  }

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template)
    setCampaignData((prev: any) => ({
      ...prev,
      name: template.name,
      description: template.description,
      type: 'sequence' // Force sequence for templates
    }))
    setShowTemplates(false)
    setShowForm(true)
  }

  const handleStartFromScratch = () => {
    setSelectedTemplate(null)
    setShowForm(true)
  }

  const handleNavigateToStep = (stepId: number) => {
    if (canNavigateToStep(stepId)) {
      setCurrentStep(stepId)
    }
  }

  // Clear all saved state when starting over or finishing
  const clearSavedState = () => {
    localStorage.removeItem('createCampaign_currentStep')
    localStorage.removeItem('createCampaign_data')
    localStorage.removeItem('createCampaign_id')
    localStorage.removeItem('createCampaign_template')
    localStorage.removeItem('createCampaign_showForm')
    localStorage.removeItem('createCampaign_lastActive')
  }

  const steps = [
    { 
      id: 1, 
      name: 'Campaign Setup', 
      description: 'Basic information',
      icon: Settings
    },
    { 
      id: 2, 
      name: 'Email Sequence', 
      description: 'Create your emails',
      icon: Mail
    },
    { 
      id: 3, 
      name: 'Review & Launch', 
      description: 'Select contacts and launch',
      icon: Users
    }
  ]

  const isFormValid = campaignData.name.trim() && campaignData.from_name.trim() && campaignData.from_email.trim()

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  const canNavigateToStep = (stepId: number) => {
    if (stepId === 1) return true
    if (stepId === 2) return createdCampaignId !== null
    if (stepId === 3) return createdCampaignId !== null
    return false
  }

  // Check email accounts on mount
  useEffect(() => {
    const fetchEmailAccounts = async () => {
      try {
        const response = await fetch('/api/email-accounts')
        if (response.ok) {
          const data = await response.json()
          const accounts = data.accounts || []
          setEmailAccounts(accounts)
          
          const activeAccounts = accounts.filter((acc: any) => 
            acc.status === 'active' || acc.status === 'warming_up'
          )
          
          if (activeAccounts.length === 0) {
            setShowEmailAccountModal(true)
          }
        }
      } catch (error) {
        console.error('Error fetching email accounts:', error)
        setShowEmailAccountModal(true)
      } finally {
        setLoadingEmailAccounts(false)
      }
    }

    fetchEmailAccounts()
  }, [])

  // Pre-fill user data when component mounts
  useEffect(() => {
    if (user && !campaignData.from_name && !campaignData.from_email) {
      const fullName = `${user.first_name} ${user.last_name}`.trim() || ''
      setCampaignData((prev: any) => ({
        ...prev,
        from_name: fullName,
        from_email: user.email || ''
      }))
    }
  }, [user, campaignData.from_name, campaignData.from_email])

  // Handle template variables when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const templateVars = extractVariablesFromTemplate(selectedTemplate)
      const contactFields = getContactFieldMapping()
      const variableStatus = checkVariableAvailability(templateVars, contactFields)
      setTemplateVariables(variableStatus)
    } else {
      setTemplateVariables([])
      setMissingVariableValues({})
    }
  }, [selectedTemplate])

  if (loadingEmailAccounts) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: THEME_COLORS.primary }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-6">
        
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                clearSavedState()
                router.back()
              }}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Campaigns
            </button>
            
            {/* Add Start Fresh button if we have saved state */}
            {(createdCampaignId || currentStep > 1) && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to start fresh? This will clear all progress on the current campaign.')) {
                    clearSavedState()
                    setCurrentStep(1)
                    setCreatedCampaignId(null)
                    setShowForm(false)
                    setSelectedTemplate(null)
                    setCampaignData({
                      name: '',
                      description: '',
                      type: 'sequence',
                      from_name: '',
                      from_email: ''
                    })
                    // Update URL to remove params
                    const url = new URL(window.location.href)
                    url.searchParams.delete('step')
                    url.searchParams.delete('campaignId')
                    window.history.replaceState({}, '', url.toString())
                  }
                }}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Fresh
              </button>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Campaign
          </h1>
          <p className="text-lg text-gray-600">
            Build and launch your email outreach campaign in three simple steps
          </p>
        </motion.div>

        {/* Progress Steps - matching import contacts exactly */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className="flex items-center">
                  {/* Step Circle */}
                  <div 
                    className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all duration-300 ${
                      getStepStatus(stepItem.id) === 'completed' 
                        ? 'border-none shadow-md' 
                        : getStepStatus(stepItem.id) === 'current' 
                        ? 'border-none shadow-lg' 
                        : 'bg-gray-100 border-gray-300'
                    }`}
                    style={{
                      backgroundColor: getStepStatus(stepItem.id) === 'completed' 
                        ? THEME_COLORS.success 
                        : getStepStatus(stepItem.id) === 'current' 
                        ? THEME_COLORS.primary 
                        : undefined
                    }}
                  >
                    {getStepStatus(stepItem.id) === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <stepItem.icon className={`w-6 h-6 ${
                        getStepStatus(stepItem.id) === 'current' ? 'text-white' : 'text-gray-500'
                      }`} />
                    )}
                  </div>
                  
                  {/* Step Info */}
                  <div className="ml-3">
                    <div className={`font-semibold text-sm transition-colors ${
                      getStepStatus(stepItem.id) === 'current' ? 'text-gray-900' :
                      getStepStatus(stepItem.id) === 'completed' ? 'text-gray-700' :
                      'text-gray-500'
                    }`}>
                      {stepItem.name}
                    </div>
                    <div className="text-xs text-gray-500">{stepItem.description}</div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-6">
                    <div 
                      className={`h-0.5 rounded-full transition-all duration-500 ${
                        getStepStatus(stepItem.id) === 'completed' ? 'bg-gray-300' : 'bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: getStepStatus(stepItem.id) === 'completed' ? THEME_COLORS.success : undefined
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && !showForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Choose Your Starting Point
                  </h2>
                  <p className="text-gray-600">
                    Start with a proven template or build from scratch
                  </p>
                </div>

                {/* Template Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Use Template Option */}
                  <motion.button
                    onClick={() => setShowTemplates(true)}
                    className="relative border border-gray-300 rounded-2xl p-8 text-left hover:shadow-md transition-all duration-200 group hover:border-gray-400"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Use a Template</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Start with a proven email sequence that you can customize for your needs. 
                        Choose from professionally crafted templates.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 mr-3" style={{ color: THEME_COLORS.success }} />
                        <span>5 professional templates available</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 mr-3" style={{ color: THEME_COLORS.success }} />
                        <span>Pre-written email sequences</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 mr-3" style={{ color: THEME_COLORS.success }} />
                        <span>Fully customizable content</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div 
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm"
                        style={{ backgroundColor: THEME_COLORS.primary }}
                      >
                        Browse Templates
                      </div>
                    </div>
                  </motion.button>

                  {/* Start from Scratch Option */}
                  <motion.button
                    onClick={handleStartFromScratch}
                    className="relative border border-gray-300 rounded-2xl p-8 text-left hover:shadow-md transition-all duration-200 group hover:border-gray-400"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Start from Scratch</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Create a completely custom campaign from the ground up. 
                        Perfect for unique messaging and specific use cases.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 mr-3" style={{ color: THEME_COLORS.accent }} />
                        <span>Complete creative control</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 mr-3" style={{ color: THEME_COLORS.accent }} />
                        <span>Custom email sequences</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 mr-3" style={{ color: THEME_COLORS.accent }} />
                        <span>Tailored messaging strategy</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium shadow-sm">
                        Start Building
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && showForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Campaign Details</h2>
                    <p className="text-gray-600 text-lg">Set up the basic information for your campaign</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setSelectedTemplate(null)
                      setCampaignData({
                        name: '',
                        description: '',
                        type: 'sequence',
                        from_name: '',
                        from_email: ''
                      })
                    }}
                    className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all duration-200 font-medium"
                  >
                    ← Back to options
                  </button>
                </div>

                {/* Show selected template info */}
                {selectedTemplate && (
                  <motion.div 
                    className="mb-8 border border-gray-200 rounded-2xl p-6 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${THEME_COLORS.primary}10 0%, ${THEME_COLORS.secondary}10 100%)`,
                      borderColor: `${THEME_COLORS.primary}30`
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-md"
                          style={{ backgroundColor: THEME_COLORS.primary }}
                        >
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">
                            Template: {selectedTemplate.name}
                          </h4>
                          <p className="text-gray-700 mt-1 leading-relaxed">{selectedTemplate.description}</p>
                          <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                            <span className="font-medium">{selectedTemplate.emails} emails</span>
                            <span>•</span>
                            <span>{selectedTemplate.duration}</span>
                            <span>•</span>
                            <span className="capitalize">{selectedTemplate.category}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTemplate(null)
                          setCampaignData((prev: any) => ({
                            ...prev,
                            name: '',
                            description: ''
                          }))
                        }}
                        className="px-4 py-2 rounded-xl hover:bg-white hover:bg-opacity-50 transition-all duration-200 font-medium"
                        style={{ color: THEME_COLORS.primary }}
                      >
                        Remove Template
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Missing Variables Form */}
                {selectedTemplate && templateVariables.length > 0 && (
                  <MissingVariablesForm
                    missingVariables={templateVariables}
                    onVariablesChange={setMissingVariableValues}
                    templateName={selectedTemplate.name}
                    fromName={campaignData.from_name} // Pass the from_name to pre-fill
                  />
                )}
                
                <form onSubmit={handleCampaignSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Campaign Name
                      </label>
                      <input
                        type="text"
                        value={campaignData.name}
                        onChange={(e) => setCampaignData((prev: any) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-black focus:ring-2 focus:border-transparent transition-all duration-200"
                        style={{ 
                          '--tw-ring-color': THEME_COLORS.primary
                        } as any}
                        placeholder="e.g., Welcome Series, Product Launch"
                        required
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Description (Optional)
                      </label>
                      <textarea
                        value={campaignData.description}
                        onChange={(e) => setCampaignData((prev: any) => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-black focus:ring-2 focus:border-transparent transition-all duration-200"
                        style={{ 
                          '--tw-ring-color': THEME_COLORS.primary
                        } as any}
                        placeholder="Describe the purpose of this campaign..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">From Name</label>
                      <input
                        type="text"
                        value={campaignData.from_name}
                        onChange={(e) => setCampaignData((prev: any) => ({ ...prev, from_name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:border-transparent transition-all duration-200"
                        style={{ 
                          '--tw-ring-color': THEME_COLORS.primary
                        } as any}
                        placeholder="John Smith"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will be used for the {`{{from_name}}`} variable in templates
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">From Email</label>
                      <input
                        type="email"
                        value={campaignData.from_email}
                        onChange={(e) => setCampaignData((prev: any) => ({ ...prev, from_email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:border-transparent transition-all duration-200"
                        style={{ 
                          '--tw-ring-color': THEME_COLORS.primary
                        } as any}
                        placeholder="john@company.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Campaign Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div 
                        className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                          campaignData.type === 'sequence' 
                            ? 'shadow-lg border-2' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                        style={campaignData.type === 'sequence' ? {
                          backgroundColor: `${THEME_COLORS.primary}10`,
                          borderColor: THEME_COLORS.primary
                        } : {}}
                        onClick={() => setCampaignData((prev: any) => ({ ...prev, type: 'sequence' }))}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="campaignType"
                            value="sequence"
                            checked={campaignData.type === 'sequence'}
                            onChange={() => setCampaignData((prev: any) => ({ ...prev, type: 'sequence' }))}
                            className="h-5 w-5 border-gray-300 focus:ring-2 transition-all"
                            style={{ 
                              color: THEME_COLORS.primary,
                              '--tw-ring-color': THEME_COLORS.primary
                            } as any}
                          />
                          <div className="ml-4">
                            <div className="font-semibold text-gray-900 text-lg">Email Sequence</div>
                            <div className="text-sm text-gray-600 mt-1">Multiple emails with delays between steps</div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div 
                        className={`relative p-6 border-2 rounded-2xl transition-all duration-200 ${
                          selectedTemplate 
                            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' 
                            : campaignData.type === 'single' 
                            ? 'shadow-lg border-2 cursor-pointer' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer'
                        }`}
                        style={campaignData.type === 'single' && !selectedTemplate ? {
                          backgroundColor: `${THEME_COLORS.primary}10`,
                          borderColor: THEME_COLORS.primary
                        } : {}}
                        onClick={() => !selectedTemplate && setCampaignData((prev: any) => ({ ...prev, type: 'single' }))}
                        whileHover={!selectedTemplate ? { scale: 1.02 } : {}}
                        whileTap={!selectedTemplate ? { scale: 0.98 } : {}}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="campaignType"
                            value="single"
                            checked={campaignData.type === 'single'}
                            onChange={() => !selectedTemplate && setCampaignData((prev: any) => ({ ...prev, type: 'single' }))}
                            disabled={!!selectedTemplate}
                            className="h-5 w-5 border-gray-300 focus:ring-2 transition-all disabled:opacity-50"
                            style={{ 
                              color: THEME_COLORS.primary,
                              '--tw-ring-color': THEME_COLORS.primary
                            } as any}
                          />
                          <div className="ml-4">
                            <div className="font-semibold text-gray-900 text-lg">Single Email</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {selectedTemplate 
                                ? 'Not available for templates' 
                                : 'One email sent immediately'
                              }
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-8 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        clearSavedState()
                        router.back()
                      }}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
                      style={{ 
                        '--tw-ring-color': THEME_COLORS.primary
                      } as any}
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || !isFormValid}
                      className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      style={{ 
                        backgroundColor: THEME_COLORS.primary,
                        '--tw-ring-color': THEME_COLORS.primary
                      } as any}
                    >
                      {isLoading ? 'Creating...' : selectedTemplate ? 'Create with Template' : 'Continue to Sequence'}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {currentStep === 2 && createdCampaignId && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-12">
                {selectedTemplate && (
                  <motion.div 
                    className="mb-8 border border-gray-200 rounded-2xl p-6 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${THEME_COLORS.success}10 0%, ${THEME_COLORS.primary}10 100%)`,
                      borderColor: `${THEME_COLORS.success}30`
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-md"
                        style={{ backgroundColor: THEME_COLORS.success }}
                      >
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Template Applied!</h3>
                        <div className="text-gray-700 mt-1 leading-relaxed">
                          Your email sequence has been pre-populated with the "{selectedTemplate.name}" template. 
                          You can customize any part of it below.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <SequenceBuilder 
                  campaignId={createdCampaignId}
                  onSave={handleSequenceSave}
                  templateApplied={!!selectedTemplate}
                />
                
                <div className="flex justify-between pt-8 mt-8 border-t border-gray-100">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
                    style={{ 
                      '--tw-ring-color': THEME_COLORS.primary
                    } as any}
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Details
                  </button>

                  <button
                    onClick={handleSequenceSave}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
                    style={{ 
                      backgroundColor: THEME_COLORS.primary,
                      '--tw-ring-color': THEME_COLORS.primary
                    } as any}
                  >
                    Continue to Review
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-12">
                <ContactSelector
                  campaignId={createdCampaignId!}
                  onContactsSelected={(contactIds) => {
                    localStorage.setItem('createCampaign_selectedContacts', JSON.stringify(contactIds))
                  }}
                  selectedContactIds={(() => {
                    const saved = localStorage.getItem('createCampaign_selectedContacts')
                    return saved ? JSON.parse(saved) : []
                  })()}
                  onSaveAsDraft={async () => {
                    try {
                      // Get currently selected contacts
                      const selectedContacts = JSON.parse(localStorage.getItem('createCampaign_selectedContacts') || '[]')
                      
                      console.log('Saving campaign as draft with contacts:', selectedContacts)
                      
                      // 1. First, update campaign data with current form data
                      const campaignUpdateData = {
                        name: campaignData.name,
                        description: campaignData.description,
                        from_name: campaignData.from_name,
                        from_email: campaignData.from_email,
                        status: 'draft'
                      }
                      
                      console.log('Updating campaign data:', campaignUpdateData)
                      
                      const campaignResponse = await fetch(`/api/campaigns/${createdCampaignId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(campaignUpdateData)
                      })
                      
                      if (!campaignResponse.ok) {
                        const campaignError = await campaignResponse.json()
                        console.error('Failed to update campaign:', campaignError)
                        throw new Error(campaignError.error || 'Failed to update campaign')
                      }
                      
                      console.log('Campaign updated successfully')
                      
                      // 2. Then, save the selected contacts to the campaign
                      if (selectedContacts.length > 0) {
                        console.log('Saving contacts to campaign:', selectedContacts)
                        
                        const contactsResponse = await fetch(`/api/campaigns/${createdCampaignId}/contacts`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ contactIds: selectedContacts })
                        })
                        
                        if (!contactsResponse.ok) {
                          const contactsError = await contactsResponse.json()
                          console.error('Failed to save contacts:', contactsError)
                          throw new Error(contactsError.error || 'Failed to save contacts')
                        }
                        
                        const contactsResult = await contactsResponse.json()
                        console.log('Contacts saved successfully:', contactsResult)
                        
                        // 3. Update the campaign with the recipient count
                        await fetch(`/api/campaigns/${createdCampaignId}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            total_recipients: selectedContacts.length 
                          })
                        })
                        
                        console.log('Campaign recipient count updated')
                      }
                      
                      // Show success message with contact count
                      alert(`✅ Campaign saved as draft successfully! ${selectedContacts.length} contacts saved.`)
                      
                    } catch (error) {
                      console.error('Error saving draft:', error)
                      alert(`❌ Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`)
                    }
                  }}
                  onNavigateToContacts={() => {
                    router.push('/contacts')
                  }}
                />
                
                <div className="flex justify-between pt-8 mt-8 border-t border-gray-100">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
                    style={{ 
                      '--tw-ring-color': THEME_COLORS.primary
                    } as any}
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Sequence
                  </button>

                  <button
                    onClick={async () => {
                      const selectedContacts = JSON.parse(localStorage.getItem('createCampaign_selectedContacts') || '[]')
                      
                      if (selectedContacts.length === 0) {
                        alert('Please select at least one contact for your campaign.')
                        return 
                      }
                      
                      try {
                        console.log('Completing campaign setup with contacts:', selectedContacts)
                        
                        // 1. Update campaign with all current data
                        const finalCampaignData = { 
                          name: campaignData.name,
                          description: campaignData.description,
                          from_name: campaignData.from_name,
                          from_email: campaignData.from_email,
                          status: 'ready', // Ready for launch
                          total_recipients: selectedContacts.length
                        }
                        
                        console.log('Final campaign data:', finalCampaignData)
                        
                        const campaignResponse = await fetch(`/api/campaigns/${createdCampaignId}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(finalCampaignData)
                        })
                        
                        if (!campaignResponse.ok) {
                          const campaignError = await campaignResponse.json()
                          console.error('Failed to update campaign:', campaignError)
                          throw new Error('Failed to update campaign')
                        }
                        
                        // 2. Save selected contacts to campaign
                        console.log('Saving contacts to campaign:', selectedContacts)
                        
                        const contactsResponse = await fetch(`/api/campaigns/${createdCampaignId}/contacts`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ contactIds: selectedContacts })
                        })
                        
                        if (!contactsResponse.ok) {
                          const contactsError = await contactsResponse.json()
                          console.error('Failed to save contacts:', contactsError)
                          throw new Error('Failed to save contacts')
                        }
                        
                        const contactsResult = await contactsResponse.json()
                        console.log('Contacts saved successfully:', contactsResult)
                        
                        // 3. Clear localStorage and redirect
                        clearSavedState()
                        
                        alert(`🎉 Campaign setup completed successfully! ${selectedContacts.length} contacts added.`)
                        router.push(`/campaigns/${createdCampaignId}`)
                        
                      } catch (error) {
                        console.error('Error completing campaign setup:', error)
                        alert(`❌ Failed to complete setup: ${error instanceof Error ? error.message : 'Unknown error'}`)
                      }
                    }}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
                    style={{ 
                      backgroundColor: THEME_COLORS.success,
                      '--tw-ring-color': THEME_COLORS.success
                    } as any}
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Complete Campaign Setup
                  </button>
                </div>
              </div>
            </div>
          )} 
        </motion.div>

        {/* Email Account Required Modal */}
        {showEmailAccountModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <motion.div 
              className="relative p-8 border w-[480px] max-w-[90vw] shadow-xl rounded-2xl bg-white"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
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
                    onClick={() => {
                      clearSavedState()
                      router.push('/campaigns')
                    }}
                    className="flex-1 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium"
                  >
                    Back to Campaigns
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

        {/* Templates Modal */}
        {showTemplates && (
          <CampaignTemplates
            onSelectTemplate={handleTemplateSelect}
            onClose={() => setShowTemplates(false)}
          />
        )}
      </div>
    </div>
  )
}