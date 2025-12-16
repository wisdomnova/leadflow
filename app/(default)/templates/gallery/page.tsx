'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TemplateGalleryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['All', 'Cold Outreach', 'Follow-up', 'Meeting Request', 'Thank You', 'Re-engagement', 'Networking']

  const galleryTemplates = [
    {
      id: 1,
      name: 'Cold Intro - SaaS',
      category: 'Cold Outreach',
      description: 'Perfect for reaching out to SaaS companies with a personalized introduction.',
      preview: 'Hi {{firstName}}, I\'ve been following {{company}}\'s growth and I\'m impressed...',
      openRate: 52.3,
      replyRate: 12.1,
      timesUsed: 1247,
      variables: ['{{firstName}}', '{{company}}', '{{senderName}}', '{{senderCompany}}'],
    },
    {
      id: 2,
      name: 'Follow-up - No Response',
      category: 'Follow-up',
      description: 'A gentle follow-up for prospects who haven\'t responded to your initial outreach.',
      preview: 'Hey {{firstName}}, I wanted to circle back on my previous email...',
      openRate: 45.8,
      replyRate: 15.3,
      timesUsed: 892,
      variables: ['{{firstName}}', '{{company}}', '{{previousDate}}'],
    },
    {
      id: 3,
      name: 'Meeting Request - Quick Chat',
      category: 'Meeting Request',
      description: 'Request a brief 15-minute call to discuss potential collaboration.',
      preview: 'Hi {{firstName}}, would you be open to a quick 15-minute chat about...',
      openRate: 49.1,
      replyRate: 18.7,
      timesUsed: 1056,
      variables: ['{{firstName}}', '{{company}}', '{{topic}}', '{{availableTimes}}'],
    },
    {
      id: 4,
      name: 'Post-Demo Thank You',
      category: 'Thank You',
      description: 'Express gratitude after a product demo and summarize next steps.',
      preview: 'Thanks for taking the time to see {{productName}} in action, {{firstName}}...',
      openRate: 68.4,
      replyRate: 22.5,
      timesUsed: 645,
      variables: ['{{firstName}}', '{{productName}}', '{{nextSteps}}'],
    },
    {
      id: 5,
      name: 'Re-engagement - Win Back',
      category: 'Re-engagement',
      description: 'Win back inactive subscribers with a special offer or update.',
      preview: 'Hi {{firstName}}, we\'ve made some exciting changes since you last visited...',
      openRate: 41.2,
      replyRate: 8.9,
      timesUsed: 234,
      variables: ['{{firstName}}', '{{update}}', '{{specialOffer}}'],
    },
    {
      id: 6,
      name: 'Networking - Industry Event',
      category: 'Networking',
      description: 'Connect with professionals after meeting at an industry event.',
      preview: 'Hi {{firstName}}, great to meet you at {{eventName}} last week...',
      openRate: 55.7,
      replyRate: 16.3,
      timesUsed: 389,
      variables: ['{{firstName}}', '{{eventName}}', '{{topic}}', '{{senderName}}'],
    },
  ]

  const filteredTemplates = galleryTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Template Gallery</h1>
        <p className="text-gray-600 dark:text-gray-400">Browse our collection of high-performing email templates</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category.toLowerCase())}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-colors ${
              selectedCategory === category.toLowerCase()
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex flex-col">
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{template.name}</h3>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {template.category}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{template.description}</p>

            <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 mb-4 flex-grow">
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{template.preview}"</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-t border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Open Rate</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">{template.openRate}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Reply Rate</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">{template.replyRate}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Times Used</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">{template.timesUsed.toLocaleString()}</p>
              </div>
            </div>

            {/* Variables */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Variables:</p>
              <div className="flex flex-wrap gap-2">
                {template.variables.map((variable, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded font-mono">
                    {variable}
                  </span>
                ))}
              </div>
            </div>

            <button className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors">
              Use Template
            </button>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No templates found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
