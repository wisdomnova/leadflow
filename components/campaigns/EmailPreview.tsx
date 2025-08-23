// ./components/campaigns/EmailPreview.tsx
'use client'

import { useState } from 'react'
import { SequenceStep, replaceTemplateVariables } from '@/lib/template-variables'
import { X, Smartphone, Monitor } from 'lucide-react'

interface EmailPreviewProps {
  step: SequenceStep
  onClose: () => void
  customFields?: string[]
}

const SAMPLE_CONTACT = {
  first_name: 'John',
  last_name: 'Smith',
  company: 'Acme Corporation',
  email: 'john.smith@acme.com',
  phone: '+1 (555) 123-4567'
}

export default function EmailPreview({ step, onClose, customFields = [] }: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

  const previewSubject = replaceTemplateVariables(step.subject, SAMPLE_CONTACT)
  const previewContent = replaceTemplateVariables(step.content, SAMPLE_CONTACT)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Email Preview</h2>
            <span className="text-sm text-gray-500">
              {step.name} - Using sample data
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'desktop' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Desktop view"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'mobile' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Mobile view"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className={`mx-auto transition-all duration-300 ${
            viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
          }`}>
            {/* Email Header */}
            <div className="bg-gray-50 border border-gray-200 rounded-t-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>From: your-email@leadflow.com</span>
                <span>To: {SAMPLE_CONTACT.email}</span>
              </div>
              <div className="mt-2">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {previewSubject || 'No subject'}
                </h3>
              </div>
            </div>

            {/* Email Body */}
            <div className="bg-white border-x border-b border-gray-200 rounded-b-lg p-6">
              <div className="prose prose-sm max-w-none">
                {previewContent ? (
                  <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                    {previewContent}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    No content to preview
                  </div>
                )}
              </div>
              
              {/* Unsubscribe footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <p>
                  You received this email because you're subscribed to our mailing list.
                  <br />
                  <a href="#" className="text-blue-600 hover:underline">
                    Unsubscribe
                  </a> | <a href="#" className="text-blue-600 hover:underline">
                    Update preferences
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Preview shows how the email will look with sample contact data
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}