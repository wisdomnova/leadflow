// ./store/useSequenceStore.ts
import { create } from 'zustand'
import { SequenceStep } from '@/lib/template-variables'

interface SequenceStore {
  steps: SequenceStep[]
  currentStep: number
  isLoading: boolean
  error: string | null
    
  // Actions
  addStep: () => void
  addStepAtIndex: (step: SequenceStep, index: number) => void
  removeStep: (stepId: string) => void
  updateStep: (stepId: string, updates: Partial<SequenceStep>) => void
  reorderSteps: (startIndex: number, endIndex: number) => void
  setSteps: (steps: SequenceStep[]) => void
  resetSequence: () => void
  setCurrentStep: (step: number) => void 
  
  // API actions
  saveSequence: (campaignId: string) => Promise<void>
  loadSequence: (campaignId: string) => Promise<void>
}

export const useSequenceStore = create<SequenceStore>((set, get) => ({
  steps: [],
  currentStep: 0,
  isLoading: false,
  error: null, 

  addStep: () => {
    const { steps } = get()
    if (steps.length >= 5) {
      set({ error: 'Maximum 5 steps allowed' })
      return
    }

    const newStep: SequenceStep = {
      id: `step-${Date.now()}`,
      stepNumber: steps.length + 1,
      name: `Step ${steps.length + 1}`,
      subject: '',
      content: '',
      delayAmount: steps.length === 0 ? 0 : 1,
      delayUnit: steps.length === 0 ? 'hours' : 'days'
    }

    set({ 
      steps: [...steps, newStep],
      error: null 
    })
  },

  addStepAtIndex: (newStep: SequenceStep, index: number) => {
    const { steps } = get()
    if (steps.length >= 5) {
      set({ error: 'Maximum 5 steps allowed' })
      return
    }

    // Create a copy of the steps array
    const updatedSteps = [...steps]
    
    // Insert the new step at the specified index
    updatedSteps.splice(index, 0, newStep)
    
    // Update step numbers and names for all steps
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      stepNumber: i + 1,
      name: step.name.includes('Step ') ? `Step ${i + 1}` : step.name
    }))

    set({ 
      steps: reorderedSteps,
      error: null 
    })
  },

  removeStep: (stepId: string) => {
    const { steps } = get()
    if (steps.length <= 1) {
      set({ error: 'At least one step is required' })
      return
    }

    const updatedSteps = steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({
        ...step,
        stepNumber: index + 1,
        name: step.name.includes('Step ') ? `Step ${index + 1}` : step.name
      }))

    set({ 
      steps: updatedSteps,
      error: null 
    })
  },

  updateStep: (stepId: string, updates: Partial<SequenceStep>) => {
    const { steps } = get()
    const updatedSteps = steps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    )

    set({ 
      steps: updatedSteps,
      error: null 
    })
  },

  reorderSteps: (startIndex: number, endIndex: number) => {
    const { steps } = get()
    const result = Array.from(steps)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    // Update step numbers
    const reorderedSteps = result.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }))

    set({ steps: reorderedSteps })
  },

  setSteps: (steps: SequenceStep[]) => {
    set({ steps, error: null })
  },

  resetSequence: () => {
    set({ 
      steps: [],
      currentStep: 0,
      error: null 
    })
  },

  setCurrentStep: (step: number) => {
    set({ currentStep: step })
  },

  saveSequence: async (campaignId: string) => {
    const { steps } = get()
    set({ isLoading: true, error: null })

    try {
      console.log('Store: Saving sequence for campaign:', campaignId, 'Steps:', steps.length)

      // Transform steps to match API format
      const transformedSteps = steps.map((step, index) => ({
        subject: step.subject || '',
        content: step.content || '',
        delayDays: step.delayUnit === 'days' ? (step.delayAmount || 0) : 0,
        delayHours: step.delayUnit === 'hours' ? (step.delayAmount || 0) : 0,
        orderIndex: index
      }))

      // Use PUT method to replace all steps at once
      const response = await fetch(`/api/campaigns/${campaignId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: transformedSteps })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save sequence')
      }

      const savedSteps = await response.json()
      console.log('Store: Saved steps:', savedSteps)

      set({ isLoading: false })
    } catch (error) {
      console.error('Store: Error saving sequence:', error)
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to save sequence'
      })
      throw error
    }
  },

  loadSequence: async (campaignId: string) => { 
    set({ isLoading: true, error: null })

    try {
      console.log('Store: Loading sequence for campaign:', campaignId)
      
      // Use the steps endpoint
      const response = await fetch(`/api/campaigns/${campaignId}/steps`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load sequence')
      }
      
      const data = await response.json()
      console.log('Store: Loaded sequence data:', data)
      
      // Transform the data from campaign_steps format to SequenceStep format
      const transformedSteps: SequenceStep[] = data.map((step: any, index: number) => ({
        id: step.id ? step.id.toString() : `step-${index}`,
        stepNumber: index + 1,
        name: `Step ${index + 1}`,
        subject: step.subject || '',
        content: step.content || '',
        delayAmount: step.delay_days > 0 ? step.delay_days : (step.delay_hours || 0),
        delayUnit: step.delay_days > 0 ? 'days' : 'hours'
      }))
      
      console.log('Store: Transformed steps:', transformedSteps)
      
      set({ 
        steps: transformedSteps,
        isLoading: false 
      })
    } catch (error) {
      console.error('Store: Error loading sequence:', error)
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load sequence'
      })
    }
  }
}))