'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ImportContactsPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'manual'>('import')
  const [dragActive, setDragActive] = useState(false)

  const recentImports = [
    { count: 450, time: 'Today at 2:45 PM', status: 'Success' },
    { count: 1200, time: 'Yesterday at 11:30 AM', status: 'Success' },
    { count: 89, time: '3 days ago', status: 'Partial' },
  ]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      console.log('File dropped:', e.dataTransfer.files[0])
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/contacts" className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-2 inline-block">
            ← Back to Contacts
          </Link>
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">All Contacts</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'import'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Import
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'manual'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Add Manually
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-8">
          {activeTab === 'import' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Upload CSV File</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Import contacts from a CSV file. Maximum 10,000 contacts per upload.
              </p>

              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-900 dark:text-white font-medium mb-1">Drag and drop your CSV file here</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">or</p>
                <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors">
                  Browse Files
                </button>
              </div>

              <div className="mt-4 text-center">
                <button className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium">
                  Download Sample CSV Template
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Add New Contact</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input type="email" placeholder="john@example.com" className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                    <input type="text" placeholder="John" className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                    <input type="text" placeholder="Smith" className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company</label>
                    <input type="text" placeholder="Acme Corp" className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                    <input type="tel" placeholder="+1 (555) 000-0000" className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                    <input type="url" placeholder="https://example.com" className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                  <input type="text" placeholder="Enterprise, Hot Lead" className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors">
                    Add Contact
                  </button>
                  <Link href="/contacts" className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          )}

          {/* CSV Format Requirements */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">CSV Format Requirements</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Your CSV file should include the following columns:</p>

            <ul className="space-y-2 mb-6">
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Email (required)</span> - Contact's email address
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">First Name (optional)</span> - Contact's first name
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Last Name (optional)</span> - Contact's last name
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Company (optional)</span> - Company name
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Phone (optional)</span> - Phone number
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Website (optional)</span> - Company website
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Tags (optional)</span> - Comma-separated tags
              </li>
            </ul>

            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Example CSV Format:</h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 overflow-x-auto">
              <code className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre">
{`Email,First Name,Last Name,Company,Tags
john@example.com,John,Smith,Acme Corp,"Enterprise,Hot Lead"
sarah@company.com,Sarah,Johnson,TechCo,"SMB"`}
              </code>
            </div>
          </div>
        </div>

        {/* Sidebar - Recent Imports */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Imports</h3>
            <div className="space-y-4">
              {recentImports.map((importItem, idx) => (
                <div key={idx} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{importItem.count.toLocaleString()} contacts imported</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{importItem.time}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      importItem.status === 'Success'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {importItem.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
