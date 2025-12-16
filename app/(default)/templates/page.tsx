'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const templates = [
    {
      id: 1,
      name: 'Cold Intro - Tech Startups',
      category: 'Cold Outreach',
      preview: 'Hi {{firstName}}, I noticed your work at {{company}}...',
      timesUsed: 45,
      openRate: 48.2,
      lastUsed: '2 days ago',
      isMostUsed: true,
    },
    {
      id: 2,
      name: 'Follow-up #1',
      category: 'Follow-up',
      preview: 'Hey {{firstName}}, just following up on my previous email...',
      timesUsed: 32,
      openRate: 42.1,
      lastUsed: '1 week ago',
      isMostUsed: false,
    },
    {
      id: 3,
      name: 'Meeting Request',
      category: 'Meeting Request',
      preview: 'Hi {{firstName}}, would love to schedule 15 minutes to discuss...',
      timesUsed: 28,
      openRate: 51.3,
      lastUsed: '3 days ago',
      isMostUsed: false,
    },
    {
      id: 4,
      name: 'Re-engagement Campaign',
      category: 'Re-engagement',
      preview: '{{firstName}}, it\'s been a while since we last connected...',
      timesUsed: 18,
      openRate: 38.7,
      lastUsed: '5 days ago',
      isMostUsed: false,
    },
    {
      id: 5,
      name: 'Product Demo Invitation',
      category: 'Cold Outreach',
      preview: 'Hi {{firstName}}, I\'d love to show you how {{senderCompany}} can help...',
      timesUsed: 22,
      openRate: 44.5,
      lastUsed: '1 day ago',
      isMostUsed: false,
    },
    {
      id: 6,
      name: 'Thank You - Post Meeting',
      category: 'Thank You',
      preview: 'Thanks for taking the time to meet with me, {{firstName}}...',
      timesUsed: 15,
      openRate: 65.8,
      lastUsed: '1 week ago',
      isMostUsed: false,
    },
  ]

  const avgOpenRate = (templates.reduce((sum, t) => sum + t.openRate, 0) / templates.length).toFixed(1)
  const totalTemplates = templates.length

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Templates</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalTemplates}</p>
            </div>
            <svg className="w-12 h-12 text-violet-100 dark:text-violet-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.5 13.857a4.5 4.5 0 01-4.5 4.5H9.5a1 1 0 010-2h5.5a2.5 2.5 0 000-5H5a3.5 3.5 0 006.061-1.529A3 3 0 1016.5 13.857z" />
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Open Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{avgOpenRate}%</p>
            </div>
            <svg className="w-12 h-12 text-violet-100 dark:text-violet-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.25 12c0-1.89.588-3.647 1.605-5.107a9 9 0 1115.29 6.868A9.003 9.003 0 0112 21.75c-4.478 0-8.268-2.943-9.362-6.905a8.994 8.994 0 01.306-2.705z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Most Used Template */}
      {templates.find(t => t.isMostUsed) && (
        <div className="mb-8 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-600 text-white">
              Most Used
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {templates.find(t => t.isMostUsed)?.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {templates.find(t => t.isMostUsed)?.preview}
          </p>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Open Rate</p>
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                {templates.find(t => t.isMostUsed)?.openRate}%
              </p>
            </div>
            <button className="ml-auto px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors">
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
          Filter
        </button>
        <Link href="/templates/gallery" className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors text-center">
          Template Gallery
        </Link>
        <Link href="/templates/new" className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors text-center">
          Create New Template
        </Link>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{template.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mt-1">
                  {template.category}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {template.preview}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-4 text-center pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{template.timesUsed}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Used</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{template.openRate}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Open Rate</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{template.lastUsed}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Last Used</p>
              </div>
            </div>

            <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors">
              Edit
            </button>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No templates found</p>
        </div>
      )}
    </div>
  )
}
