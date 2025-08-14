import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Contact {
  id: string
  organization_id: string
  email: string
  first_name: string | null
  last_name: string | null
  company: string | null
  job_title: string | null
  phone: string | null
  status: 'active' | 'unsubscribed' | 'bounced'
  tags: string[]
  custom_fields: Record<string, any>
  created_at: string
  updated_at: string
}

interface ImportResult {
  success: number
  errors: number
  duplicates: number
  details: string[]
}

interface ContactState {
  contacts: Contact[]
  loading: boolean
  importing: boolean
  searchQuery: string
  statusFilter: string
  tagFilter: string
  totalCount: number
  currentPage: number
  pageSize: number
  
  // Actions
  fetchContacts: () => Promise<void>
  searchContacts: (query: string) => void
  filterByStatus: (status: string) => void
  filterByTag: (tag: string) => void
  importContacts: (file: File) => Promise<ImportResult>
  deleteContact: (id: string) => Promise<void>
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>
  setPage: (page: number) => void
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  loading: false,
  importing: false,
  searchQuery: '',
  statusFilter: 'all',
  tagFilter: 'all',
  totalCount: 0,
  currentPage: 1,
  pageSize: 50,

  fetchContacts: async () => {
    try {
      set({ loading: true })
      
      const { searchQuery, statusFilter, tagFilter, currentPage, pageSize } = get()
      const offset = (currentPage - 1) * pageSize

      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      // Apply filters
      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (tagFilter !== 'all') {
        query = query.contains('tags', [tagFilter])
      }

      const { data: contacts, error, count } = await query

      if (error) throw error

      set({ 
        contacts: contacts || [], 
        totalCount: count || 0,
        loading: false 
      })

    } catch (error) {
      console.error('Failed to fetch contacts:', error)
      set({ loading: false })
    }
  },

  searchContacts: (query: string) => {
    set({ searchQuery: query, currentPage: 1 })
    get().fetchContacts()
  },

  filterByStatus: (status: string) => {
    set({ statusFilter: status, currentPage: 1 })
    get().fetchContacts()
  },

  filterByTag: (tag: string) => {
    set({ tagFilter: tag, currentPage: 1 })
    get().fetchContacts()
  },

  setPage: (page: number) => {
    set({ currentPage: page })
    get().fetchContacts()
  },

  importContacts: async (file: File) => {
    try {
      set({ importing: true })

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result = await response.json()
      
      // Refresh contacts after import
      await get().fetchContacts()
      
      set({ importing: false })
      return result

    } catch (error) {
      console.error('Import failed:', error)
      set({ importing: false })
      throw error
    }
  },

  deleteContact: async (id: string) => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      // Remove from local state
      const { contacts } = get()
      set({ contacts: contacts.filter(c => c.id !== id) })

    } catch (error) {
      console.error('Delete failed:', error)
      throw error
    }
  },

  updateContact: async (id: string, data: Partial<Contact>) => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Update failed')
      }

      const updatedContact = await response.json()

      // Update local state
      const { contacts } = get()
      set({ 
        contacts: contacts.map(c => c.id === id ? updatedContact : c)
      })

    } catch (error) {
      console.error('Update failed:', error)
      throw error
    }
  }
}))