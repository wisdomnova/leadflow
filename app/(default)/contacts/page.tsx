'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Dummy data
  const stats = {
    total: 2847,
    active: 2654,
    bounced: 142,
    unsubscribed: 51,
  }

  const contacts = [
    { name: 'Sarah Johnson', email: 'sarah@techcorp.com', company: 'TechCorp Inc', tags: ['Enterprise', 'Decision Maker'], status: 'Active', lastActivity: '2 days ago' },
    { name: 'Mike Davis', email: 'mike@startup.io', company: 'Startup.io', tags: ['SMB', 'Replied'], status: 'Active', lastActivity: '5 hours ago' },
    { name: 'Emily Chen', email: 'emily@design.co', company: 'Design Co', tags: ['Agency', 'Hot Lead'], status: 'Active', lastActivity: '1 day ago' },
    { name: 'John Smith', email: 'john@invalid.com', company: 'Unknown', tags: [], status: 'Bounced', lastActivity: '3 days ago' },
    { name: 'Lisa Anderson', email: 'lisa@marketing.com', company: 'Marketing Solutions', tags: ['Enterprise'], status: 'Active', lastActivity: '1 week ago' },
    { name: 'David Brown', email: 'david@software.net', company: 'Software Net', tags: ['SMB', 'Technical'], status: 'Unsubscribed', lastActivity: '2 weeks ago' },
    { name: 'Alex Turner', email: 'alex@consulting.com', company: 'Turner Consulting', tags: ['Decision Maker'], status: 'Active', lastActivity: '3 days ago' },
    { name: 'Jennifer Lee', email: 'jennifer@finance.com', company: 'Finance Corp', tags: ['Enterprise', 'CFO'], status: 'Active', lastActivity: '1 day ago' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'Bounced':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
      case 'Unsubscribed':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  const getTagColor = (tag: string) => {
    const colors: { [key: string]: string } = {
      Enterprise: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      'Decision Maker': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      SMB: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
      Replied: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'Hot Lead': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      Agency: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
      Technical: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      CFO: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    }
    return colors[tag] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Contacts</h1>
        </div>
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          <button className="btn bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700">
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">Add Contact</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Contacts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Contacts</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats.total.toLocaleString()}</p>
        </div>

        {/* Active */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active</p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.active.toLocaleString()}</p>
        </div>

        {/* Bounced */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Bounced</p>
          <p className="text-4xl font-bold text-red-600 dark:text-red-400">{stats.bounced}</p>
        </div>

        {/* Unsubscribed */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Unsubscribed</p>
          <p className="text-4xl font-bold text-gray-600 dark:text-gray-400">{stats.unsubscribed}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
          Filter
        </button>
        <Link href="/contacts/import" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors inline-block text-center">
          Import
        </Link>
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
          Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {contacts.map((contact, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{contact.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{contact.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags.map((tag, tagIdx) => (
                        <span key={tagIdx} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}>
                          {tag}
                        </span>
                      ))}
                      {contact.tags.length === 0 && <span className="text-xs text-gray-500 dark:text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{contact.lastActivity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-sm font-medium">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Showing 1-8 of {stats.total.toLocaleString()} contacts</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors disabled:opacity-50">
              Previous
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
