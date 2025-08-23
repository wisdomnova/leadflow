// ./app/(dashboard)/campaigns/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaignStore } from '@/store/useCampaignStore'
import SequenceBuilder from '@/components/campaigns/SequenceBuilder'
import CampaignTemplates from '@/components/campaigns/CampaignTemplates'
import { ArrowLeft, ArrowRight, Save, Mail, Settings } from 'lucide-react'

export default function CreateCampaignPage() {
  const router = useRouter()
  const { createCampaign, isLoading } = useCampaignStore()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    type: 'sequence' as 'sequence' | 'single',
    from_name: '',
    from_email: ''
  })
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

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
    router.push(`/campaigns/${createdCampaignId}`)
  }

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template)
    setCampaignData(prev => ({
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

  const steps = [
    { id: 1, name: 'Campaign Details', description: 'Basic information' },
    { id: 2, name: 'Email Sequence', description: 'Create your email steps' },
    { id: 3, name: 'Contacts & Launch', description: 'Select contacts and launch' }
  ]

  const isFormValid = campaignData.name.trim() && campaignData.from_name.trim() && campaignData.from_email.trim()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep === step.id 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : currentStep > step.id
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{step.name}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className={`h-0.5 ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
                  }`}></div>
                </div>
              )}
            </div>
          ))} 
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {currentStep === 1 && !showForm && (
          <div className="p-6">
            {/* Template Selection or Start from Scratch */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Create New Campaign</h1>
              <p className="text-gray-600 mb-8">
                Choose how you'd like to start your campaign
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="p-8 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
                >
                  <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Use a Template</h3>
                  <p className="text-sm text-gray-600">
                    Start with a proven email sequence that you can customize
                  </p>
                  <div className="mt-4 text-xs text-blue-600 font-medium">
                    5 professional templates available
                  </div>
                </button>
                
                <button
                  onClick={handleStartFromScratch}
                  className="p-8 border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-center group"
                >
                  <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start from Scratch</h3>
                  <p className="text-sm text-gray-600">
                    Create a completely custom campaign from the ground up
                  </p>
                  <div className="mt-4 text-xs text-gray-500 font-medium">
                    Full customization
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && showForm && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Campaign Details</h1>
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
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to options
              </button>
            </div>

            {/* Show selected template info */}
            {selectedTemplate && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Using Template: {selectedTemplate.name}
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">{selectedTemplate.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                      <span>{selectedTemplate.emails} emails</span>
                      <span>•</span>
                      <span>{selectedTemplate.duration}</span>
                      <span>•</span>
                      <span className="capitalize">{selectedTemplate.category}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTemplate(null)
                      setCampaignData(prev => ({
                        ...prev,
                        name: '',
                        description: ''
                      }))
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Remove Template
                  </button>
                </div>
              </div>
            )}
            
            <form onSubmit={handleCampaignSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Welcome Series, Product Launch"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={campaignData.description}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the purpose of this campaign..."
                />
              </div>

              {/* Sender Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sender Information
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From Name *</label>
                    <input
                      type="text"
                      value={campaignData.from_name}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, from_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From Email *</label>
                    <input
                      type="email"
                      value={campaignData.from_email}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, from_email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This information will appear in the "From" field of your emails
                </p>
              </div>

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
                        <div className="text-xs text-gray-500">2-5 emails with delays between steps</div>
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

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : selectedTemplate ? 'Create with Template' : 'Continue'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 2 && createdCampaignId && (
          <div className="p-6">
            {selectedTemplate && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Template Applied!</h3>
                    <div className="text-sm text-green-700 mt-1">
                      Your email sequence has been pre-populated with the "{selectedTemplate.name}" template. 
                      You can customize any part of it below.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <SequenceBuilder 
              campaignId={createdCampaignId}
              onSave={handleSequenceSave}
            />
            
            <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>

              <button
                onClick={handleSequenceSave}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue to Contacts
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <CampaignTemplates
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div> 
  )
}