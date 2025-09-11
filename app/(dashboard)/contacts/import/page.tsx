// ./app/(dashboard)/contacts/import/page.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
  AlertTriangle,
  File,
  Eye,
  Shield,
  Zap
} from 'lucide-react'
import Link from 'next/link'

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

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

  const steps = [
    { 
      id: 1, 
      name: 'Upload File', 
      description: 'Select your CSV file',
      icon: Upload
    },
    { 
      id: 2, 
      name: 'Preview & Import', 
      description: 'Verify and import',
      icon: Eye
    },
    { 
      id: 3, 
      name: 'Complete', 
      description: 'Import finished',
      icon: CheckCircle
    }
  ]

  const getStepStatus = (stepId: number) => {
    const currentStepNumber = step === 'upload' ? 1 : step === 'preview' ? 2 : 3
    if (stepId < currentStepNumber) return 'completed'
    if (stepId === currentStepNumber) return 'current'
    return 'upcoming'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/contacts"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Contacts
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Import Contacts
          </h1>
          <p className="text-lg text-gray-600">
            Upload a CSV file to import your contacts into LeadFlow
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className="flex items-center">
                  {/* Step Circle */}
                  <div 
                    className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all duration-300 ${
                      getStepStatus(stepItem.id) === 'completed' 
                        ? 'border-none shadow-md' 
                        : getStepStatus(stepItem.id) === 'current' 
                        ? 'border-none shadow-lg' 
                        : 'bg-gray-100 border-gray-300'
                    }`}
                    style={{
                      backgroundColor: getStepStatus(stepItem.id) === 'completed' 
                        ? THEME_COLORS.success 
                        : getStepStatus(stepItem.id) === 'current' 
                        ? THEME_COLORS.primary 
                        : undefined
                    }}
                  >
                    {getStepStatus(stepItem.id) === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <stepItem.icon className={`w-6 h-6 ${
                        getStepStatus(stepItem.id) === 'current' ? 'text-white' : 'text-gray-500'
                      }`} />
                    )}
                  </div>
                  
                  {/* Step Info */}
                  <div className="ml-3">
                    <div className={`font-semibold text-sm transition-colors ${
                      getStepStatus(stepItem.id) === 'current' ? 'text-gray-900' :
                      getStepStatus(stepItem.id) === 'completed' ? 'text-gray-700' :
                      'text-gray-500'
                    }`}>
                      {stepItem.name}
                    </div>
                    <div className="text-xs text-gray-500">{stepItem.description}</div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-6">
                    <div 
                      className={`h-0.5 rounded-full transition-all duration-500 ${
                        getStepStatus(stepItem.id) === 'completed' ? 'bg-gray-300' : 'bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: getStepStatus(stepItem.id) === 'completed' ? THEME_COLORS.success : undefined
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {step === 'upload' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Upload Your CSV File
                  </h2>
                  <p className="text-gray-600">
                    Select a CSV file containing your contact information
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
                  <div className="flex">
                    <div 
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: THEME_COLORS.secondary }}
                    >
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        CSV File Requirements
                      </h3>
                      <div className="text-gray-700 space-y-2 text-sm">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" style={{ color: THEME_COLORS.success }} />
                          <span>File must be in CSV format (.csv)</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" style={{ color: THEME_COLORS.success }} />
                          <span>Required column: <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">email</code></span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" style={{ color: THEME_COLORS.success }} />
                          <span>Optional: <code className="bg-gray-200 px-1 rounded text-xs font-mono">first_name</code>, <code className="bg-gray-200 px-1 rounded text-xs font-mono">last_name</code>, <code className="bg-gray-200 px-1 rounded text-xs font-mono">company</code>, etc.</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" style={{ color: THEME_COLORS.success }} />
                          <span>Maximum file size: 10MB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download Template */}
                <div className="text-center mb-6">
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    Use this template to format your contact data correctly
                  </p>
                </div>

                {/* File Upload */}
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-lg font-semibold text-gray-900 block mb-2">
                        Drop your CSV file here, or{' '}
                        <span className="hover:underline" style={{ color: THEME_COLORS.primary }}>browse</span>
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
                    <p className="text-gray-500">CSV files up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && file && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">File Preview</h2>
                    <p className="text-gray-600">Review your file before importing</p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null)
                      setStep('upload')
                    }}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* File Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: THEME_COLORS.accent }}
                    >
                      <File className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{file.name}</h3>
                      <p className="text-gray-600 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6">
                  <div className="flex">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mr-4 shadow-sm"
                      style={{ backgroundColor: THEME_COLORS.warning }}
                    >
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        Before You Import
                      </h3>
                      <div className="text-gray-700 space-y-2 text-sm">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" style={{ color: THEME_COLORS.warning }} />
                          <span>Contacts with duplicate emails will be skipped</span>
                        </div>
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" style={{ color: THEME_COLORS.warning }} />
                          <span>Invalid email addresses will be rejected</span>
                        </div>
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" style={{ color: THEME_COLORS.warning }} />
                          <span>This action cannot be undone</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setStep('upload')}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Choose Different File
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    {importing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importing...
                      </div>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Contacts
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-md">
                    {importResult.success > 0 ? (
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: THEME_COLORS.success }}
                      >
                        <CheckCircle className="h-10 w-10 text-white" />
                      </div>
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: THEME_COLORS.warning }}
                      >
                        <AlertCircle className="h-10 w-10 text-white" />
                      </div>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Import {importResult.success > 0 ? 'Completed' : 'Failed'}
                  </h2>
                  <p className="text-gray-600">
                    {importResult.success > 0 
                      ? `Successfully imported ${importResult.success} contacts`
                      : 'No contacts were imported'
                    }
                  </p>
                </div>

                {/* Results Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <motion.div 
                    className="border border-gray-200 rounded-2xl p-6 text-center bg-gray-50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.success }}>
                      {importResult.success}
                    </div>
                    <div className="text-gray-700 font-medium">Successfully Imported</div>
                  </motion.div>
                  
                  <motion.div 
                    className="border border-gray-200 rounded-2xl p-6 text-center bg-gray-50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.secondary }}>
                      {importResult.duplicates}
                    </div>
                    <div className="text-gray-700 font-medium">Duplicates Skipped</div>
                  </motion.div>
                  
                  <motion.div 
                    className="border border-gray-200 rounded-2xl p-6 text-center bg-gray-50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-3xl font-bold mb-2" style={{ color: THEME_COLORS.warning }}>
                      {importResult.errors}
                    </div>
                    <div className="text-gray-700 font-medium">Errors</div>
                  </motion.div>
                </div>

                {/* Error Details */}
                {importResult.details && importResult.details.length > 0 && (
                  <motion.div 
                    className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" style={{ color: THEME_COLORS.warning }} />
                      Import Errors
                    </h4>
                    <ul className="text-gray-700 space-y-2 text-sm">
                      {importResult.details.map((error: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2" style={{ color: THEME_COLORS.warning }}>•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setFile(null)
                      setImportResult(null)
                      setStep('upload')
                    }}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import More Contacts
                  </button>
                  <Link 
                    href="/contacts"
                    className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white transition-all hover:shadow-lg"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View All Contacts
                  </Link>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}