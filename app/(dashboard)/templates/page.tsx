// ./app/(dashboard)/templates/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  Clock, 
  Users, 
  Target, 
  ChevronRight, 
  Star, 
  Search,
  Eye,
  Plus,
  Grid3X3, 
  List,
  Filter,
  ChevronDown,
  Check,
  Copy,
  Zap,
  MoreVertical,
  X,
  Activity
} from 'lucide-react'
import clsx from 'clsx'
import { CAMPAIGN_TEMPLATES } from '@/lib/email-templates'

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

// Category filter options
const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories', icon: Filter },
  { value: 'sales', label: 'Sales', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.success }} /> },
  { value: 'marketing', label: 'Marketing', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.primary }} /> },
  { value: 'onboarding', label: 'Onboarding', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.secondary }} /> },
  { value: 'nurture', label: 'Customer Success', icon: () => <div className="h-3 w-3 rounded-full" style={{ backgroundColor: THEME_COLORS.accent }} /> },
  { value: 'follow-up', label: 'Follow-up', icon: () => <div className="h-3 w-3 rounded-full bg-yellow-500" /> }
]

// Custom Select Component
interface CustomSelectProps {
  value: string
  options: typeof CATEGORY_OPTIONS
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
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
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

// Template Card Component
const TemplateCard = ({ 
  template, 
  onUse, 
  onPreview
}: {
  template: any
  onUse: () => void
  onPreview: () => void
}) => {
  const [showDropdown, setShowDropdown] = useState(false)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales':
        return THEME_COLORS.success
      case 'marketing':
        return THEME_COLORS.primary
      case 'onboarding':
        return THEME_COLORS.secondary
      case 'nurture':
        return THEME_COLORS.accent
      case 'follow-up':
        return '#eab308'
      default:
        return '#6b7280'
    }
  }

  const maxDelay = Math.max(...template.steps.map((s: any) => s.delay_days))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105"
    >
      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <span 
                className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium text-white shadow-sm"
                style={{ backgroundColor: getCategoryColor(template.category) }}
              >
                {template.category}
              </span>
              {template.popular && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium bg-orange-100 text-orange-700">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Popular
                </span>
              )}
            </div>
            <h3 
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:underline transition-colors truncate"
              onClick={onPreview}
            >
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {template.description}
            </p>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => { onPreview(); setShowDropdown(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-3" />
                    Preview Template
                  </button>
                  <button
                    onClick={() => { onUse(); setShowDropdown(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-3" /> 
                    Use Template
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {template.steps.length}
            </div>
            <div className="text-xs text-gray-500">Emails</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{maxDelay}d</div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {template.steps.filter((s: any) => s.content.includes('{{first_name}}')).length}
            </div>
            <div className="text-xs text-gray-500">Variables</div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h5 className="text-xs font-medium text-gray-700 mb-2">First Email Preview:</h5>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Subject:</strong> {template.steps[0]?.subject || 'No subject'}
          </p>
          <p className="text-sm text-gray-600 line-clamp-2">
            {template.steps[0]?.content?.substring(0, 120) || 'No content preview'}...
          </p>
        </div>
      </div>

      {/* Card Footer - Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {template.steps.length} email sequence
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onPreview}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 hover:shadow-md text-xs font-medium transition-all"
            >
              <Eye className="h-3 w-3 mr-1.5" />
              Preview
            </button>
            
            <button
              onClick={onUse}
              className="inline-flex items-center px-3 py-1.5 text-white rounded-xl hover:shadow-md text-xs font-medium transition-all"
              style={{ backgroundColor: THEME_COLORS.primary }}
            >
              <Plus className="h-3 w-3 mr-1.5" />
              Use Template
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function TemplatesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

  // Get unique categories from templates
  const categories = [
    { id: 'all', name: 'All Templates', count: CAMPAIGN_TEMPLATES.length },
    ...Array.from(new Set(CAMPAIGN_TEMPLATES.map(t => t.category))).map(category => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      count: CAMPAIGN_TEMPLATES.filter(t => t.category === category).length
    }))
  ]

  const filteredTemplates = CAMPAIGN_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleUseTemplate = (template: any) => {
    // Clear any existing campaign creation state
    localStorage.removeItem('createCampaign_currentStep')
    localStorage.removeItem('createCampaign_data')
    localStorage.removeItem('createCampaign_id')
    localStorage.removeItem('createCampaign_template')
    localStorage.removeItem('createCampaign_showForm')
    localStorage.removeItem('createCampaign_selectedContacts')
    localStorage.removeItem('createCampaign_lastActive')
    
    // Store the selected template
    localStorage.setItem('createCampaign_template', JSON.stringify(template))
    localStorage.setItem('createCampaign_showForm', JSON.stringify(true))
    
    // Navigate to campaign creation
    router.push('/campaigns/create')
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales':
        return THEME_COLORS.success
      case 'marketing':
        return THEME_COLORS.primary
      case 'onboarding':
        return THEME_COLORS.secondary
      case 'nurture':
        return THEME_COLORS.accent
      case 'follow-up':
        return '#eab308'
      default:
        return '#6b7280'
    }
  }

  // Stats calculations
  const stats = [
    {
      label: 'Total Templates',
      value: CAMPAIGN_TEMPLATES.length,
      icon: Mail,
      color: THEME_COLORS.primary
    },
    {
      label: 'Categories',
      value: categories.length - 1,
      icon: Target,
      color: THEME_COLORS.secondary
    },
    {
      label: 'Popular Templates',
      value: CAMPAIGN_TEMPLATES.filter(t => t.popular).length,
      icon: Star,
      color: '#eab308'
    },
    {
      label: 'Avg. Sequence',
      value: Math.round(CAMPAIGN_TEMPLATES.reduce((acc, t) => acc + t.steps.length, 0) / CAMPAIGN_TEMPLATES.length),
      icon: Activity,
      color: THEME_COLORS.accent,
      suffix: ' emails'
    }
  ]

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
              <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
              <p className="mt-1 text-lg text-gray-600">
                Professional email sequences ready to customize and deploy
              </p>
            </div>
            <button
              onClick={() => router.push('/campaigns/create')}
              className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white hover:shadow-lg transition-all duration-200"
              style={{ backgroundColor: THEME_COLORS.primary }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </button>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              const displayValue = `${stat.value}${stat.suffix || ''}`

              return (
                <motion.div
                  key={stat.label}
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
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">{stat.label}</h3>
                  <p className="text-3xl font-bold text-gray-900">{displayValue}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Filters and Controls */}
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 shadow-sm"
                      style={{ 
                        '--tw-ring-color': THEME_COLORS.primary
                      } as any}
                    />
                  </div>
                </div>
                
                <CustomSelect
                  value={selectedCategory}
                  options={CATEGORY_OPTIONS}
                  onChange={setSelectedCategory}
                  className="w-56"
                />
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={clsx(
                      'p-2 rounded-lg transition-colors',
                      viewMode === 'grid' 
                        ? 'bg-white text-white shadow-md' 
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                    style={viewMode === 'grid' ? { backgroundColor: THEME_COLORS.primary } : {}}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={clsx(
                      'p-2 rounded-lg transition-colors',
                      viewMode === 'table' 
                        ? 'bg-white text-white shadow-md' 
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                    style={viewMode === 'table' ? { backgroundColor: THEME_COLORS.primary } : {}}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                
                <span className="text-sm text-gray-500">
                  {filteredTemplates.length} of {CAMPAIGN_TEMPLATES.length} templates
                </span>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          {filteredTemplates.length === 0 ? (
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
                <Mail className="h-8 w-8" style={{ color: THEME_COLORS.primary }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-6 text-lg">
                Try adjusting your search or filters to find the templates you're looking for.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onUse={() => handleUseTemplate(template)}
                        onPreview={() => setSelectedTemplate(template)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                /* Table View */
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Template
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Emails
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Variables
                          </th>
                          <th scope="col" className="relative px-6 py-4">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTemplates.map((template, index) => {
                          const maxDelay = Math.max(...template.steps.map((s: any) => s.delay_days))
                          const variableCount = template.steps.filter((s: any) => s.content.includes('{{first_name}}')).length

                          return (
                            <motion.tr  
                              key={template.id} 
                              className="hover:bg-gray-50 transition-colors duration-200"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div 
                                    className="flex-shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center shadow-md"
                                    style={{ backgroundColor: `${getCategoryColor(template.category)}20` }}
                                  >
                                    <Mail className="h-6 w-6" style={{ color: getCategoryColor(template.category) }} />
                                  </div>
                                  <div className="ml-4">
                                    <div className="flex items-center space-x-2">
                                      <div 
                                        className="text-sm font-semibold text-gray-900 cursor-pointer hover:underline"
                                        onClick={() => setSelectedTemplate(template)}
                                      >
                                        {template.name}
                                      </div>
                                      {template.popular && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                          <Star className="h-3 w-3 mr-1 fill-current" />
                                          Popular
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600 truncate max-w-xs">
                                      {template.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span 
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium text-white"
                                  style={{ backgroundColor: getCategoryColor(template.category) }}
                                >
                                  {template.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {template.steps.length}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {maxDelay}d
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {variableCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setSelectedTemplate(template)}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 hover:shadow-md text-xs font-medium transition-all"
                                  >
                                    <Eye className="h-3 w-3 mr-1.5" />
                                    Preview
                                  </button>
                                  
                                  <button
                                    onClick={() => handleUseTemplate(template)}
                                    className="inline-flex items-center px-3 py-1.5 text-white rounded-xl hover:shadow-md text-xs font-medium transition-all"
                                    style={{ backgroundColor: THEME_COLORS.primary }}
                                  >
                                    <Plus className="h-3 w-3 mr-1.5" />
                                    Use
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Template Preview Modal */}
          <AnimatePresence>
            {selectedTemplate && (
              <motion.div 
                className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTemplate(null)}
              >
                <motion.div 
                  className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                        {selectedTemplate.name}
                        {selectedTemplate.popular && (
                          <span className="ml-3 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-xl text-sm font-semibold flex items-center">
                            <Star className="h-4 w-4 mr-1.5 fill-current" />
                            Popular Choice
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600 mt-1 text-lg">{selectedTemplate.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                      {selectedTemplate.steps.map((step: any, index: number) => (
                        <motion.div 
                          key={index} 
                          className="flex"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex-shrink-0 mr-6">
                            <div 
                              className="w-12 h-12 text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm"
                              style={{ backgroundColor: THEME_COLORS.primary }}
                            >
                              {index + 1}
                            </div>
                            {index < selectedTemplate.steps.length - 1 && (
                              <div className="w-0.5 h-16 bg-gray-300 mx-auto mt-4 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="text-lg font-semibold text-gray-900">{step.subject}</h5>
                                <span className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl">
                                  {step.delay_days === 0 && step.delay_hours === 0 
                                    ? 'Send immediately' 
                                    : `Wait ${step.delay_days}d ${step.delay_hours || 0}h`}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 rounded-xl p-4 leading-relaxed border border-gray-100">
                                {step.content}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-gray-200 bg-white">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Ready to use this template for your campaign?
                      </span>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setSelectedTemplate(null)}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:shadow-md font-medium transition-all duration-200"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            handleUseTemplate(selectedTemplate)
                            setSelectedTemplate(null)
                          }}
                          className="px-8 py-3 text-white rounded-xl font-medium flex items-center shadow-sm hover:shadow-md transition-all duration-200"
                          style={{ backgroundColor: THEME_COLORS.primary }}
                        >
                          Use This Template
                          <ChevronRight className="h-5 w-5 ml-2" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}