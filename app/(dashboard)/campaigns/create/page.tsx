// ./app/(dashboard)/campaigns/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCampaignStore } from '@/store/useCampaignStore'
import SequenceBuilder from '@/components/campaigns/SequenceBuilder'
import CampaignTemplates from '@/components/campaigns/CampaignTemplates'
import ContactSelector from '@/components/campaigns/ContactSelector'
import { ArrowLeft, ArrowRight, Save, Mail, Settings, CheckCircle, Users, RotateCcw } from 'lucide-react'
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

export default function CreateCampaignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createCampaign, isLoading } = useCampaignStore()
  
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
        await fetch(`/api/campaigns/${campaignId}/steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'email',
            subject: step.subject,
            content: step.content,
            delay_days: step.delay_days,
            delay_hours: step.delay_hours,
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
      type: template.emails > 1 ? 'sequence' : 'single'
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
      icon: Settings,
      color: 'blue'
    },
    { 
      id: 2, 
      name: 'Email Sequence', 
      description: 'Create your emails',
      icon: Mail,
      color: 'purple'
    },
    { 
      id: 3, 
      name: 'Review & Launch', 
      description: 'Select contacts and launch',
      icon: Users,
      color: 'green'
    }
  ]

  const isFormValid = campaignData.name.trim() && campaignData.from_name.trim() && campaignData.from_email.trim()

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  const getStepColor = (stepId: number) => {
    const status = getStepStatus(stepId)
    if (status === 'completed') return 'bg-green-600 border-green-600'
    if (status === 'current') return 'bg-blue-600 border-blue-600'
    return 'bg-gray-100 border-gray-300'
  }

  const getStepTextColor = (stepId: number) => {
    const status = getStepStatus(stepId)
    if (status === 'completed') return 'text-white'
    if (status === 'current') return 'text-white'
    return 'text-gray-500'
  }

  const canNavigateToStep = (stepId: number) => {
    if (stepId === 1) return true
    if (stepId === 2) return createdCampaignId !== null
    if (stepId === 3) return createdCampaignId !== null
    return false
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
              onClick={() => {
                clearSavedState()
                router.back()
              }}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
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
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Fresh
              </button>
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create New Campaign
          </h1>
          <p className="text-xl text-gray-600">
            Build and launch your email outreach campaign in three simple steps
          </p>
        </motion.div>

        {/* Progress Steps */}
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
                  {/* Step Circle */}
                  <button
                    onClick={() => handleNavigateToStep(step.id)}
                    disabled={!canNavigateToStep(step.id)}
                    className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-300 ${getStepColor(step.id)} ${
                      canNavigateToStep(step.id) ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-not-allowed'
                    } ${currentStep === step.id ? 'shadow-xl shadow-blue-200' : ''}`}
                  >
                    {getStepStatus(step.id) === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <step.icon className={`w-8 h-8 ${getStepTextColor(step.id)}`} />
                    )}
                    
                    {/* Pulse animation for current step */}
                    {currentStep === step.id && (
                      <div className="absolute inset-0 rounded-2xl bg-blue-600 animate-ping opacity-20"></div>
                    )}
                  </button>
                  
                  {/* Step Info */}
                  <div className="ml-4">
                    <div className={`font-semibold transition-colors ${
                      getStepStatus(step.id) === 'current' ? 'text-blue-600' :
                      getStepStatus(step.id) === 'completed' ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                    <div className="text-sm text-gray-500">{step.description}</div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-8">
                    <div className={`h-1 rounded-full transition-all duration-500 ${
                      currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'
                    }`}></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && !showForm && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-12">
                {/* Template Selection or Start from Scratch */}
                <div className="text-center">
                  <motion.div
                    initial="initial"
                    animate="animate"
                    variants={staggerContainer}
                  >
                    <motion.h2 
                      className="text-3xl font-bold text-gray-900 mb-4"
                      variants={staggerItem}
                    >
                      Choose Your Starting Point
                    </motion.h2>
                    <motion.p 
                      className="text-xl text-gray-600 mb-12"
                      variants={staggerItem}
                    >
                      Start with a proven template or build from scratch
                    </motion.p>
                    
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
                      variants={staggerContainer}
                    >
                      <motion.button
                        onClick={() => setShowTemplates(true)}
                        className="group relative p-8 border-2 border-dashed border-blue-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                        variants={staggerItem}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                            <Mail className="h-10 w-10 text-blue-600 group-hover:scale-110 transition-transform" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Use a Template</h3>
                          <p className="text-gray-600 mb-4">
                            Start with a proven email sequence that you can customize
                          </p>
                          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            5 professional templates
                          </div>
                        </div>
                      </motion.button>
                      
                      <motion.button
                        onClick={handleStartFromScratch}
                        className="group relative p-8 border-2 border-gray-300 rounded-2xl hover:border-gray-400 hover:bg-gray-50 transition-all text-center"
                        variants={staggerItem}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-200 transition-colors">
                            <Settings className="h-10 w-10 text-gray-600 group-hover:scale-110 transition-transform" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Start from Scratch</h3>
                          <p className="text-gray-600 mb-4">
                            Create a completely custom campaign from the ground up
                          </p>
                          <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                            Full customization
                          </div>
                        </div>
                      </motion.button>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && showForm && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Campaign Details</h2>
                    <p className="text-gray-600">Set up the basic information for your campaign</p>
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
                    className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    ← Back to options
                  </button>
                </div>

                {/* Show selected template info */}
                {selectedTemplate && (
                  <motion.div 
                    className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                          <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-900 text-lg">
                            Template: {selectedTemplate.name}
                          </h4>
                          <p className="text-blue-700 mt-1">{selectedTemplate.description}</p>
                          <div className="flex items-center space-x-6 mt-2 text-sm text-blue-600">
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
                        className="text-blue-600 hover:text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        Remove Template
                      </button>
                    </div>
                  </motion.div>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Describe the purpose of this campaign..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">From Name</label>
                      <input
                        type="text"
                        value={campaignData.from_name}
                        onChange={(e) => setCampaignData((prev: any) => ({ ...prev, from_name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">From Email</label>
                      <input
                        type="email"
                        value={campaignData.from_email}
                        onChange={(e) => setCampaignData((prev: any) => ({ ...prev, from_email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                          campaignData.type === 'sequence' 
                            ? 'border-blue-500 bg-blue-50 shadow-lg' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
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
                            className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="ml-4">
                            <div className="font-semibold text-gray-900 text-lg">Email Sequence</div>
                            <div className="text-sm text-gray-600 mt-1">Multiple emails with delays between steps</div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div 
                        className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                          campaignData.type === 'single' 
                            ? 'border-blue-500 bg-blue-50 shadow-lg' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                        onClick={() => setCampaignData((prev: any) => ({ ...prev, type: 'single' }))}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="campaignType"
                            value="single"
                            checked={campaignData.type === 'single'}
                            onChange={() => setCampaignData((prev: any) => ({ ...prev, type: 'single' }))}
                            className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="ml-4">
                            <div className="font-semibold text-gray-900 text-lg">Single Email</div>
                            <div className="text-sm text-gray-600 mt-1">One email sent immediately</div>
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
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || !isFormValid}
                      className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
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
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-12">
                {selectedTemplate && (
                  <motion.div 
                    className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-green-800 text-lg">Template Applied!</h3>
                        <div className="text-green-700 mt-1">
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
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Details
                  </button>

                  <button
                    onClick={handleSequenceSave}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:shadow-lg"
                  >
                    Continue to Review
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
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
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all hover:shadow-lg"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Complete Campaign Setup
                  </button>
                </div>
              </div>
            </div>
          )} 
        </motion.div>

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