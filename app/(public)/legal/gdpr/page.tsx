// app/(public)/legal/gdpr/page.tsx
'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Globe, Download, Trash2, Eye, UserCheck } from 'lucide-react'

const THEME_COLORS = {
  primary: '#0f66db',
  success: '#25b43d',
  secondary: '#6366f1'
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

function GDPRContent() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Image src="/leadflow.png" alt="LeadFlow" width={200} height={45} className="h-12 w-auto" />
            </Link>
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }}>
          
          <motion.div className="text-center mb-16" variants={staggerItem}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${THEME_COLORS.secondary}20` }}>
              <Globe className="w-8 h-8" style={{ color: THEME_COLORS.secondary }} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">GDPR Compliance</h1>
            <p className="text-lg text-gray-600">Your data rights under EU General Data Protection Regulation</p>
          </motion.div>

          <div className="prose prose-lg max-w-none">
            
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <UserCheck className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.primary }} />
                Your Data Rights
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <Eye className="w-8 h-8 mb-3" style={{ color: THEME_COLORS.primary }} />
                  <h3 className="font-bold text-gray-900 mb-2">Right to Access</h3>
                  <p className="text-gray-700 text-sm">View and download all personal data we store about you</p>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6">
                  <Download className="w-8 h-8 mb-3" style={{ color: THEME_COLORS.success }} />
                  <h3 className="font-bold text-gray-900 mb-2">Data Portability</h3>
                  <p className="text-gray-700 text-sm">Export your data in a machine-readable format</p>
                </div>

                <div className="bg-red-50 rounded-xl p-6">
                  <Trash2 className="w-8 h-8 mb-3" style={{ color: '#dc2626' }} />
                  <h3 className="font-bold text-gray-900 mb-2">Right to Erasure</h3>
                  <p className="text-gray-700 text-sm">Request deletion of your personal data</p>
                </div>

                <div className="bg-purple-50 rounded-xl p-6">
                  <UserCheck className="w-8 h-8 mb-3" style={{ color: THEME_COLORS.secondary }} />
                  <h3 className="font-bold text-gray-900 mb-2">Right to Rectification</h3>
                  <p className="text-gray-700 text-sm">Correct inaccurate or incomplete data</p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Exercise Your Rights</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Self-Service Options</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Access and update your profile in account settings</li>
                    <li>• Export your data from the dashboard</li>
                    <li>• Delete your account and data anytime</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Contact Our DPO</h3>
                  <p className="text-gray-700 mb-2">
                    For complex requests or questions, contact our Data Protection Officer:
                  </p>
                  <p className="font-medium text-gray-900">dpo@leadflow.com</p>
                  <p className="text-sm text-gray-600 mt-1">We respond within 30 days as required by GDPR</p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Legal Basis for Processing</h2>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Contractual Necessity</h3>
                  <p className="text-gray-700 text-sm">Processing required to provide our email automation service</p>
                </div>

                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Legitimate Interest</h3>
                  <p className="text-gray-700 text-sm">Improving our platform and providing customer support</p>
                </div>

                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Consent</h3>
                  <p className="text-gray-700 text-sm">Marketing communications (you can withdraw consent anytime)</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Transfers</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  We use Standard Contractual Clauses (SCCs) for any data transfers outside the EU. 
                  Your data is primarily stored in EU data centers.
                </p>
                <p className="text-gray-700">
                  We ensure adequate protection for international transfers as required by GDPR Article 44-49.
                </p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function GDPRPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <GDPRContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'