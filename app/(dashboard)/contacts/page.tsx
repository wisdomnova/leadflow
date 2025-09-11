// ./app/(dashboard)/contacts/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useContactStore } from '@/store/useContactStore'
import { 
  Users, 
  Search, 
  Filter, 
  Upload, 
  Plus, 
  Download,
  Mail,
  Phone,
  Building, 
  MoreVertical,
  Trash2,
  Edit, 
  Eye,
  X,
  Tag,
  UserX,
  ArrowUpRight,
  ArrowLeft,
  ChevronDown,
  Check
} from 'lucide-react'
import clsx from 'clsx'

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

// Status filter options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status', icon: Filter },
  { value: 'active', label: 'Active', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.success }} /> },
  { value: 'unsubscribed', label: 'Unsubscribed', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.secondary }} /> },
  { value: 'bounced', label: 'Bounced', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.warning }} /> }
]

// Custom Select Component
interface CustomSelectProps {
  value: string
  options: typeof STATUS_OPTIONS
  onChange: (value: string) => void
  className?: string
}

function CustomSelect({ value, options, onChange, className }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(option => option.value === value) || options[0]

  return (
    <div className={clsx("relative", className)}>
      <button
        type="button"
        className="relative w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-xl shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:border-transparent hover:bg-gray-50 transition-all duration-200"
        style={{ 
          '--tw-ring-color': THEME_COLORS.primary
        } as any}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center">
          <selectedOption.icon className="h-4 w-4 mr-3 text-gray-400" />
          <span className="block truncate text-gray-900 font-medium">{selectedOption.label}</span>
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown 
            className={clsx(
              "h-4 w-4 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-20 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="py-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    className={clsx(
                      "w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors duration-150",
                      value === option.value && "text-blue-600 font-medium"
                    )}
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center">
                      <option.icon className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-gray-900">{option.label}</span>
                    </div>
                    {value === option.value && (
                      <Check className="h-4 w-4" style={{ color: THEME_COLORS.primary }} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

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

export default function ContactsPage() {
  const {
    contacts: allContacts,
    loading,
    fetchContacts,
    deleteContact,
    setPage
  } = useContactStore()

  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  // Local state for filters (no store dependency)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
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

  // Initial fetch only
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
  }

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const handleSelectAll = () => {
    if (selectedContacts.length === paginatedContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(paginatedContacts.map(c => c.id))
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId)
      setShowDeleteModal(false)
      setContactToDelete(null)
      setSelectedContacts(prev => prev.filter(id => id !== contactId))
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedContacts.map(id => deleteContact(id)))
      setSelectedContacts([])
      setShowBulkDeleteModal(false)
    } catch (error) {
      console.error('Bulk delete failed:', error)
    }
  }

  const handleExport = async (selectedOnly = false) => {
    try {
      setExporting(true)
      
      const contactsToExport = selectedOnly 
        ? filteredContacts.filter(c => selectedContacts.includes(c.id))
        : filteredContacts

      if (contactsToExport.length === 0) {
        alert('No contacts to export')
        return
      }

      // Generate CSV content
      const headers = ['email', 'first_name', 'last_name', 'company', 'job_title', 'phone', 'status', 'tags', 'created_at']
      const csvContent = [
        headers.join(','),
        ...contactsToExport.map(contact => [
          contact.email,
          contact.first_name || '',
          contact.last_name || '',
          contact.company || '',
          contact.job_title || '',
          contact.phone || '',
          contact.status,
          Array.isArray(contact.tags) ? contact.tags.join(';') : '',
          new Date(contact.created_at).toISOString().split('T')[0]
        ].map(field => `"${field}"`).join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = selectedOnly 
        ? `contacts_selected_${selectedContacts.length}_${timestamp}.csv`
        : `contacts_export_${contactsToExport.length}_${timestamp}.csv`
      
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      if (selectedOnly) {
        setSelectedContacts([])
      }

    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span 
            className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium text-white"
            style={{ backgroundColor: THEME_COLORS.success }}
          >
            Active
          </span>
        )
      case 'unsubscribed':
        return (
          <span 
            className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium text-white"
            style={{ backgroundColor: THEME_COLORS.warning }}
          >
            Unsubscribed
          </span>
        )
      case 'bounced':
        return (
          <span 
            className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium text-white"
            style={{ backgroundColor: THEME_COLORS.warning }}
          >
            Bounced
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        )
    }
  }

  if (loading && allContacts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-full mx-auto px-6 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: THEME_COLORS.primary }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="space-y-8">
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
              <p className="mt-1 text-lg text-gray-600">
                Manage your contact database and import new leads
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => handleExport(false)}
                disabled={exporting || filteredContacts.length === 0}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export All'}
              </button>
              <Link
                href="/contacts/import"
                className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white hover:shadow-lg transition-all duration-200"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Contacts
              </Link>
            </div>
          </motion.div>

          {/* Bulk Actions Bar */}
          {selectedContacts.length > 0 && (
            <motion.div 
              className="border border-gray-200 rounded-2xl p-6 shadow-lg"
              style={{ backgroundColor: `${THEME_COLORS.primary}10` }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm font-medium" style={{ color: THEME_COLORS.primary }}>
                    <span className="font-bold text-lg">{selectedContacts.length}</span>
                    <span className="ml-2">
                      {selectedContacts.length === 1 ? 'contact' : 'contacts'} selected
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleExport(true)}
                      disabled={exporting}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md disabled:opacity-50 transition-all duration-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {exporting ? 'Exporting...' : 'Export Selected'}
                    </button>
                    <button
                      onClick={() => setShowBulkDeleteModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl text-sm font-medium text-white hover:shadow-md transition-all duration-200"
                      style={{ backgroundColor: THEME_COLORS.warning }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContacts([])}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white hover:bg-opacity-50 rounded-xl transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                title: searchQuery || statusFilter !== 'all' ? 'Filtered Contacts' : 'Total Contacts',
                value: totalCount.toLocaleString(),
                icon: Users,
                color: THEME_COLORS.primary
              },
              {
                title: 'Active',
                value: filteredContacts.filter(c => c.status === 'active').length,
                icon: () => <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME_COLORS.success }}>
                  <div className="h-3 w-3 bg-white rounded-full" />
                </div>,
                color: THEME_COLORS.success
              },
              {
                title: 'Unsubscribed',
                value: filteredContacts.filter(c => c.status === 'unsubscribed').length,
                icon: () => <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME_COLORS.secondary }}>
                  <div className="h-3 w-3 bg-white rounded-full" />
                </div>,
                color: THEME_COLORS.secondary
              },
              {
                title: 'Bounced',
                value: filteredContacts.filter(c => c.status === 'bounced').length,
                icon: () => <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME_COLORS.warning }}>
                  <div className="h-3 w-3 bg-white rounded-full" />
                </div>,
                color: THEME_COLORS.warning
              }
            ].map((stat, index) => {
              const Icon = stat.icon

              return (
                <motion.div
                  key={stat.title}
                  className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-105"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: stat.color }}
                    >
                      {typeof Icon === 'function' && stat.title !== 'Total Contacts' && stat.title !== 'Filtered Contacts' ? (
                        <Icon />
                      ) : (
                        <Icon className="h-7 w-7 text-white" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Filters - Updated with consistent shadows */}
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts by name, email, company..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 shadow-sm"
                    style={{ 
                      '--tw-ring-color': THEME_COLORS.primary
                    } as any}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <CustomSelect
                  value={statusFilter}
                  options={STATUS_OPTIONS}
                  onChange={handleStatusFilter}
                  className="w-48"
                />
              </div>
            </div>
          </motion.div>

          {/* Empty State */}
          {filteredContacts.length === 0 && !loading ? (
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md"
                style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
              >
                <Users className="h-8 w-8" style={{ color: THEME_COLORS.primary }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-600 mb-6 text-lg">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by importing your first contacts'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link
                  href="/contacts/import"
                  className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white hover:shadow-lg transition-all duration-200"
                  style={{ backgroundColor: THEME_COLORS.primary }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Contacts
                </Link>
              )}
            </motion.div>
          ) : (
            /* Contact Table */
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedContacts.length === paginatedContacts.length && paginatedContacts.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 focus:ring-2 border-gray-300 rounded transition-all"
                          style={{ 
                            accentColor: THEME_COLORS.primary,
                            '--tw-ring-color': THEME_COLORS.primary
                          } as any}
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
                      <th scope="col" className="relative px-6 py-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedContacts.map((contact, index) => (
                      <motion.tr 
                        key={contact.id} 
                        className="hover:bg-gray-50 transition-colors duration-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={() => handleSelectContact(contact.id)}
                            className="h-4 w-4 focus:ring-2 border-gray-300 rounded transition-all"
                            style={{ 
                              accentColor: THEME_COLORS.primary,
                              '--tw-ring-color': THEME_COLORS.primary
                            } as any}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div 
                                className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-md"
                                style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                              >
                                <span className="text-lg font-bold" style={{ color: THEME_COLORS.primary }}>
                                  {contact.first_name?.charAt(0) || contact.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {contact.first_name} {contact.last_name}
                              </div>
                              <div className="text-sm text-gray-600 flex items-center mt-1">
                                <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                {contact.email}
                              </div>
                              {contact.phone && (
                                <div className="text-sm text-gray-600 flex items-center mt-1">
                                  <Phone className="h-3 w-3 mr-2 text-gray-400" />
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
                                <div>
                                  <div className="font-medium">{contact.company}</div>
                                  {contact.job_title && (
                                    <div className="text-xs text-gray-500">{contact.job_title}</div>
                                  )}
                                </div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setContactToDelete(contact.id)
                              setShowDeleteModal(true)
                            }}
                            className="text-gray-500 hover:text-white p-2 rounded-xl hover:shadow-md transition-all duration-200"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = THEME_COLORS.warning
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                      <ArrowUpRight className="h-4 w-4 ml-2" />
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
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 rounded-l-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <ArrowLeft className="h-4 w-4" />
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
                                'relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200',
                                page === currentPage
                                  ? 'z-10 text-white border-transparent shadow-md'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              )}
                              style={page === currentPage ? { backgroundColor: THEME_COLORS.primary } : {}}
                            >
                              {page}
                            </button>
                          )
                        })}
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-4 py-2 rounded-r-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Delete Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <motion.div 
                className="relative p-8 border w-96 shadow-xl rounded-2xl bg-white"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center">
                  <div 
                    className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl mb-4 shadow-md"
                    style={{ backgroundColor: `${THEME_COLORS.warning}20` }}
                  >
                    <Trash2 className="h-8 w-8" style={{ color: THEME_COLORS.warning }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Contact</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this contact? This action cannot be undone.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => contactToDelete && handleDeleteContact(contactToDelete)}
                      className="flex-1 px-6 py-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                      style={{ backgroundColor: THEME_COLORS.warning }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Bulk Delete Modal */}
          {showBulkDeleteModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <motion.div 
                className="relative p-8 border w-96 shadow-xl rounded-2xl bg-white"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center">
                  <div 
                    className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl mb-4 shadow-md"
                    style={{ backgroundColor: `${THEME_COLORS.warning}20` }}
                  >
                    <Trash2 className="h-8 w-8" style={{ color: THEME_COLORS.warning }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete {selectedContacts.length} Contacts</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete {selectedContacts.length} selected contacts? This action cannot be undone.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowBulkDeleteModal(false)}
                      className="flex-1 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      className="flex-1 px-6 py-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                      style={{ backgroundColor: THEME_COLORS.warning }}
                    >
                      Delete All
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}