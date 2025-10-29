// ./components/campaigns/SequenceBuilder.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSequenceStore } from '@/store/useSequenceStore'
import { Plus, Save, AlertCircle, CheckCircle, Clock, Mail, Edit2, Eye, Smartphone, Monitor, GripVertical, Trash2, X, Play, Settings, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TemplateVariablePicker from './TemplateVariablePicker'

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

interface SequenceBuilderProps {  
  campaignId?: string 
  onSave?: () => void 
  templateApplied?: boolean
  readOnly?: boolean
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
        className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-xl w-full h-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-200"
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
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'desktop' 
                      ? 'bg-white text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={viewMode === 'desktop' ? { backgroundColor: THEME_COLORS.primary } : {}}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'mobile' 
                      ? 'bg-white text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={viewMode === 'mobile' ? { backgroundColor: THEME_COLORS.primary } : {}}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            <div className="flex justify-center">
              <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-300 ${
                viewMode === 'desktop' ? 'max-w-2xl w-full' : 'max-w-sm w-full'
              }`}>
                {/* Email Header */}
                <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
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
                <div className="border-t border-gray-100 p-4 bg-gray-50 text-center rounded-b-2xl">
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
                className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md font-medium transition-all duration-200"
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
  readOnly = false
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
  
  // Add button loading states
  const [buttonLoading, setButtonLoading] = useState<Record<string, boolean>>({})

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

  const handleAddStep = async () => {
    if (readOnly || steps.length >= 5) return
    
    setButtonLoading(prev => ({ ...prev, addStep: true }))
    
    try {
      await addStep()
    } catch (error) {
      console.error('Failed to add step:', error)
    } finally {
      setButtonLoading(prev => ({ ...prev, addStep: false }))
    }
  }

  const handleAddStepAtIndexWithLoading = async (index: number) => {
    if (readOnly) return
    
    setButtonLoading(prev => ({ ...prev, [`addStepAt_${index}`]: true }))
    
    try {
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

      if (addStepAtIndex) {
        await addStepAtIndex(newStep, index)
      } else {
        await addStep()
      }
    } catch (error) {
      console.error('Failed to add step:', error)
    } finally {
      setButtonLoading(prev => ({ ...prev, [`addStepAt_${index}`]: false }))
    }
  }

  const handleRemoveStep = async (stepId: string) => {
    if (readOnly) return
    
    setButtonLoading(prev => ({ ...prev, [`remove_${stepId}`]: true }))
    
    try {
      await removeStep(stepId)
      setEditingStep(null)
    } catch (error) {
      console.error('Failed to remove step:', error)
    } finally {
      setButtonLoading(prev => ({ ...prev, [`remove_${stepId}`]: false }))
    }
  }

  const handleUpdateStep = async (stepId: string, updates: any) => {
    if (readOnly) return
    
    try {
      await updateStep(stepId, updates)
    } catch (error) {
      console.error('Failed to update step:', error)
    }
  }

  const handleManualReload = async () => {
    if (!campaignId) return
    
    setButtonLoading(prev => ({ ...prev, reload: true }))
    
    try {
      await loadSequence(campaignId)
    } catch (error) {
      console.error('Failed to reload sequence:', error)
    } finally {
      setButtonLoading(prev => ({ ...prev, reload: false }))
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

    if (addStepAtIndex) {
      addStepAtIndex(newStep, index)
    } else {
      addStep()
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
        
        setTimeout(() => {
          if (element && 'selectionStart' in element) {
            element.selectionStart = element.selectionEnd = start + variable.length
            element.focus()
          }
        }, 0)
      } else {
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: THEME_COLORS.primary }}></div>
            <p className="text-gray-600 mb-4">Loading template steps...</p>
            {!readOnly && (
              <button
                onClick={handleManualReload}
                className="text-sm hover:underline transition-colors"
                style={{ color: THEME_COLORS.primary }}
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
          className="bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mr-4 shadow-md"
              style={{ backgroundColor: THEME_COLORS.warning }}
            >
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-gray-800 font-semibold text-lg">Read-Only Mode</p>
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
          <h2 className="text-3xl font-bold text-gray-900">Email Sequence</h2>
          <p className="text-gray-600 mt-1 text-lg">
            {readOnly ? 'View your automated email sequence' : 'Build your automated email sequence'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Save Status */}
          {saveSuccess && (
            <motion.div 
              className="flex items-center text-sm font-medium px-4 py-2 rounded-xl shadow-md"
              style={{ 
                color: THEME_COLORS.success,
                backgroundColor: `${THEME_COLORS.success}20`
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved successfully
            </motion.div>
          )}

          {/* Save Button */}
          {campaignId && !readOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving || !isValidSequence}
              className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ 
                backgroundColor: THEME_COLORS.primary
              }}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Sequence'}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div 
          className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mr-4 shadow-md"
              style={{ backgroundColor: THEME_COLORS.warning }}
            >
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Sequence</h3>
              <div className="text-gray-700 mb-3">{error}</div>
              {campaignId && !readOnly && (
                <button
                  onClick={handleManualReload}
                  className="text-sm font-medium hover:underline transition-colors"
                  style={{ color: THEME_COLORS.primary }}
                >
                  Try reloading
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {shouldShowLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mr-3" style={{ borderColor: THEME_COLORS.primary }}></div>
          <span className="text-gray-600 text-lg">Loading sequence...</span>
        </div>
      )}

      {/* Sequence Timeline */}
      {!shouldShowLoading && (
        <div className="space-y-6">
          {steps.length > 0 ? (
            <>
              {/* Step Cards */}
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step.id}>
                    {/* Add Step Button Between Steps */}
                    {index > 0 && canAddStep && !readOnly && (
                      <div className="flex justify-center py-3">
                        <button
                          onClick={() => handleAddStepAtIndexWithLoading(index)}
                          disabled={buttonLoading[`addStepAt_${index}`]}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl border-2 border-dashed border-gray-300 text-gray-600 bg-white hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {buttonLoading[`addStepAt_${index}`] ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          {buttonLoading[`addStepAt_${index}`] ? 'Adding...' : 'Add step here'}
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
                        <div 
                          className="absolute -top-6 left-8 w-0.5 h-6 rounded-full"
                          style={{ backgroundColor: THEME_COLORS.primary }}
                        ></div>
                      )}

                      {/* Step Card */}
                      <div className={`bg-white border border-gray-200 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden ${
                        !readOnly ? 'hover:border-gray-300 hover:shadow-xl group-hover:scale-[1.02]' : ''
                      }`}>
                        <div className="p-6">
                          <div className="flex items-start space-x-4">
                            {/* Drag Handle */}
                            {!readOnly && (
                              <div className="flex-shrink-0 cursor-move pt-1">
                                <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                              </div>
                            )}

                            {/* Step Number */}
                            <div className="flex-shrink-0">
                              <div 
                                className="w-16 h-16 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg"
                                style={{ 
                                  background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`
                                }}
                              >
                                {index + 1}
                              </div>
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {step.name || `Email ${index + 1}`}
                                  </h3>
                                  
                                  {/* Wait Time Display */}
                                  <div 
                                    className="flex items-center text-sm font-medium text-white px-3 py-1.5 rounded-xl shadow-sm"
                                    style={{ backgroundColor: THEME_COLORS.accent }}
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    {step.delayAmount === 0 ? 'Send immediately' : `${step.delayAmount} ${step.delayUnit}`}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setPreviewingStep(step)}
                                    className={`transition-all p-2 hover:bg-gray-100 rounded-xl ${
                                      readOnly ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                    title="Preview email"
                                  >
                                    <Eye className="h-5 w-5 text-gray-500" />
                                  </button>
                                  {!readOnly && (
                                    <button
                                      onClick={() => setEditingStep(editingStep === step.id ? null : step.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-gray-100 rounded-xl"
                                      title="Edit step"
                                    >
                                      <Edit2 className="h-5 w-5 text-gray-500" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Subject Preview */}
                              <div className="mb-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-semibold text-gray-700">Subject:</span>
                                </div>
                                <p className="text-gray-900 font-medium text-lg">
                                  {step.subject || (
                                    <span className="text-gray-500 italic">No subject set</span>
                                  )}
                                </p>
                              </div>

                              {/* Content Preview */}
                              <div>
                                <span className="text-sm font-semibold text-gray-700 mb-2 block">Content Preview:</span>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                  <p className="text-gray-700 leading-relaxed line-clamp-3">
                                    {step.content ? 
                                      step.content.substring(0, 180) + (step.content.length > 180 ? '...' : '') : 
                                      <span className="text-gray-500 italic">No content set</span>
                                    }
                                  </p>
                                </div>
                              </div>

                              {/* Edit Form */}
                              <AnimatePresence>
                                {editingStep === step.id && !readOnly && (
                                  <motion.div
                                    className="mt-6 pt-6 border-t border-gray-200"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                  >
                                    <div className="space-y-6">
                                      {/* Timing Controls */}
                                      <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                          Send Timing
                                        </label>
                                        <select
                                          value={getDelayValue(step)}
                                          onChange={(e) => handleDelayChange(step.id, e.target.value)}
                                          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-white shadow-sm focus:ring-2 focus:border-transparent transition-all duration-200"
                                          style={{ 
                                            '--tw-ring-color': THEME_COLORS.primary
                                          } as any}
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

                                      {/* Subject */}
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <label className="block text-sm font-semibold text-gray-700">
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
                                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-gray-900 focus:ring-2 focus:border-transparent transition-all duration-200"
                                          style={{ 
                                            '--tw-ring-color': THEME_COLORS.primary
                                          } as any}
                                        />
                                      </div>

                                      {/* Content */}
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <label className="block text-sm font-semibold text-gray-700">
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
                                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-gray-900 focus:ring-2 focus:border-transparent resize-vertical transition-all duration-200"
                                          style={{ 
                                            '--tw-ring-color': THEME_COLORS.primary
                                          } as any}
                                        />
                                      </div>

                                      {/* Actions */}
                                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <button
                                          onClick={() => setEditingStep(null)}
                                          className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
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
                                              className="inline-flex items-center px-4 py-3 border border-transparent rounded-xl text-sm font-medium text-white hover:shadow-lg transition-all duration-200"
                                              style={{ backgroundColor: THEME_COLORS.warning }}
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete
                                            </button>
                                          )}
                                          
                                          <button
                                            onClick={() => setEditingStep(null)}
                                            className="px-6 py-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                                            style={{ backgroundColor: THEME_COLORS.primary }}
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
                      </div>
                    </motion.div>
                  </div>
                ))}

                {/* Add Step Button at End */}
                {canAddStep && !readOnly && (
                  <motion.div
                    className="flex justify-center pt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: steps.length * 0.1 }}
                  >
                    <button
                      onClick={handleAddStep}
                      disabled={buttonLoading.addStep}
                      className="inline-flex items-center px-8 py-6 border-2 border-dashed border-gray-300 text-lg font-semibold rounded-2xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{}}
                      onMouseEnter={(e) => {
                        if (!buttonLoading.addStep) {
                          e.currentTarget.style.borderColor = THEME_COLORS.primary
                          e.currentTarget.style.color = THEME_COLORS.primary
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!buttonLoading.addStep) {
                          e.currentTarget.style.borderColor = '#d1d5db'
                          e.currentTarget.style.color = '#374151'
                        }
                      }}
                    >
                      {buttonLoading.addStep ? (
                        <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                      ) : (
                        <Plus className="h-6 w-6 mr-3" />
                      )}
                      {buttonLoading.addStep ? 'Adding Step...' : `Add Email Step (${steps.length}/5)`}
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
              >
                <Mail className="h-10 w-10" style={{ color: THEME_COLORS.primary }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {templateApplied ? 'No template steps found' : 'No email steps yet'}
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {templateApplied ? 'The template couldn\'t be loaded.' : 
                 readOnly ? 'This campaign has no email sequence steps.' : 'Get started by adding your first email step.'}
              </p>
              {campaignId && !readOnly && (
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={handleManualReload}
                    disabled={buttonLoading.reload}
                    className="px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 hover:shadow-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {buttonLoading.reload ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                    ) : null}
                    {buttonLoading.reload ? 'Reloading...' : 'Reload Steps'}
                  </button>
                  <span className="text-gray-400 text-lg">or</span>
                  <button
                    onClick={handleAddStep}
                    disabled={buttonLoading.addStep}
                    className="inline-flex items-center px-8 py-3 text-white rounded-xl hover:shadow-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    {buttonLoading.addStep ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {buttonLoading.addStep ? 'Adding...' : 'Add First Step'}
                  </button>
                </div>
              )}
            </motion.div>
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

      {/* Validation Messages */}
      {!isValidSequence && steps.length > 0 && !readOnly && (
        <motion.div 
          className="bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mr-4 shadow-md"
              style={{ backgroundColor: THEME_COLORS.warning }}
            >
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Incomplete Steps
              </h3>
              <div className="text-gray-700">
                Please fill in the subject line and content for all email steps.
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}