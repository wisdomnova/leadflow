// ./components/campaigns/SequenceBuilder.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSequenceStore } from '@/store/useSequenceStore'
import { Plus, Save, AlertCircle, CheckCircle } from 'lucide-react'
import EmailStepEditor from './EmailStepEditor'

interface SequenceBuilderProps { 
  campaignId?: string
  onSave?: () => void
}

export default function SequenceBuilder({ campaignId, onSave }: SequenceBuilderProps) {
  const {
    steps,
    isLoading,
    error,
    addStep,
    removeStep,
    updateStep,
    reorderSteps,
    saveSequence,
    loadSequence,
    resetSequence
  } = useSequenceStore()

  const [draggedStep, setDraggedStep] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (campaignId) {
      loadSequence(campaignId)
    } else {
      resetSequence()
      // Add initial step if no steps exist
      if (steps.length === 0) {
        addStep()
      }
    }
  }, [campaignId])

  useEffect(() => {
    // Add initial step if no steps exist
    if (steps.length === 0) {
      addStep()
    }
  }, [steps.length, addStep])

  const handleSave = async () => {
    if (!campaignId) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      await saveSequence(campaignId)
      setSaveSuccess(true)
      onSave?.()
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save sequence:', error)
    }

    setIsSaving(false)
  }

  const handleDragStart = (index: number) => {
    setDraggedStep(index)
  }

  const handleDragOver = (index: number) => {
    if (draggedStep === null || draggedStep === index) return
    
    reorderSteps(draggedStep, index)
    setDraggedStep(index)
  }

  const handleDrop = () => {
    setDraggedStep(null)
  }

  const canAddStep = steps.length < 5
  const isValidSequence = steps.every(step => step.subject.trim() && step.content.trim())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Email Sequence</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create a sequence of {steps.length > 1 ? `${steps.length} emails` : '1 email'} 
            {steps.length > 1 && ' with delays between each step'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Save Status */}
          {saveSuccess && (
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Saved successfully
            </div>
          )}

          {/* Save Button */}
          {campaignId && (
            <button
              onClick={handleSave}
              disabled={isSaving || !isValidSequence}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Sequence'}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading sequence...</span>
        </div>
      )}

      {/* Sequence Steps */}
      {!isLoading && (
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <EmailStepEditor
                step={step}
                stepIndex={index}
                totalSteps={steps.length}
                onUpdate={updateStep}
                onRemove={removeStep}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />

              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="flex justify-center my-4">
                  <div className="flex items-center text-gray-400">
                    <div className="w-8 h-px bg-gray-300"></div>
                    <div className="mx-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="w-8 h-px bg-gray-300"></div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Step Button */}
          {canAddStep && (
            <div className="flex justify-center">
              <button
                onClick={addStep}
                className="inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Email Step ({steps.length}/5)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Validation Messages */}
      {!isValidSequence && steps.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Incomplete Steps
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                Please fill in the subject line and content for all email steps.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}