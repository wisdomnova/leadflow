// ./store/useCampaignContactsStore.ts
import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { extractVariablesFromText, extractVariablesFromTemplate, getContactFieldMapping, areVariablesEquivalent, VARIABLE_ALIASES } from '@/lib/template-variable-extractor'

const supabase = createClient()

interface Contact {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  company: string | null
  phone: string | null
  custom_fields: Record<string, any> | null
  created_at: string
  updated_at: string
}

interface CampaignContact {
  id: string
  campaign_id: string
  contact_id: string
  email: string
  first_name: string | null
  last_name: string | null
  company: string | null
  phone: string | null
  custom_fields: Record<string, any> | null
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed'
  added_at: string
  contacts?: Contact
}

interface CampaignVariable {
  key: string
  required: boolean
  found: boolean
  aliases: string[]
  sources: string[]  // which steps use this variable
}

interface ImportMapping {
  [csvColumn: string]: string  // csv column -> contact field
}

interface ImportOptions {
  syncWithExisting: boolean
  updateExisting: boolean
  createNewContacts: boolean
}

interface CampaignContactsState {
  // Campaign-specific contacts
  campaignContacts: CampaignContact[]
  loading: boolean
  importing: boolean
  
  // All available contacts for selection
  allContacts: Contact[]
  allContactsLoading: boolean
  
  // Campaign variables analysis
  campaignVariables: CampaignVariable[]
  variablesLoading: boolean
  
  // UI state
  searchQuery: string
  statusFilter: string
  selectedContacts: string[]
  
  // Import state
  importFile: File | null
  csvHeaders: string[]
  csvData: any[]
  importMapping: ImportMapping
  importOptions: ImportOptions
  importPreview: any[]
  
  // Actions
  fetchCampaignContacts: (campaignId: string) => Promise<void>
  fetchAllContacts: () => Promise<void>
  analyzeCampaignVariables: (campaignId: string) => Promise<void>
  
  // Contact management
  addContactToCampaign: (campaignId: string, contactData: Partial<Contact>) => Promise<{ success: boolean, error?: string }>
  addExistingContactsToCampaign: (campaignId: string, contactIds: string[]) => Promise<{ success: boolean, error?: string }>
  removeContactFromCampaign: (campaignContactId: string) => Promise<{ success: boolean, error?: string }>
  updateCampaignContact: (campaignContactId: string, data: Partial<CampaignContact>) => Promise<{ success: boolean, error?: string }>
  
  // CSV Import
  processCSVFile: (file: File) => Promise<{ success: boolean, error?: string }>
  updateImportMapping: (mapping: ImportMapping) => void
  updateImportOptions: (options: Partial<ImportOptions>) => void
  previewImport: () => Promise<{ success: boolean, error?: string }>
  executeImport: (campaignId: string) => Promise<{ success: boolean, imported: number, updated: number, errors: string[], error?: string }>
  
  // Validation
  validateContactForCampaign: (contactData: any, campaignVariables: CampaignVariable[]) => { isValid: boolean, missingFields: string[], warnings: string[] }
  
  // UI actions
  setSearchQuery: (query: string) => void
  setStatusFilter: (status: string) => void
  toggleContactSelection: (contactId: string) => void
  clearSelection: () => void
  reset: () => void
}

export const useCampaignContactsStore = create<CampaignContactsState>((set, get) => ({
  // Initial state
  campaignContacts: [],
  loading: false,
  importing: false,
  allContacts: [],
  allContactsLoading: false,
  campaignVariables: [],
  variablesLoading: false,
  searchQuery: '',
  statusFilter: 'all',
  selectedContacts: [],
  importFile: null,
  csvHeaders: [],
  csvData: [],
  importMapping: {},
  importOptions: {
    syncWithExisting: true,
    updateExisting: true,
    createNewContacts: true
  },
  importPreview: [],

  fetchCampaignContacts: async (campaignId: string) => {
    set({ loading: true })
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaign contacts')
      }
      
      const contacts = await response.json()
      set({ campaignContacts: contacts })
    } catch (error) {
      console.error('Failed to fetch campaign contacts:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchAllContacts: async () => {
    set({ allContactsLoading: true })
    
    try {
      const response = await fetch('/api/contacts')
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }
      
      const contacts = await response.json()
      set({ allContacts: contacts })
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      set({ allContactsLoading: false })
    }
  },

  analyzeCampaignVariables: async (campaignId: string) => {
    set({ variablesLoading: true })
    
    try {
      // Get campaign steps to analyze variables
      const response = await fetch(`/api/campaigns/${campaignId}/steps`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaign steps')
      }
      
      const steps = await response.json()
      const allVariables: string[] = []
      const variableSources: Record<string, string[]> = {}
      
      // Extract variables from all steps
      steps.forEach((step: any) => {
        const stepVars: string[] = []
        
        if (step.subject) {
          const subjectVars = extractVariablesFromText(step.subject)
          stepVars.push(...subjectVars)
          allVariables.push(...subjectVars)
        }
        
        if (step.content) {
          const contentVars = extractVariablesFromText(step.content)
          stepVars.push(...contentVars)
          allVariables.push(...contentVars)
        }
        
        // Track which steps use each variable
        stepVars.forEach(variable => {
          if (!variableSources[variable]) {
            variableSources[variable] = []
          }
          variableSources[variable].push(`Step ${step.step_number || steps.indexOf(step) + 1}`)
        })
      })
      
      // Remove duplicates and analyze
      const uniqueVariables = [...new Set(allVariables)]
      const contactFields = getContactFieldMapping()
      
      const campaignVariables: CampaignVariable[] = uniqueVariables.map(variable => {
        const normalizedVar = variable.toLowerCase()
        
        // Check if variable matches any contact field or its aliases
        const found = contactFields.some(field => {
          const normalizedField = field.toLowerCase()
          return normalizedField === normalizedVar || 
                 areVariablesEquivalent(normalizedField, normalizedVar)
        })
        
        // Get aliases for this variable
        const aliases = VARIABLE_ALIASES[normalizedVar] || []
        
        return {
          key: variable,
          required: true, // All template variables are considered required
          found,
          aliases,
          sources: variableSources[variable] || []
        }
      })
      
      set({ campaignVariables })
    } catch (error) {
      console.error('Failed to analyze campaign variables:', error)
    } finally {
      set({ variablesLoading: false })
    }
  },

  addContactToCampaign: async (campaignId: string, contactData: Partial<Contact>) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.error || 'Failed to add contact' }
      }
      
      // Refresh campaign contacts
      await get().fetchCampaignContacts(campaignId)
      
      return { success: true }
    } catch (error) {
      console.error('Failed to add contact:', error)
      return { success: false, error: 'Failed to add contact' }
    }
  },

  addExistingContactsToCampaign: async (campaignId: string, contactIds: string[]) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds })
      })
      
      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.error || 'Failed to add contacts' }
      }
      
      // Refresh campaign contacts
      await get().fetchCampaignContacts(campaignId)
      
      return { success: true }
    } catch (error) {
      console.error('Failed to add contacts:', error)
      return { success: false, error: 'Failed to add contacts' }
    }
  },

  removeContactFromCampaign: async (campaignContactId: string) => {
    try {
      const response = await fetch(`/api/campaigns/contacts/${campaignContactId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        return { success: false, error: 'Failed to remove contact' }
      }
      
      // Remove from local state
      set(state => ({
        campaignContacts: state.campaignContacts.filter(c => c.id !== campaignContactId)
      }))
      
      return { success: true }
    } catch (error) {
      console.error('Failed to remove contact:', error)
      return { success: false, error: 'Failed to remove contact' }
    }
  },

  updateCampaignContact: async (campaignContactId: string, data: Partial<CampaignContact>) => {
    try {
      const response = await fetch(`/api/campaigns/contacts/${campaignContactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        return { success: false, error: 'Failed to update contact' }
      }
      
      // Update local state
      set(state => ({
        campaignContacts: state.campaignContacts.map(c => 
          c.id === campaignContactId ? { ...c, ...data } : c
        )
      }))
      
      return { success: true }
    } catch (error) {
      console.error('Failed to update contact:', error)
      return { success: false, error: 'Failed to update contact' }
    }
  },

  processCSVFile: async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        return { success: false, error: 'CSV file is empty' }
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })
      
      // Auto-detect common mappings
      const autoMapping: ImportMapping = {}
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase()
        if (lowerHeader.includes('email') || lowerHeader === 'email') {
          autoMapping[header] = 'email'
        } else if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
          autoMapping[header] = 'first_name'
        } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
          autoMapping[header] = 'last_name'
        } else if (lowerHeader.includes('company') || lowerHeader.includes('organization')) {
          autoMapping[header] = 'company'
        } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile')) {
          autoMapping[header] = 'phone'
        }
      })
      
      set({ 
        importFile: file,
        csvHeaders: headers,
        csvData: data,
        importMapping: autoMapping
      })
      
      return { success: true }
    } catch (error) {
      console.error('Failed to process CSV:', error)
      return { success: false, error: 'Failed to process CSV file' }
    }
  },

  updateImportMapping: (mapping: ImportMapping) => {
    set({ importMapping: mapping })
  },

  updateImportOptions: (options: Partial<ImportOptions>) => {
    set(state => ({
      importOptions: { ...state.importOptions, ...options }
    }))
  },

  previewImport: async () => {
    const { csvData, importMapping, campaignVariables } = get()
    
    try {
      const preview = csvData.slice(0, 10).map((row, index) => {
        const contact: any = { _rowNumber: index + 2 } // +2 for header and 0-based index
        
        Object.entries(importMapping).forEach(([csvCol, contactField]) => {
          contact[contactField] = row[csvCol] || ''
        })
        
        // Validate against campaign variables
        const validation = get().validateContactForCampaign(contact, campaignVariables)
        contact._validation = validation
        
        return contact
      })
      
      set({ importPreview: preview })
      return { success: true }
    } catch (error) {
      console.error('Failed to preview import:', error)
      return { success: false, error: 'Failed to preview import' }
    }
  },

  executeImport: async (campaignId: string) => {
    const { csvData, importMapping, importOptions } = get()
    set({ importing: true })
    
    try {
      const contacts = csvData.map(row => {
        const contact: any = {}
        Object.entries(importMapping).forEach(([csvCol, contactField]) => {
          contact[contactField] = row[csvCol] || ''
        })
        return contact
      })
      
      const response = await fetch(`/api/campaigns/${campaignId}/contacts/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts,
          options: importOptions
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        return { success: false, imported: 0, updated: 0, errors: [], error: error.error || 'Import failed' }
      }
      
      const result = await response.json()
      
      // Refresh campaign contacts
      await get().fetchCampaignContacts(campaignId)
      
      return { 
        success: true, 
        imported: result.imported || 0,
        updated: result.updated || 0,
        errors: result.errors || []
      }
    } catch (error) {
      console.error('Failed to execute import:', error)
      return { success: false, imported: 0, updated: 0, errors: [], error: 'Import failed' }
    } finally {
      set({ importing: false })
    }
  },

  validateContactForCampaign: (contactData: any, campaignVariables: CampaignVariable[]) => {
    const missingFields: string[] = []
    const warnings: string[] = []
    
    // Check required email field
    if (!contactData.email || !contactData.email.trim()) {
      missingFields.push('email')
    }
    
    // Check campaign variables with alias support
    campaignVariables.forEach(variable => {
      if (!variable.required) return
      
      const variableKey = variable.key.toLowerCase()
      let fieldValue = contactData[variable.key] // Direct match first
      
      // If no direct match, check for equivalent fields
      if (!fieldValue || !fieldValue.toString().trim()) {
        const contactFields = Object.keys(contactData)
        const matchingField = contactFields.find(field => 
          areVariablesEquivalent(field.toLowerCase(), variableKey)
        )
        
        if (matchingField) {
          fieldValue = contactData[matchingField]
        }
        
        // Special case for from_name - can be built from first_name + last_name
        if (variableKey === 'from_name' && (!fieldValue || !fieldValue.toString().trim())) {
          const firstName = contactData.first_name || ''
          const lastName = contactData.last_name || ''
          if (firstName.trim() || lastName.trim()) {
            fieldValue = `${firstName} ${lastName}`.trim()
          }
        }
      }
      
      if (!fieldValue || !fieldValue.toString().trim()) {
        missingFields.push(variable.key)
      }
    })
    
    // Common field warnings
    if (!contactData.first_name || !contactData.first_name.trim()) {
      warnings.push('Missing first name - emails may appear less personal')
    }
    
    if (!contactData.last_name || !contactData.last_name.trim()) {
      warnings.push('Missing last name - full name personalization unavailable')
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setStatusFilter: (status: string) => {
    set({ statusFilter: status })
  },

  toggleContactSelection: (contactId: string) => {
    set(state => ({
      selectedContacts: state.selectedContacts.includes(contactId)
        ? state.selectedContacts.filter(id => id !== contactId)
        : [...state.selectedContacts, contactId]
    }))
  },

  clearSelection: () => {
    set({ selectedContacts: [] })
  },

  reset: () => {
    set({
      campaignContacts: [],
      allContacts: [],
      campaignVariables: [],
      searchQuery: '',
      statusFilter: 'all',
      selectedContacts: [],
      importFile: null,
      csvHeaders: [],
      csvData: [],
      importMapping: {},
      importPreview: [],
      loading: false,
      importing: false,
      allContactsLoading: false,
      variablesLoading: false
    })
  }
}))