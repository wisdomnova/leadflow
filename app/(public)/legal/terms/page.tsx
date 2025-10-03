// app/(public)/legal/terms/page.tsx
'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Users, CreditCard, AlertTriangle } from 'lucide-react'

const THEME_COLORS = {
  primary: '#0f66db',
  success: '#25b43d',
  warning: '#dc2626'
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

function TermsContent() {
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${THEME_COLORS.primary}20` }}>
              <FileText className="w-8 h-8" style={{ color: THEME_COLORS.primary }} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600">Last updated: January 2024</p>
          </motion.div>

          <div className="prose prose-lg max-w-none">
            
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Users className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.primary }} />
                Account Terms
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Account Registration</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• You must be 18 years or older to use LeadFlow</li>
                    <li>• Provide accurate and complete registration information</li>
                    <li>• Maintain the security of your account credentials</li>
                    <li>• One person or legal entity per account</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Acceptable Use</h3>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-red-800 mb-2">Prohibited Activities:</h4>
                        <ul className="space-y-1 text-red-700 text-sm">
                          <li>• Sending spam or unsolicited emails</li>
                          <li>• Using purchased or scraped email lists</li>
                          <li>• Violating CAN-SPAM, GDPR, or other regulations</li>
                          <li>• Sending malicious or harmful content</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <CreditCard className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.success }} />
                Billing Terms
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Payment</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Monthly or annual billing cycles</li>
                    <li>• Automatic renewal unless cancelled</li>
                    <li>• All payments processed by Stripe</li>
                    <li>• Refunds available within 30 days</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Cancellation</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Cancel anytime from your account</li>
                    <li>• No cancellation fees</li>
                    <li>• Access until end of billing period</li>
                    <li>• Data export available for 30 days</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Availability</h2>
              <div className="bg-blue-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  We strive for 99.9% uptime but cannot guarantee uninterrupted service. 
                  Scheduled maintenance will be announced in advance.
                </p>
                <p className="text-gray-700">
                  We reserve the right to suspend accounts that violate these terms 
                  or engage in activities that could harm our platform or other users.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  Questions about these terms? Contact our legal team:
                </p>
                <p className="font-medium text-gray-900">legal@leadflow.com</p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <TermsContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'