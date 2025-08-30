// ./components/campaigns/SequenceBuilder.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSequenceStore } from '@/store/useSequenceStore'
import { Plus, Save, AlertCircle, CheckCircle, Clock, Mail, Edit2, Eye, Smartphone, Monitor, GripVertical, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TemplateVariablePicker from './TemplateVariablePicker'

interface SequenceBuilderProps { 
  campaignId?: string
  onSave?: () => void 
  templateApplied?: boolean
  readOnly?: boolean // Add this line
}

interface EmailPreviewProps {
  step: any
  onClose: () => void
}

function EmailPreview({ step, onClose }: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Email Preview</h3>
              <p className="text-gray-600 mt-1">{step.name || 'Email Step'}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'desktop' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Monitor className="h-4 w-4 mr-1" />
                  Desktop
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'mobile' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="h-4 w-4 mr-1" />
                  Mobile
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-red-50 rounded-full transition-colors cursor-pointer bg-red-100 border border-red-200"
              >
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            <div className="flex justify-center">
              <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 transition-all duration-300 ${
                viewMode === 'desktop' ? 'max-w-2xl w-full' : 'max-w-sm w-full'
              }`}>
                {/* Email Header */}
                <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600 font-medium">From: your-company@email.com</span>
                    <span className="text-sm text-gray-500">Now</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {step.subject || 'No subject'}
                  </h2>
                </div>

                {/* Email Body */}
                <div className="p-6">
                  <div className="prose prose-gray max-w-none">
                    {step.content ? (
                      <div className="whitespace-pre-wrap text-gray-900 leading-relaxed text-base">
                        {step.content}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-center py-8">
                        No content available
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Footer */}
                <div className="border-t border-gray-100 p-4 bg-gray-50 text-center">
                  <p className="text-xs text-gray-500">
                    This is a preview of how your email will appear to recipients
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Previewing: <span className="font-medium">{step.subject || 'Untitled Email'}</span>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function SequenceBuilder({ 
  campaignId, 
  onSave, 
  templateApplied, 
  readOnly = false // Add this with default value
}: SequenceBuilderProps) {
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
    resetSequence,
    addStepAtIndex
  } = useSequenceStore()

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [templateLoadAttempted, setTemplateLoadAttempted] = useState(false)
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [previewingStep, setPreviewingStep] = useState<any | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Use useRef to store textarea refs without causing re-renders
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | HTMLInputElement | null }>({})
  const [activeField, setActiveField] = useState<{ stepId: string, field: 'subject' | 'content' } | null>(null)

  // Initial load effect
  useEffect(() => {
    if (campaignId) {
      console.log('Loading sequence for campaign:', campaignId)
      loadSequence(campaignId)
    } else {
      resetSequence()
      if (steps.length === 0 && !readOnly) {
        addStep()
      }
    }
  }, [campaignId, loadSequence, resetSequence, readOnly])

  // Template applied effect
  useEffect(() => {
    if (campaignId && templateApplied && !templateLoadAttempted) {
      console.log('Template applied, reloading sequence after delay...')
      setTemplateLoadAttempted(true)
      
      const timeoutId = setTimeout(() => {
        console.log('Reloading sequence now...')
        loadSequence(campaignId)
      }, 1500)

      return () => clearTimeout(timeoutId)
    }
  }, [campaignId, templateApplied, templateLoadAttempted, loadSequence])

  // Add initial step if no steps exist (only if not read-only)
  useEffect(() => {
    if (!templateApplied && !isLoading && steps.length === 0 && campaignId && !templateLoadAttempted && !readOnly) {
      console.log('No template applied and no steps, adding initial step')
      addStep()
    }
  }, [steps.length, addStep, isLoading, templateApplied, campaignId, templateLoadAttempted, readOnly])

  const handleSave = async () => {
    if (!campaignId || readOnly) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      await saveSequence(campaignId)
      setSaveSuccess(true)
      onSave?.()
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save sequence:', error)
    }

    setIsSaving(false)
  }

  const handleManualReload = () => {
    if (campaignId) {
      console.log('Manual reload triggered')
      setTemplateLoadAttempted(true)
      loadSequence(campaignId)
    }
  }

  const handleDragStart = (index: number) => {
    if (readOnly) return
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (readOnly) return
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderSteps(draggedIndex, index)
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    if (readOnly) return
    setDraggedIndex(null)
  }

  const handleAddStepAtIndex = (index: number) => {
    if (readOnly) return
    
    const newStep = {
      id: `step-${Date.now()}`,
      stepNumber: index + 1,
      name: `Step ${index + 1}`,
      subject: '',
      content: '',
      delayAmount: 1,
      delayUnit: 'days' as 'hours' | 'days',
      order_index: index
    }

    // Use the store method if available, otherwise implement locally
    if (addStepAtIndex) {
      addStepAtIndex(newStep, index)
    } else {
      // Fallback: Add to end and reorder
      addStep()
      // You would need to implement reordering logic here
    }
  }

  const handleDelayChange = (stepId: string, value: string) => {
    if (readOnly) return
    
    if (value === 'immediate') {
      updateStep(stepId, { delayAmount: 0, delayUnit: 'hours' })
    } else {
      const [amount, unit] = value.split('-')
      updateStep(stepId, { 
        delayAmount: parseInt(amount), 
        delayUnit: unit as 'hours' | 'days' 
      })
    }
  }

  const getDelayValue = (step: any) => {
    if (step.delayAmount === 0) return 'immediate'
    return `${step.delayAmount}-${step.delayUnit}`
  }

  const handleVariableInsert = (variable: string) => {
    if (readOnly || !activeField) return
    
    const { stepId, field } = activeField
    const step = steps.find(s => s.id === stepId)
    if (step) {
      const currentValue = step[field]
      const element = textareaRefs.current[`${stepId}-${field}`]
      
      if (element && 'selectionStart' in element) {
        const start = element.selectionStart || 0
        const end = element.selectionEnd || 0
        const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end)
        
        updateStep(stepId, { [field]: newValue })
        
        // Reset cursor position after the inserted variable
        setTimeout(() => {
          if (element && 'selectionStart' in element) {
            element.selectionStart = element.selectionEnd = start + variable.length
            element.focus()
          }
        }, 0)
      } else {
        // Fallback: append to end
        updateStep(stepId, { [field]: currentValue + variable })
      }
    }
  }

  const canAddStep = steps.length < 5 && !readOnly
  const isValidSequence = steps.every(step => step.subject.trim() && step.content.trim())

  const shouldShowLoading = isLoading && !templateApplied
  const shouldShowTemplateLoading = templateApplied && steps.length === 0 && !templateLoadAttempted

  if (shouldShowTemplateLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-4">Loading template steps...</p>
            {!readOnly && (
              <button
                onClick={handleManualReload}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Click here if steps don't load
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Read-only indicator */}
      {readOnly && (
        <motion.div 
          className="bg-gray-50 border border-gray-200 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-gray-500 mr-3" />
            <div>
              <p className="text-gray-800 font-medium">Read-Only Mode</p>
              <p className="text-gray-600 text-sm mt-1">
                Email sequence cannot be modified while the campaign is active.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Sequence</h2>
          <p className="text-gray-600 mt-1">
            {readOnly ? 'View your automated email sequence' : 'Build your automated email sequence'}
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

          {/* Save Button - only show if not read-only */}
          {campaignId && !readOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving || !isValidSequence}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Sequence'}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              {campaignId && !readOnly && (
                <button
                  onClick={handleManualReload}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Try reloading
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {shouldShowLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading sequence...</span>
        </div>
      )}

      {/* Sequence Timeline */}
      {!shouldShowLoading && (
        <div className="space-y-6">
          {steps.length > 0 ? (
            <>
              {/* Simplified Step Cards */}
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id}>
                    {/* Add Step Button Between Steps - only show if not read-only */}
                    {index > 0 && canAddStep && !readOnly && (
                      <div className="flex justify-center py-2">
                        <button
                          onClick={() => handleAddStepAtIndex(index)}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add step here
                        </button>
                      </div>
                    )}

                    <motion.div
                      className="group relative"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      draggable={!readOnly}
                      onDragStart={() => !readOnly && handleDragStart(index)}
                      onDragOver={(e) => !readOnly && handleDragOver(e, index)}
                      onDragEnd={() => !readOnly && handleDragEnd()}
                    >
                      {/* Timeline Connection */}
                      {index > 0 && (
                        <div className="absolute -top-4 left-6 w-0.5 h-4 bg-gray-200"></div>
                      )}

                      {/* Step Card */}
                      <div className={`bg-white border border-gray-200 rounded-2xl p-6 transition-all ${
                        !readOnly ? 'hover:border-gray-300 hover:shadow-lg' : ''
                      }`}>
                        <div className="flex items-start space-x-4">
                          {/* Drag Handle - only show if not read-only */}
                          {!readOnly && (
                            <div className="flex-shrink-0 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            </div>
                          )}

                          {/* Step Number */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg">
                              {index + 1}
                            </div>
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {step.name || `Email ${index + 1}`}
                                </h3>
                                
                                {/* Wait Time Display */}
                                <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {step.delayAmount === 0 ? 'Send immediately' : `${step.delayAmount} ${step.delayUnit}`}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setPreviewingStep(step)}
                                  className={`transition-opacity p-2 hover:bg-gray-100 rounded-lg ${
                                    readOnly ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                  }`}
                                  title="Preview email"
                                >
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </button>
                                {!readOnly && (
                                  <button
                                    onClick={() => setEditingStep(editingStep === step.id ? null : step.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg"
                                    title="Edit step"
                                  >
                                    <Edit2 className="h-4 w-4 text-gray-500" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Subject Preview */}
                            <div className="mb-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Subject:</span>
                              </div>
                              <p className="text-gray-900 font-medium">
                                {step.subject || 'No subject set'}
                              </p>
                            </div>

                            {/* Content Preview */}
                            <div>
                              <span className="text-sm font-medium text-gray-700 mb-1 block">Content Preview:</span>
                              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                {step.content ? 
                                  step.content.substring(0, 120) + (step.content.length > 120 ? '...' : '') : 
                                  'No content set'
                                }
                              </p>
                            </div>

                            {/* Edit Form - only show if not read-only */}
                            <AnimatePresence>
                              {editingStep === step.id && !readOnly && (
                                <motion.div
                                  className="mt-6 pt-6 border-t border-gray-200"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <div className="space-y-4">
                                    {/* Timing Controls - Simple Dropdown */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Send Timing
                                        </label>
                                        <select
                                          value={getDelayValue(step)}
                                          onChange={(e) => handleDelayChange(step.id, e.target.value)}
                                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                          <option value="immediate">Send immediately</option>
                                          <option value="1-hours">1 hour after</option>
                                          <option value="2-hours">2 hours after</option>
                                          <option value="3-hours">3 hours after</option>
                                          <option value="6-hours">6 hours after</option>
                                          <option value="12-hours">12 hours after</option>
                                          <option value="1-days">1 day after</option>
                                          <option value="2-days">2 days after</option>
                                          <option value="3-days">3 days after</option>
                                          <option value="5-days">5 days after</option>
                                          <option value="7-days">1 week after</option>
                                          <option value="14-days">2 weeks after</option>
                                          <option value="30-days">1 month after</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Subject */}
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                          Subject Line
                                        </label>
                                        <TemplateVariablePicker
                                          onInsert={handleVariableInsert}
                                        />
                                      </div>
                                      <input
                                        ref={(ref) => {
                                          textareaRefs.current[`${step.id}-subject`] = ref
                                        }}
                                        type="text"
                                        value={step.subject}
                                        onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                                        onFocus={() => setActiveField({ stepId: step.id, field: 'subject' })}
                                        placeholder="Enter email subject..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>

                                    {/* Content */}
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                          Email Content
                                        </label>
                                        <TemplateVariablePicker
                                          onInsert={handleVariableInsert}
                                        />
                                      </div>
                                      <textarea
                                        ref={(ref) => {
                                          textareaRefs.current[`${step.id}-content`] = ref
                                        }}
                                        value={step.content}
                                        onChange={(e) => updateStep(step.id, { content: e.target.value })}
                                        onFocus={() => setActiveField({ stepId: step.id, field: 'content' })}
                                        placeholder="Write your email content here..."
                                        rows={8}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                                      />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-4">
                                      <button
                                        onClick={() => setEditingStep(null)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      
                                      <div className="flex items-center space-x-3">
                                        {steps.length > 1 && (
                                          <button
                                            onClick={() => {
                                              removeStep(step.id)
                                              setEditingStep(null)
                                            }}
                                            className="inline-flex items-center px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                          >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                          </button>
                                        )}
                                        
                                        <button
                                          onClick={() => setEditingStep(null)}
                                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                          Save Changes
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}

                {/* Add Step Button at End - only show if not read-only */}
                {canAddStep && !readOnly && (
                  <motion.div
                    className="flex justify-center pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: steps.length * 0.1 }}
                  >
                    <button
                      onClick={addStep}
                      className="inline-flex items-center px-6 py-4 border-2 border-dashed border-gray-300 text-lg font-medium rounded-2xl text-gray-700 bg-white hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Email Step ({steps.length}/5)
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {templateApplied ? 'No template steps found' : 'No email steps yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {templateApplied ? 'The template couldn\'t be loaded.' : 
                 readOnly ? 'This campaign has no email sequence steps.' : 'Get started by adding your first email step.'}
              </p>
              {campaignId && !readOnly && (
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={handleManualReload}
                    className="px-6 py-3 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Reload Steps
                  </button>
                  <span className="text-gray-400">or</span>
                  <button
                    onClick={addStep}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
                  >
                    Add First Step
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Email Preview Modal */}
      {previewingStep && (
        <EmailPreview 
          step={previewingStep} 
          onClose={() => setPreviewingStep(null)} 
        />
      )}

      {/* Validation Messages - only show if not read-only */}
      {!isValidSequence && steps.length > 0 && !readOnly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
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