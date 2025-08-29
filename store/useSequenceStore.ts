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
      const response = await fetch(`/api/campaigns/${campaignId}/sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps })
      })

      if (!response.ok) {
        throw new Error('Failed to save sequence')
      }

      set({ isLoading: false })
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to save sequence'
      })
    }
  },

  loadSequence: async (campaignId: string) => { 
    set({ isLoading: true, error: null })

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/sequence`)
      
      if (!response.ok) {
        throw new Error('Failed to load sequence')
      }

      const { steps } = await response.json()
      set({ 
        steps: steps || [],
        isLoading: false 
      })
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load sequence'
      })
    }
  }
}))