'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useContactStore } from '@/store/useContactStore'
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  ArrowLeft,
  Users,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

export default function ImportContactsPage() {
  const router = useRouter()
  const { importContacts, importing } = useContactStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setStep('preview')
    } else {
      alert('Please select a CSV file')
    }
  }

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
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) return

    try {
      const result = await importContacts(file)
      setImportResult(result)
      setStep('result')
    } catch (error) {
      console.error('Import failed:', error)
      setImportResult({
        success: 0,
        errors: 1,
        duplicates: 0,
        details: ['Import failed. Please try again.']
      })
      setStep('result')
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'email,first_name,last_name,company,job_title,phone,tags\n' +
                      'john.doe@example.com,John,Doe,Example Corp,CEO,+1234567890,"lead,vip"\n' +
                      'jane.smith@test.com,Jane,Smith,Test Inc,Manager,+0987654321,lead'
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/contacts"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Contacts</h1>
        <p className="mt-1 text-lg text-gray-600">
          Upload a CSV file to import your contacts into LeadFlow
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8">
        <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : step === 'preview' || step === 'result' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'upload' ? 'border-blue-600 bg-blue-50' : step === 'preview' || step === 'result' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
            {step === 'preview' || step === 'result' ? <CheckCircle className="h-5 w-5" /> : '1'}
          </div>
          <span className="ml-2 text-sm font-medium">Upload File</span>
        </div>
        
        <div className={`w-16 h-0.5 ${step === 'preview' || step === 'result' ? 'bg-green-600' : 'bg-gray-300'}`} />
        
        <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : step === 'result' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'preview' ? 'border-blue-600 bg-blue-50' : step === 'result' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
            {step === 'result' ? <CheckCircle className="h-5 w-5" /> : '2'}
          </div>
          <span className="ml-2 text-sm font-medium">Preview & Import</span>
        </div>
        
        <div className={`w-16 h-0.5 ${step === 'result' ? 'bg-green-600' : 'bg-gray-300'}`} />
        
        <div className={`flex items-center ${step === 'result' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'result' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
            3
          </div>
          <span className="ml-2 text-sm font-medium">Complete</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 'upload' && (
        <div className="space-y-8">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  CSV File Requirements
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>File must be in CSV format (.csv)</li>
                    <li>Required column: <code className="bg-blue-100 px-1 rounded">email</code></li>
                    <li>Optional columns: <code className="bg-blue-100 px-1 rounded">first_name</code>, <code className="bg-blue-100 px-1 rounded">last_name</code>, <code className="bg-blue-100 px-1 rounded">company</code>, <code className="bg-blue-100 px-1 rounded">job_title</code>, <code className="bg-blue-100 px-1 rounded">phone</code>, <code className="bg-blue-100 px-1 rounded">tags</code></li>
                    <li>Maximum file size: 10MB</li>
                    <li>Duplicate emails will be skipped</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Download Template */}
          <div className="text-center">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </button>
          </div>

          {/* File Upload */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Drop your CSV file here, or{' '}
                  <span className="text-blue-600 hover:text-blue-500">browse</span>
                </span>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">CSV files up to 10MB</p>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && file && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">File Preview</h3>
              <button
                onClick={() => {
                  setFile(null)
                  setStep('upload')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                {file.name}
              </div>
              <div>
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Before You Import
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Contacts with duplicate emails will be skipped</li>
                    <li>Invalid email addresses will be rejected</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setStep('upload')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Choose Different File
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </div>
              ) : (
                'Import Contacts'
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'result' && importResult && (
        <div className="space-y-6">
          <div className="text-center">
            {importResult.success > 0 ? (
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            ) : (
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            )}
          </div>

          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Import {importResult.success > 0 ? 'Completed' : 'Failed'}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {importResult.success > 0 
                ? `Successfully imported ${importResult.success} contacts`
                : 'No contacts were imported'
              }
            </p>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
              <div className="text-sm text-green-800">Successfully Imported</div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
              <div className="text-sm text-yellow-800">Duplicates Skipped</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
              <div className="text-sm text-red-800">Errors</div>
            </div>
          </div>

          {/* Error Details */}
          {importResult.details && importResult.details.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-red-800 mb-3">Import Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {importResult.details.map((error: string, index: number) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setFile(null)
                setImportResult(null)
                setStep('upload')
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Import More Contacts
            </button>
            <Link
              href="/contacts"
              className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              View All Contacts
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}