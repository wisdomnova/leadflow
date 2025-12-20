'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CAMPAIGN_TEMPLATES, TEMPLATE_CATEGORIES, DEVICE_LABELS } from '@/lib/campaign-templates'

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

  const filteredTemplates = CAMPAIGN_TEMPLATES.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === 'All' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const avgOpenRate = (
    CAMPAIGN_TEMPLATES.reduce((sum, t) => sum + t.openRate, 0) /
    CAMPAIGN_TEMPLATES.length
  ).toFixed(1)

  const avgClickRate = (
    CAMPAIGN_TEMPLATES.reduce((sum, t) => sum + t.clickRate, 0) /
    CAMPAIGN_TEMPLATES.length
  ).toFixed(1)

  const totalTemplates = CAMPAIGN_TEMPLATES.length

  const mostUsedTemplate = CAMPAIGN_TEMPLATES.reduce((prev, current) =>
    prev.timesUsed > current.timesUsed ? prev : current
  )

  const getDeviceLabel = (device: string) => DEVICE_LABELS[device as keyof typeof DEVICE_LABELS]

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Campaign Templates
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Professional, non-spammy templates for B2B outreach & lead generation
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Total Templates
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalTemplates}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Avg Open Rate
          </p>
          <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
            {avgOpenRate}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Avg Click Rate
          </p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {avgClickRate}%
          </p>
        </div>
      </div>

      {/* Most Used Template Highlight */}
      <div className="mb-8 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-600 text-white">
                Most Used
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-600 text-white">
                {getDeviceLabel(mostUsedTemplate.deviceOptimization)}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {mostUsedTemplate.name}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Subject: {mostUsedTemplate.subject}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Times Used
                </p>
                <p className="text-2xl font-bold text-violet-600">
                  {mostUsedTemplate.timesUsed}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Open Rate
                </p>
                <p className="text-2xl font-bold text-violet-600">
                  {mostUsedTemplate.openRate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Click Rate
                </p>
                <p className="text-2xl font-bold text-violet-600">
                  {mostUsedTemplate.clickRate}%
                </p>
              </div>
            </div>
          </div>
          <button className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors whitespace-nowrap">
            Use Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="All">All Categories</option>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-violet-200 dark:hover:border-violet-800"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">
                  {template.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {template.category}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                    {getDeviceLabel(template.deviceOptimization)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
              Subject: {template.subject}
            </p>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2 text-xs leading-relaxed">
              {template.preview}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 text-center text-xs">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {template.timesUsed}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Used</p>
              </div>
              <div>
                <p className="font-bold text-violet-600 dark:text-violet-400">
                  {template.openRate}%
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Open</p>
              </div>
              <div>
                <p className="font-bold text-blue-600 dark:text-blue-400">
                  {template.clickRate}%
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Click</p>
              </div>
            </div>

            <button className="w-full px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors">
              Use Template
            </button>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No templates found. Try adjusting your filters.
          </p>
        </div>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedTemplate.name}
                </h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {selectedTemplate.category}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                    {getDeviceLabel(selectedTemplate.deviceOptimization)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-2xl"
              >
                x
              </button>
            </div>

            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Subject Line
              </h3>
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded font-mono text-sm">
                {selectedTemplate.subject}
              </p>
            </div>

            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Email Body
              </h3>
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-4 rounded text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {selectedTemplate.body}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Times Used
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedTemplate.timesUsed}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Open Rate
                </p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {selectedTemplate.openRate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Click Rate
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedTemplate.clickRate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Device
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {getDeviceLabel(selectedTemplate.deviceOptimization)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium transition-colors">
                Use Template
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
