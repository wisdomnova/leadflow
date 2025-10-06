// ./components/campaigns/TemplateVariablePicker.tsx
'use client'

import { useState } from 'react'
import { BUILT_IN_VARIABLES } from '@/lib/template-variables'
import { Code, ChevronDown, User, Building, Mail, Phone, Hash } from 'lucide-react'

interface TemplateVariablePickerProps {
  onInsert: (variable: string) => void
  customFields?: string[]
}

export default function TemplateVariablePicker({ 
  onInsert, 
  customFields = [] 
}: TemplateVariablePickerProps) { 
  const [isOpen, setIsOpen] = useState(false) 

  const getVariableIcon = (key: string) => {
    switch (key) {
      case 'first_name':
      case 'last_name':
        return <User className="h-4 w-4" />
      case 'company':
        return <Building className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'phone':
        return <Phone className="h-4 w-4" />
      default:
        return <Hash className="h-4 w-4" />
    }
  }

  const handleInsert = (variable: string) => {
    onInsert(`{{ ${variable} }}`)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Code className="h-4 w-4 mr-2" />
        Insert Variable
        <ChevronDown className="h-4 w-4 ml-1" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-72 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Built-in Variables
              </div>
              
              {BUILT_IN_VARIABLES.map((variable) => (
                <button
                  key={variable.key}
                  onClick={() => handleInsert(variable.key)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-start space-x-3"
                >
                  <div className="flex-shrink-0 mt-0.5 text-gray-400">
                    {getVariableIcon(variable.key)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {variable.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {variable.description}
                    </div>
                    <div className="text-xs text-blue-600 font-mono">
                      {`{{ ${variable.key} }}`}
                    </div>
                  </div>
                </button>
              ))}

              {customFields.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 border-t border-gray-100 mt-1">
                    Custom Fields
                  </div>
                  
                  {customFields.map((field) => (
                    <button
                      key={field}
                      onClick={() => handleInsert(field)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <Hash className="h-4 w-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-blue-600 font-mono">
                          {`{{ ${field} }}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}