// ./components/campaigns/ContactSelector.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useContactStore } from '@/store/useContactStore'
import { 
  Users, 
  Search,  
  Upload, 
  Mail,
  Phone,
  Building, 
  CheckCircle,
  X,
  ArrowRight,
  AlertCircle,
  Save,
  FileText,
  UserPlus,
  Sparkles
} from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface ContactSelectorProps {
  campaignId: string
  onContactsSelected: (contactIds: string[]) => void
  selectedContactIds?: string[]
  onSaveAsDraft?: () => void
  onNavigateToContacts?: () => void
  readOnly?: boolean
}

interface NavigationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onSaveAndNavigate: () => void
}

function NavigationModal({ isOpen, onClose, onConfirm, onSaveAndNavigate }: NavigationModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Save className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Save Campaign Progress?</h3>
                <p className="text-sm text-gray-600">You're about to leave the campaign creation</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-700 mb-6">
              Your campaign progress will be saved as a draft so you can continue later. 
              You can always return to complete the setup.
            </p>

            <div className="flex flex-col space-y-3">
              <button
                onClick={onSaveAndNavigate}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft & Go to Contacts
              </button>
              
              <button
                onClick={onConfirm}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Continue Without Saving
              </button>
              
              <button
                onClick={onClose}
                className="w-full text-center px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function ContactSelector({ 
  campaignId, 
  onContactsSelected, 
  selectedContactIds = [],
  onSaveAsDraft,
  onNavigateToContacts,
  readOnly = false
}: ContactSelectorProps) {
  const {
    contacts: allContacts,
    loading,
    fetchContacts
  } = useContactStore()

  const [localSelectedContacts, setLocalSelectedContacts] = useState<string[]>(selectedContactIds)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active') // Default to active contacts
  const [currentPage, setCurrentPage] = useState(1)
  const [showNavigationModal, setShowNavigationModal] = useState(false)
  const pageSize = 50

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Client-side filtering
  const filteredContacts = useMemo(() => {
    let filtered = [...allContacts]

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(contact => 
        contact.first_name?.toLowerCase().includes(query) ||
        contact.last_name?.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.job_title?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.status === statusFilter)
    }

    return filtered
  }, [allContacts, debouncedSearchQuery, statusFilter])

  // Pagination logic
  const totalCount = filteredContacts.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, statusFilter])

  // Initial fetch
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Notify parent when selection changes (only if not read-only)
  useEffect(() => {
    if (!readOnly) {
      onContactsSelected(localSelectedContacts)
    }
  }, [localSelectedContacts, onContactsSelected, readOnly])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
  }

  const handleSelectContact = (contactId: string) => {
    if (readOnly) return
    
    setLocalSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const handleSelectAll = () => {
    if (readOnly) return
    
    const currentPageIds = paginatedContacts.map(c => c.id)
    const allCurrentPageSelected = currentPageIds.every(id => localSelectedContacts.includes(id))
    
    if (allCurrentPageSelected) {
      // Deselect all on current page
      setLocalSelectedContacts(prev => prev.filter(id => !currentPageIds.includes(id)))
    } else {
      // Select all on current page
      setLocalSelectedContacts(prev => {
        const newSelection = [...prev]
        currentPageIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  const handleSelectAllFiltered = () => {
    if (readOnly) return
    
    const allFilteredIds = filteredContacts.map(c => c.id)
    const allFilteredSelected = allFilteredIds.every(id => localSelectedContacts.includes(id))
    
    if (allFilteredSelected) {
      // Deselect all filtered
      setLocalSelectedContacts(prev => prev.filter(id => !allFilteredIds.includes(id)))
    } else {
      // Select all filtered
      setLocalSelectedContacts(prev => {
        const newSelection = [...prev]
        allFilteredIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  const handleNavigateToContacts = () => {
    if (readOnly) {
      // In read-only mode, directly navigate to contacts
      onNavigateToContacts?.()
    } else {
      setShowNavigationModal(true)
    }
  }

  const handleNavigationConfirm = () => {
    setShowNavigationModal(false)
    onNavigateToContacts?.()
  }

  const handleSaveAndNavigate = () => {
    setShowNavigationModal(false)
    onSaveAsDraft?.()
    setTimeout(() => {
      onNavigateToContacts?.()
    }, 500)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
      case 'unsubscribed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Unsubscribed</span>
      case 'bounced':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Bounced</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>
    }
  }

  const currentPageIds = paginatedContacts.map(c => c.id)
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => localSelectedContacts.includes(id))
  const someCurrentPageSelected = currentPageIds.some(id => localSelectedContacts.includes(id))

  if (loading && allContacts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Read-only indicator */}
      {readOnly && (
        <motion.div 
          className="bg-gray-50 border border-gray-200 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-gray-500 mr-3" />
            <div>
              <p className="text-gray-800 font-medium">Read-Only Mode</p>
              <p className="text-gray-600 text-sm mt-1">
                Contact selection cannot be modified while the campaign is active.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {readOnly ? 'Campaign Contacts' : 'Select Contacts'}
          </h2>
          <p className="mt-1 text-gray-600">
            {readOnly 
              ? 'View the contacts assigned to this campaign'
              : 'Choose which contacts will receive this campaign'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {onSaveAsDraft && !readOnly && (
            <button
              onClick={onSaveAsDraft}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Save as Draft
            </button>
          )}
          <button
            onClick={handleNavigateToContacts}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {readOnly ? 'View All Contacts' : 'Import Contacts'}
          </button>
        </div>
      </div>

      {/* Selection Summary */}
      {localSelectedContacts.length > 0 && (
        <motion.div 
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center text-lg font-semibold text-blue-900">
                  <span>{localSelectedContacts.length}</span>
                  <span className="ml-1">
                    {localSelectedContacts.length === 1 ? 'contact' : 'contacts'} {readOnly ? 'assigned' : 'selected'}
                  </span>
                </div>
                <p className="text-blue-700 text-sm">
                  {readOnly ? 'Will receive campaign emails' : 'Ready to receive your campaign emails'}
                </p>
              </div>
            </div>
            {!readOnly && (
              <button
                onClick={() => setLocalSelectedContacts([])}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                title="Clear selection"
              >
                <X className="h-5 w-5 text-blue-400 hover:text-blue-600" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {searchQuery || statusFilter !== 'all' ? 'Filtered' : 'Total'} Contacts
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalCount.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredContacts.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{readOnly ? 'Assigned' : 'Selected'}</p>
              <p className="text-2xl font-bold text-gray-900">{localSelectedContacts.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ready to Send</p>
              <p className="text-2xl font-bold text-gray-900">
                {localSelectedContacts.filter(id => {
                  const contact = allContacts.find(c => c.id === id)
                  return contact?.status === 'active'
                }).length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts by name, email, or company..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 min-w-[140px] transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>
            
            {filteredContacts.length > 0 && !readOnly && (
              <button
                onClick={handleSelectAllFiltered}
                className="inline-flex items-center px-6 py-3 border-2 border-blue-300 rounded-xl text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {filteredContacts.every(c => localSelectedContacts.includes(c.id)) ? 'Deselect' : 'Select'} All Filtered
                <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">
                  {filteredContacts.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Warning for non-active contacts */}
      {localSelectedContacts.some(id => {
        const contact = allContacts.find(c => c.id === id)
        return contact?.status !== 'active'
      }) && (
        <motion.div 
          className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
              <div className="mt-2 text-sm text-yellow-700">
                Some {readOnly ? 'assigned' : 'selected'} contacts are not active (unsubscribed or bounced). They will be skipped during the campaign.
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {filteredContacts.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No contacts found</h3>
          <p className="text-gray-600 mb-8">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : readOnly
                ? 'No contacts are assigned to this campaign'
                : 'Get started by importing your first contacts'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && !readOnly && (
            <button
              onClick={handleNavigateToContacts}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Contacts
            </button>
          )}
        </div>
      ) : (
        /* Contact Table */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={allCurrentPageSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someCurrentPageSelected && !allCurrentPageSelected
                      }}
                      onChange={handleSelectAll}
                      disabled={readOnly}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedContacts.map((contact) => {
                  const isSelected = localSelectedContacts.includes(contact.id)
                  const isActive = contact.status === 'active'
                  
                  return (
                    <tr 
                      key={contact.id} 
                      className={clsx(
                        !readOnly && 'hover:bg-gray-50 cursor-pointer',
                        readOnly && 'cursor-default',
                        'transition-colors',
                        isSelected && 'bg-blue-50',
                        !isActive && 'opacity-60'
                      )}
                      onClick={() => !readOnly && handleSelectContact(contact.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectContact(contact.id)}
                          disabled={readOnly}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className={clsx(
                              "h-12 w-12 rounded-xl flex items-center justify-center",
                              isSelected ? 'bg-blue-100' : 'bg-gray-100'
                            )}>
                              <Users className={clsx(
                                "h-6 w-6",
                                isSelected ? 'text-blue-600' : 'text-gray-600'
                              )} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Mail className="h-3 w-3 mr-1" />
                              {contact.email}
                            </div>
                            {contact.phone && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Phone className="h-3 w-3 mr-1" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.company && (
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-2 text-gray-400" />
                              {contact.company}
                            </div>
                          )}
                          {contact.job_title && (
                            <div className="text-xs text-gray-500 mt-1">
                              {contact.job_title}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(contact.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(endIndex, totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{totalCount}</span> results
                    {localSelectedContacts.length > 0 && (
                      <span className="ml-2 text-blue-600 font-medium">
                        ({localSelectedContacts.length} {readOnly ? 'assigned' : 'selected'})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page = i + 1
                      if (totalPages > 5) {
                        if (currentPage > 3) {
                          page = currentPage - 2 + i
                        }
                        if (currentPage > totalPages - 3) {
                          page = totalPages - 4 + i
                        }
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={clsx(
                            'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          )}
                        >
                          {page}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Modal - only show if not in read-only mode */}
      {!readOnly && (
        <NavigationModal
          isOpen={showNavigationModal}
          onClose={() => setShowNavigationModal(false)}
          onConfirm={handleNavigationConfirm}
          onSaveAndNavigate={handleSaveAndNavigate}
        />
      )}
    </div>
  )
}