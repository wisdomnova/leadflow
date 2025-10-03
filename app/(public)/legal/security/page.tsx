// app/(public)/legal/security/page.tsx
'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Lock, Server, Eye, CheckCircle } from 'lucide-react'

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

function SecurityContent() {
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${THEME_COLORS.success}20` }}>
              <Shield className="w-8 h-8" style={{ color: THEME_COLORS.success }} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Security</h1>
            <p className="text-lg text-gray-600">How we protect your data and ensure platform security</p>
          </motion.div>

          <div className="prose prose-lg max-w-none">
            
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Lock className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.primary }} />
                Data Encryption
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">In Transit</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />TLS 1.3 encryption</li>
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />HTTPS everywhere</li>
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Certificate pinning</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">At Rest</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />AES-256 encryption</li>
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Encrypted backups</li>
                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Key rotation</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Server className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.success }} />
                Infrastructure Security
              </h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Cloud Security</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Hosted on AWS with SOC 2 compliance</li>
                    <li>• Multi-region redundancy and failover</li>
                    <li>• Regular penetration testing</li>
                    <li>• 24/7 security monitoring</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Access Controls</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Multi-factor authentication</li>
                    <li>• Role-based permissions</li>
                    <li>• API rate limiting</li>
                    <li>• Session management</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Eye className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.secondary }} />
                Monitoring & Compliance
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-6 text-center">
                  <h3 className="font-bold text-gray-900 mb-2">GDPR</h3>
                  <p className="text-sm text-gray-700">EU data protection compliance</p>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6 text-center">
                  <h3 className="font-bold text-gray-900 mb-2">SOC 2</h3>
                  <p className="text-sm text-gray-700">Security & availability audits</p>
                </div>

                <div className="bg-purple-50 rounded-xl p-6 text-center">
                  <h3 className="font-bold text-gray-900 mb-2">ISO 27001</h3>
                  <p className="text-sm text-gray-700">Information security standards</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Report Security Issues</h2>
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  If you discover a security vulnerability, please report it responsibly:
                </p>
                <p className="font-medium text-gray-900">security@leadflow.com</p>
                <p className="text-sm text-gray-600 mt-2">
                  We appreciate responsible disclosure and will respond within 24 hours.
                </p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function SecurityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <SecurityContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'