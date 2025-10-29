'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Save, Info } from 'lucide-react'
import { VariableProcessor } from '@/lib/variable-processor'

interface VariableManagerProps {
  campaignId: string
  emailContent?: string
  onVariablesChange?: (variables: Record<string, string>) => void
}

export default function VariableManager({ 
  campaignId, 
  emailContent,
  onVariablesChange 
}: VariableManagerProps) {
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [newVariableKey, setNewVariableKey] = useState('')
  const [newVariableValue, setNewVariableValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [detectedVariables, setDetectedVariables] = useState<{
    contactVariables: string[]
    campaignVariables: string[]
    unknownVariables: string[]
  }>({
    contactVariables: [],
    campaignVariables: [],
    unknownVariables: []
  })

  useEffect(() => {
    fetchVariables()
  }, [campaignId])

  useEffect(() => {
    if (emailContent) {
      const extracted = VariableProcessor.extractVariables(emailContent)
      const categorized = VariableProcessor.categorizeVariables(extracted)
      setDetectedVariables(categorized)
    }
  }, [emailContent])

  const fetchVariables = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/variables`)
      if (response.ok) {
        const data = await response.json()
        setVariables(data.variables || {})
      }
    } catch (error) {
      console.error('Error fetching variables:', error)
    }
  }

  const saveVariables = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/variables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables })
      })

      if (response.ok) {
        const data = await response.json()
        setVariables(data.variables)
        onVariablesChange?.(data.variables)
        alert('✅ Variables saved successfully!')
      } else {
        throw new Error('Failed to save variables')
      }
    } catch (error) {
      console.error('Error saving variables:', error)
      alert('❌ Failed to save variables')
    } finally {
      setLoading(false)
    }
  }

  const addVariable = () => {
    if (newVariableKey && newVariableValue) {
      setVariables(prev => ({
        ...prev,
        [newVariableKey]: newVariableValue
      }))
      setNewVariableKey('')
      setNewVariableValue('')
    }
  }

  const removeVariable = (key: string) => {
    setVariables(prev => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }

  const updateVariable = (key: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const availableVariables = VariableProcessor.getAvailableVariables()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Variables</h3>
        <p className="text-sm text-gray-600">
          Manage variables used in your email templates. Contact variables are automatically filled, 
          campaign variables need to be defined here.
        </p>
      </div>

      {/* Detected Variables Info */}
      {emailContent && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Variables Found in Email Content</h4>
              <div className="space-y-2">
                {detectedVariables.contactVariables.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-blue-800">Contact Variables (auto-filled): </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detectedVariables.contactVariables.map(variable => (
                        <Badge key={variable} variant="secondary" className="bg-green-100 text-green-800">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {detectedVariables.campaignVariables.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-blue-800">Campaign Variables (define below): </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detectedVariables.campaignVariables.map(variable => (
                        <Badge key={variable} variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {detectedVariables.unknownVariables.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-blue-800">Unknown Variables (will show as-is): </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detectedVariables.unknownVariables.map(variable => (
                        <Badge key={variable} variant="secondary" className="bg-gray-100 text-gray-800">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Current Variables */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-4">Current Campaign Variables</h4>
        
        {Object.keys(variables).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No campaign variables defined yet. Add some below.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(variables).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{`{{${key}}}`}</Label>
                  <Input
                    value={value}
                    onChange={(e) => updateVariable(key, e.target.value)}
                    placeholder={`Value for ${key}`}
                    className="mt-1"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariable(key)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add New Variable */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-4">Add New Variable</h4>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-sm font-medium">Variable Name</Label>
            <Input
              value={newVariableKey}
              onChange={(e) => setNewVariableKey(e.target.value)}
              placeholder="e.g., company_name"
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">Value</Label>
            <Input
              value={newVariableValue}
              onChange={(e) => setNewVariableValue(e.target.value)}
              placeholder="e.g., LeadFlow"
              className="mt-1"
            />
          </div>
          <Button onClick={addVariable} disabled={!newVariableKey || !newVariableValue}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </Card>

      {/* Available Variables Reference */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-4">Available Variables Reference</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Contact Variables (Auto-filled)</h5>
            <div className="space-y-1">
              {availableVariables.contact.map(({ variable, description }) => (
                <div key={variable} className="text-xs">
                  <code className="bg-gray-100 px-2 py-1 rounded">{`{{${variable}}}`}</code>
                  <span className="text-gray-600 ml-2">{description}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Common Campaign Variables</h5>
            <div className="space-y-1">
              {availableVariables.campaign.map(({ variable, description }) => (
                <div key={variable} className="text-xs">
                  <code className="bg-gray-100 px-2 py-1 rounded">{`{{${variable}}}`}</code>
                  <span className="text-gray-600 ml-2">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveVariables} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Variables'}
        </Button>
      </div>
    </div>
  )
}
