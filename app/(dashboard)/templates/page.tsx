// ./app/(dashboard)/templates/page.tsx - Using your existing template system

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Bookmark,
  BookmarkCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { CAMPAIGN_TEMPLATES } from '@/lib/email-templates'
import { TEMPLATE_VARIABLES } from '@/lib/template-variables'

export default function TemplatesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [bookmarkedTemplates, setBookmarkedTemplates] = useState<Set<string>>(new Set())

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
    
    // Navigate to campaign creation
    router.push('/campaigns/create')
  }

  const toggleBookmark = (templateId: string) => {
    const newBookmarks = new Set(bookmarkedTemplates)
    if (newBookmarks.has(templateId)) {
      newBookmarks.delete(templateId)
    } else {
      newBookmarks.add(templateId)
    }
    setBookmarkedTemplates(newBookmarks)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return 'bg-green-100 text-green-800'
      case 'marketing': return 'bg-blue-100 text-blue-800'
      case 'onboarding': return 'bg-purple-100 text-purple-800'
      case 'nurture': return 'bg-orange-100 text-orange-800'
      case 'follow-up': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Email Templates
              </h1>
              <p className="text-xl text-gray-600">
                Professional email sequences ready to customize and deploy
              </p>
            </div>
            <button
              onClick={() => router.push('/campaigns/create')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Templates', value: CAMPAIGN_TEMPLATES.length, icon: Mail },
              { label: 'Categories', value: categories.length - 1, icon: Target },
              { label: 'Template Variables', value: Object.keys(TEMPLATE_VARIABLES.contact).length + Object.keys(TEMPLATE_VARIABLES.campaign).length, icon: Star },
              { label: 'Avg. Sequence', value: Math.round(CAMPAIGN_TEMPLATES.reduce((acc, t) => acc + t.steps.length, 0) / CAMPAIGN_TEMPLATES.length) + ' emails', icon: Clock }
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  className="bg-white rounded-2xl border border-gray-200 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Icon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 min-w-[160px]"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              <span className="text-sm text-gray-500">
                {filteredTemplates.length} templates
              </span>
            </div>
          </div>
        </motion.div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 p-12 text-center"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters to find the templates you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <motion.div
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                className="bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
                variants={fadeInUp}
                whileHover={{ y: -2 }}
              >
                <div className="p-6">
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {template.name}
                        </h3>
                        {template.popular && (
                          <div className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Popular
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => toggleBookmark(template.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {bookmarkedTemplates.has(template.id) ? (
                        <BookmarkCheck className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Bookmark className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Template Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {template.steps.length} emails
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {Math.max(...template.steps.map(s => s.delay_days))}d
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-1">First email preview:</p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      <strong>Subject:</strong> {template.steps[0]?.subject || 'No subject'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {template.steps[0]?.content?.substring(0, 120) || 'No content preview'}...
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Use Template
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Template Preview Modal */}
        <AnimatePresence>
          {selectedTemplate && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTemplate(null)}
            >
              <motion.div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                        {selectedTemplate.name}
                        {selectedTemplate.popular && (
                          <div className="ml-3 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full flex items-center">
                            <Star className="h-4 w-4 mr-1 fill-current" />
                            Popular
                          </div>
                        )}
                      </h3>
                      <p className="text-gray-600 mt-1">{selectedTemplate.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-400 rotate-45" />
                    </button>
                  </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-6">
                    {selectedTemplate.steps.map((step: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Email {index + 1}: {step.subject}</h4>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {step.delay_days === 0 && step.delay_hours === 0 
                              ? 'Send immediately' 
                              : `Wait ${step.delay_days}d ${step.delay_hours || 0}h`}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                            {step.content}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Ready to use this template?
                    </span>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSelectedTemplate(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleUseTemplate(selectedTemplate)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Use Template
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
  )
}