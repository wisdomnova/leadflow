// ./components/campaigns/EmailStepEditor.tsx
'use client'

import { useState, useRef } from 'react'
import { SequenceStep } from '@/lib/template-variables'
import { Clock, Eye, Trash2, GripVertical } from 'lucide-react'
import TemplateVariablePicker from './TemplateVariablePicker'
import EmailPreview from './EmailPreview'

interface EmailStepEditorProps {
  step: SequenceStep
  stepIndex: number
  totalSteps: number
  onUpdate: (stepId: string, updates: Partial<SequenceStep>) => void
  onRemove: (stepId: string) => void
  onDragStart?: (index: number) => void
  onDragOver?: (index: number) => void
  onDrop?: (index: number) => void 
  customFields?: string[]
}

export default function EmailStepEditor({
  step,
  stepIndex,
  totalSteps,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  customFields = []
}: EmailStepEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'content' | null>(null)
  const [cursorPosition, setCursorPosition] = useState<{ start: number; end: number } | null>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const handleSubjectChange = (value: string) => {
    onUpdate(step.id, { subject: value })
  }

  const handleContentChange = (value: string) => {
    onUpdate(step.id, { content: value })
  }

  const handleNameChange = (value: string) => {
    onUpdate(step.id, { name: value })
  }

  const handleDelayChange = (amount: number, unit: 'hours' | 'days') => {
    onUpdate(step.id, { delayAmount: amount, delayUnit: unit })
  }

  // Track focus and cursor position
  const handleSubjectFocus = () => {
    setLastFocusedField('subject')
  }

  const handleContentFocus = () => {
    setLastFocusedField('content')
  }

  const handleSubjectClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    setCursorPosition({ start: input.selectionStart || 0, end: input.selectionEnd || 0 })
  }

  const handleContentClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    setCursorPosition({ start: textarea.selectionStart || 0, end: textarea.selectionEnd || 0 })
  }

  const handleSubjectKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    setCursorPosition({ start: input.selectionStart || 0, end: input.selectionEnd || 0 })
  }

  const handleContentKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    setCursorPosition({ start: textarea.selectionStart || 0, end: textarea.selectionEnd || 0 })
  }

  const insertVariable = (variable: string) => {
    console.log('Inserting variable:', variable)
    console.log('Last focused field:', lastFocusedField)
    console.log('Cursor position:', cursorPosition)

    // Determine which field to insert into
    let targetField = lastFocusedField
    
    // If no field was focused, default to subject
    if (!targetField) {
      targetField = 'subject'
    }

    if (targetField === 'subject') {
      const input = subjectRef.current!
      const start = cursorPosition?.start ?? step.subject.length
      const end = cursorPosition?.end ?? step.subject.length
      
      const newValue = step.subject.substring(0, start) + variable + step.subject.substring(end)
      handleSubjectChange(newValue)
      
      // Focus and set cursor position after variable
      setTimeout(() => {
        input.focus()
        const newPosition = start + variable.length
        input.setSelectionRange(newPosition, newPosition)
        setCursorPosition({ start: newPosition, end: newPosition })
      }, 0)
      
    } else if (targetField === 'content') {
      const textarea = contentRef.current!
      const start = cursorPosition?.start ?? step.content.length
      const end = cursorPosition?.end ?? step.content.length
      
      const newValue = step.content.substring(0, start) + variable + step.content.substring(end)
      handleContentChange(newValue)
      
      // Focus and set cursor position after variable
      setTimeout(() => {
        textarea.focus()
        const newPosition = start + variable.length
        textarea.setSelectionRange(newPosition, newPosition)
        setCursorPosition({ start: newPosition, end: newPosition })
      }, 0)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(stepIndex)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOver?.(stepIndex)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onDrop?.(stepIndex)
  }

  return (
    <>
      <div 
        className={`bg-white rounded-lg border-2 transition-all duration-200 ${
          isDragging ? 'border-blue-300 shadow-lg opacity-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Step Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div 
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                {stepIndex + 1}
              </div>
              <input
                type="text"
                value={step.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="font-medium text-black bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
                placeholder="Step name"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Preview email"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            {totalSteps > 1 && (
              <button
                onClick={() => onRemove(step.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove step"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Delay Settings (only show if not first step) */}
        {stepIndex > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Wait</span>
              
              <select
                value={step.delayAmount}
                onChange={(e) => handleDelayChange(Number(e.target.value), step.delayUnit)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: step.delayUnit === 'hours' ? 24 : 30 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              
              <select
                value={step.delayUnit}
                onChange={(e) => handleDelayChange(step.delayAmount, e.target.value as 'hours' | 'days')}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="hours">hours</option>
                <option value="days">days</option>
              </select>
              
              <span className="text-sm text-gray-600">before sending this email</span>
            </div>
          </div>
        )}

        {/* Email Content */}
        <div className="p-4 space-y-4">
          {/* Subject Line */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Subject Line
                {lastFocusedField === 'subject' && (
                  <span className="ml-2 text-xs text-blue-600">(Click Insert Variable to add here)</span>
                )}
              </label>
              <TemplateVariablePicker 
                onInsert={insertVariable}
                customFields={customFields}
              />
            </div>
            <input
              ref={subjectRef}
              type="text"
              value={step.subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              onFocus={handleSubjectFocus}
              onClick={handleSubjectClick}
              onKeyUp={handleSubjectKeyUp}
              placeholder="Enter email subject..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Email Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Content
              {lastFocusedField === 'content' && (
                <span className="ml-2 text-xs text-blue-600">(Click Insert Variable to add here)</span>
              )}
            </label>
            <textarea
              ref={contentRef}
              value={step.content}
              onChange={(e) => handleContentChange(e.target.value)}
              onFocus={handleContentFocus}
              onClick={handleContentClick}
              onKeyUp={handleContentKeyUp}
              placeholder="Write your email content here..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
          </div>
        </div>
      </div>

      {/* Email Preview Modal */}
      {showPreview && (
        <EmailPreview
          step={step}
          onClose={() => setShowPreview(false)}
          customFields={customFields}
        />
      )}
    </>
  )
}