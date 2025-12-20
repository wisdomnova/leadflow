'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface ImportResult {
  success: boolean
  message: string
  total: number
  imported: number
  skipped: number
  errors?: string[]
}

export default function ImportContactsPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'manual'>('import')
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [manualForm, setManualForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    tags: '',
  })
  const [submittingManual, setSubmittingManual] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    try {
      setUploading(true)
      setError('')
      setResult(null)

      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Import failed')
        return
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!manualForm.email) {
      setError('Email is required')
      return
    }

    try {
      setSubmittingManual(true)
      setError('')

      const token = localStorage.getItem('token')
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: manualForm.email,
          firstName: manualForm.firstName || undefined,
          lastName: manualForm.lastName || undefined,
          company: manualForm.company || undefined,
          phone: manualForm.phone || undefined,
          tags: manualForm.tags ? manualForm.tags.split(',').map((t) => t.trim()) : [],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to add contact')
        return
      }

      // Reset form
      setManualForm({
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        phone: '',
        tags: '',
      })

      setResult({
        success: true,
        message: 'Contact added successfully',
        total: 1,
        imported: 1,
        skipped: 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact')
    } finally {
      setSubmittingManual(false)
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
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Import Contacts</h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className={`mb-6 p-4 rounded-lg ${
          result.success
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
        }`}>
          <p className="font-medium">{result.message}</p>
          <p className="text-sm mt-1">
            Total: {result.total} | Imported: {result.imported} | Skipped: {result.skipped}
          </p>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {result.errors.slice(0, 5).map((err, idx) => (
                <p key={idx} className="text-xs">
                  {err}
                </p>
              ))}
              {result.errors.length > 5 && <p className="text-xs">...and {result.errors.length - 5} more errors</p>}
            </div>
          )}
        </div>
      )}

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
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  disabled={uploading}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Browse Files'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Add New Contact</h2>
              <form className="space-y-4" onSubmit={handleManualSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={manualForm.email}
                      onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                      className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                    <input
                      type="text"
                      placeholder="John"
                      value={manualForm.firstName}
                      onChange={(e) => setManualForm({ ...manualForm, firstName: e.target.value })}
                      className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      placeholder="Smith"
                      value={manualForm.lastName}
                      onChange={(e) => setManualForm({ ...manualForm, lastName: e.target.value })}
                      className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company</label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      value={manualForm.company}
                      onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                      className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                      className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                    <input
                      type="text"
                      placeholder="Enterprise, Hot Lead"
                      value={manualForm.tags}
                      onChange={(e) => setManualForm({ ...manualForm, tags: e.target.value })}
                      className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submittingManual}
                    className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingManual ? 'Adding...' : 'Add Contact'}
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
            </ul>

            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Example CSV Format:</h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 overflow-x-auto">
              <code className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre">
{`Email,First Name,Last Name,Company
john@example.com,John,Smith,Acme Corp
sarah@company.com,Sarah,Johnson,TechCo`}
              </code>
            </div>
          </div>
        </div>

        {/* Sidebar - Tips */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Import Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex gap-2">
                  <span className="text-violet-600 dark:text-violet-400 font-bold">1.</span>
                  <span>CSV files must have an "email" column</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-600 dark:text-violet-400 font-bold">2.</span>
                  <span>Maximum 10,000 contacts per upload</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-600 dark:text-violet-400 font-bold">3.</span>
                  <span>Duplicates are automatically skipped</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-violet-600 dark:text-violet-400 font-bold">4.</span>
                  <span>Invalid emails are skipped</span>
                </li>
              </ul>
            </div>

            <div className="bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
              <h4 className="font-medium text-violet-900 dark:text-violet-200 mb-2">Bulk Operations</h4>
              <p className="text-sm text-violet-800 dark:text-violet-300 mb-3">
                Import your contacts first, then you can add tags, update status, and manage them all at once.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
