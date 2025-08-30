// ./app/(dashboard)/contacts/import/page.tsx - Updated to match create campaign design

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
  Settings
} from 'lucide-react'
import Link from 'next/link'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 } 
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
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
      icon: Upload,
      color: 'blue'
    },
    { 
      id: 2, 
      name: 'Preview & Import', 
      description: 'Verify and import',
      icon: FileText,
      color: 'purple'
    },
    { 
      id: 3, 
      name: 'Complete', 
      description: 'Import finished',
      icon: CheckCircle,
      color: 'green'
    }
  ]

  const getStepStatus = (stepId: number) => {
    const currentStepNumber = step === 'upload' ? 1 : step === 'preview' ? 2 : 3
    if (stepId < currentStepNumber) return 'completed'
    if (stepId === currentStepNumber) return 'current'
    return 'upcoming'
  }

  const getStepColor = (stepId: number) => {
    const status = getStepStatus(stepId)
    if (status === 'completed') return 'bg-green-600 border-green-600'
    if (status === 'current') return 'bg-blue-600 border-blue-600'
    return 'bg-gray-100 border-gray-300'
  }

  const getStepTextColor = (stepId: number) => {
    const status = getStepStatus(stepId)
    if (status === 'completed') return 'text-white'
    if (status === 'current') return 'text-white'
    return 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/contacts"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Import Contacts
          </h1>
          <p className="text-xl text-gray-600">
            Upload a CSV file to import your contacts into LeadFlow
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div 
          className="mb-12"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((stepItem, index) => (
              <motion.div 
                key={stepItem.id} 
                className="flex items-center"
                variants={staggerItem}
              >
                <div className="flex items-center">
                  {/* Step Circle */}
                  <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-300 ${getStepColor(stepItem.id)} ${
                    getStepStatus(stepItem.id) === 'current' ? 'shadow-xl shadow-blue-200' : ''
                  }`}>
                    {getStepStatus(stepItem.id) === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <stepItem.icon className={`w-8 h-8 ${getStepTextColor(stepItem.id)}`} />
                    )}
                    
                    {/* Pulse animation for current step */}
                    {getStepStatus(stepItem.id) === 'current' && (
                      <div className="absolute inset-0 rounded-2xl bg-blue-600 animate-ping opacity-20"></div>
                    )}
                  </div>
                  
                  {/* Step Info */}
                  <div className="ml-4">
                    <div className={`font-semibold transition-colors ${
                      getStepStatus(stepItem.id) === 'current' ? 'text-blue-600' :
                      getStepStatus(stepItem.id) === 'completed' ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {stepItem.name}
                    </div>
                    <div className="text-sm text-gray-500">{stepItem.description}</div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-8">
                    <div className={`h-1 rounded-full transition-all duration-500 ${
                      getStepStatus(stepItem.id) === 'completed' ? 'bg-green-400' : 'bg-gray-200'
                    }`}></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === 'upload' && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-12">
                <motion.div
                  initial="initial"
                  animate="animate"
                  variants={staggerContainer}
                >
                  <motion.h2 
                    className="text-3xl font-bold text-gray-900 mb-4"
                    variants={staggerItem}
                  >
                    Upload Your CSV File
                  </motion.h2>
                  <motion.p 
                    className="text-xl text-gray-600 mb-8"
                    variants={staggerItem}
                  >
                    Select a CSV file containing your contact information
                  </motion.p>

                  {/* Instructions */}
                  <motion.div 
                    className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8 mb-8"
                    variants={staggerItem}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-6">
                        <h3 className="text-lg font-bold text-blue-900 mb-3">
                          CSV File Requirements
                        </h3>
                        <div className="text-blue-800 space-y-2">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            <span>File must be in CSV format (.csv)</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            <span>Required column: <code className="bg-blue-100 px-2 py-1 rounded-md font-mono text-sm">email</code></span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            <span>Optional columns: <code className="bg-blue-100 px-2 py-1 rounded-md font-mono text-sm">first_name</code>, <code className="bg-blue-100 px-2 py-1 rounded-md font-mono text-sm">last_name</code>, <code className="bg-blue-100 px-2 py-1 rounded-md font-mono text-sm">company</code>, <code className="bg-blue-100 px-2 py-1 rounded-md font-mono text-sm">job_title</code>, <code className="bg-blue-100 px-2 py-1 rounded-md font-mono text-sm">phone</code>, <code className="bg-blue-100 px-2 py-1 rounded-md font-mono text-sm">tags</code></span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            <span>Maximum file size: 10MB</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            <span>Duplicate emails will be automatically skipped</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Download Template */}
                  <motion.div 
                    className="text-center mb-8"
                    variants={staggerItem}
                  >
                    <button
                      onClick={downloadTemplate}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download CSV Template
                    </button>
                    <p className="mt-2 text-sm text-gray-500">
                      Use this template to format your contact data correctly
                    </p>
                  </motion.div>

                  {/* File Upload */}
                  <motion.div
                    className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                      dragActive 
                        ? 'border-blue-400 bg-blue-50 scale-105' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    variants={staggerItem}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Upload className="h-10 w-10 text-blue-600" />
                    </div>
                    <div>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-xl font-semibold text-gray-900 block mb-2">
                          Drop your CSV file here, or{' '}
                          <span className="text-blue-600 hover:text-blue-700 underline">browse</span>
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
                  </motion.div>
                </motion.div>
              </div>
            </div>
          )}

          {step === 'preview' && file && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">File Preview</h2>
                    <p className="text-gray-600">Review your file before importing</p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null)
                      setStep('upload')
                    }}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* File Info */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6 mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <File className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{file.name}</h3>
                      <p className="text-gray-600">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 mb-8">
                  <div className="flex">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mr-4">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-yellow-900 mb-3">
                        Before You Import
                      </h3>
                      <div className="text-yellow-800 space-y-2">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                          <span>Contacts with duplicate emails will be skipped</span>
                        </div>
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                          <span>Invalid email addresses will be rejected</span>
                        </div>
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                          <span>This action cannot be undone</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-8 border-t border-gray-100">
                  <button
                    onClick={() => setStep('upload')}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Choose Different File
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
                  >
                    {importing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Importing...
                      </div>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        Import Contacts
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center">
                    {importResult.success > 0 ? (
                      <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center">
                        <AlertCircle className="h-12 w-12 text-red-600" />
                      </div>
                    )}
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Import {importResult.success > 0 ? 'Completed' : 'Failed'}
                  </h2>
                  <p className="text-xl text-gray-600">
                    {importResult.success > 0 
                      ? `Successfully imported ${importResult.success} contacts`
                      : 'No contacts were imported'
                    }
                  </p>
                </div>

                {/* Results Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <motion.div 
                    className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="text-4xl font-bold text-green-600 mb-2">{importResult.success}</div>
                    <div className="text-green-800 font-medium">Successfully Imported</div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="text-4xl font-bold text-yellow-600 mb-2">{importResult.duplicates}</div>
                    <div className="text-yellow-800 font-medium">Duplicates Skipped</div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-4xl font-bold text-red-600 mb-2">{importResult.errors}</div>
                    <div className="text-red-800 font-medium">Errors</div>
                  </motion.div>
                </div>

                {/* Error Details */}
                {importResult.details && importResult.details.length > 0 && (
                  <motion.div 
                    className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h4 className="text-lg font-bold text-red-900 mb-4 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Import Errors
                    </h4>
                    <ul className="text-red-800 space-y-2">
                      {importResult.details.map((error: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-600 mr-2">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex justify-center space-x-4 pt-8 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setFile(null)
                      setImportResult(null)
                      setStep('upload')
                    }}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Import More Contacts
                  </button>
                  <Link
                    href="/contacts"
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-lg"
                  >
                    <Users className="h-5 w-5 mr-2" />
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