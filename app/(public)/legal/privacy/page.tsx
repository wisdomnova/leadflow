// app/(public)/legal/privacy/page.tsx
'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Database, Eye, Lock } from 'lucide-react'

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

function PrivacyContent() {
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
              <Shield className="w-8 h-8" style={{ color: THEME_COLORS.primary }} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600">Last updated: January 2024</p>
          </motion.div>

          <div className="prose prose-lg max-w-none">
            
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Eye className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.primary }} />
                Information We Collect
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Account Information</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Name, email address, and company information</li>
                    <li>• Billing information (processed securely by Stripe)</li>
                    <li>• Profile preferences and settings</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Usage Data</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Campaign performance metrics</li>
                    <li>• Feature usage and interaction patterns</li>
                    <li>• Device and browser information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Contact Data</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Contact lists you upload</li>
                    <li>• Email content and templates</li>
                    <li>• Campaign results and engagement data</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Database className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.success }} />
                How We Use Your Information
              </h2>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Service Delivery</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Provide and maintain our email automation service</li>
                  <li>• Process and send your email campaigns</li>
                  <li>• Generate analytics and performance reports</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-3">Improvement & Support</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Improve our platform and develop new features</li>
                  <li>• Provide customer support and troubleshooting</li>
                  <li>• Send important service updates</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Lock className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.secondary }} />
                Data Protection
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Security Measures</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• 256-bit SSL encryption</li>
                    <li>• Regular security audits</li>
                    <li>• Secure data centers</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Data Rights</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Access your data anytime</li>
                    <li>• Request data deletion</li>
                    <li>• Data portability options</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  Questions about this privacy policy? Contact our privacy team:
                </p>
                <p className="font-medium text-gray-900">privacy@leadflow.com</p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <PrivacyContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'