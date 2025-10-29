'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Info, Variable } from 'lucide-react'
import { motion } from 'framer-motion'

interface MissingVariable {
  key: string
  found: boolean
  aliases: string[]
  value?: string
}

interface MissingVariablesFormProps {
  missingVariables: MissingVariable[]
  onVariablesChange: (variables: Record<string, string>) => void
  templateName?: string
  fromName?: string // Add fromName prop to pre-fill from_name variable
}

export default function MissingVariablesForm({ 
  missingVariables, 
  onVariablesChange,
  templateName,
  fromName 
}: MissingVariablesFormProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})

  const unfoundVariables = missingVariables.filter(v => !v.found)

  // Pre-fill from_name with provided fromName
  useEffect(() => {
    if (fromName && unfoundVariables.some(v => v.key === 'from_name')) {
      setVariableValues(prev => ({
        ...prev,
        from_name: fromName
      }))
    }
  }, [fromName, unfoundVariables])

  useEffect(() => {
    onVariablesChange(variableValues)
  }, [variableValues, onVariablesChange])

  const handleVariableChange = (key: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const getVariableLabel = (key: string) => {
    const labels: Record<string, string> = {
      'from_name': 'From Name',
      'company_name': 'Company Name',
      'phone_number': 'Phone Number',
      'business_email': 'Business Email',
      'job_title': 'Job Title'
    }
    return labels[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getVariableDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      'from_name': 'This will appear as the sender name in emails (typically your name)',
      'company_name': 'Your company or organization name',
      'phone_number': 'Contact phone number',
      'business_email': 'Business email address',
      'job_title': 'Professional job title or position'
    }
    return descriptions[key] || `Value for {{${key}}} variable`
  }

  if (unfoundVariables.length === 0) {
    return null
  }

  return (
    <motion.div 
      className="mb-8 border border-orange-200 rounded-2xl p-6 bg-orange-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Variable className="w-4 h-4 text-orange-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900 mb-1">
            Missing Template Variables
          </h3>
          <p className="text-sm text-orange-800 mb-4">
            The "{templateName}" template uses variables that aren't in your contact fields. 
            Set static values below, or upload contacts with these fields for dynamic personalization.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {unfoundVariables.map((variable) => (
          <div key={variable.key} className="space-y-2">
            <label className="block text-sm font-medium text-orange-900">
              {getVariableLabel(variable.key)}
              {variable.aliases.length > 0 && (
                <span className="text-xs text-orange-700 ml-2">
                  (also checks: {variable.aliases.join(', ')})
                </span>
              )}
            </label>
            <input
              type="text"
              value={variableValues[variable.key] || ''}
              onChange={(e) => handleVariableChange(variable.key, e.target.value)}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
              placeholder={`Enter value for {{${variable.key}}}`}
            />
            <p className="text-xs text-orange-700">
              {getVariableDescription(variable.key)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-orange-700">
            <p className="mb-1">
              <strong>Static values:</strong> Same text for all contacts (e.g., {'{from_name}'} = "John Smith")
            </p>
            <p>
              <strong>Dynamic values:</strong> Upload contacts with matching field names for personalization (e.g., each contact has their own company name)
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
