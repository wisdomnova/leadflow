// app/(public)/support/docs/page.tsx
'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Book, Code, Globe, Key, Database, Webhook } from 'lucide-react'

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

function DocsContent() {
  const docSections = [
    {
      icon: Book,
      title: 'Getting Started',
      description: 'Quick start guide and basic concepts',
      links: [
        'Authentication',
        'Making your first API call',
        'Rate limits and best practices',
        'Error handling'
      ]
    },
    {
      icon: Database,
      title: 'Contacts API',
      description: 'Manage contacts and lists programmatically',
      links: [
        'Create and update contacts',
        'List management',
        'Contact segmentation',
        'Bulk operations'
      ]
    },
    {
      icon: Globe,
      title: 'Campaigns API',
      description: 'Create and manage email campaigns',
      links: [
        'Campaign creation',
        'Schedule and send',
        'Template management',
        'Performance tracking'
      ]
    },
    {
      icon: Webhook,
      title: 'Webhooks',
      description: 'Real-time notifications and events',
      links: [
        'Setting up webhooks',
        'Event types',
        'Webhook security',
        'Testing webhooks'
      ]
    }
  ]

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

      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }}>
          
          <motion.div className="text-center mb-16" variants={staggerItem}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${THEME_COLORS.secondary}20` }}>
              <Book className="w-8 h-8" style={{ color: THEME_COLORS.secondary }} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
            <p className="text-lg text-gray-600">Complete guides and API reference for LeadFlow</p>
          </motion.div>

          {/* Quick Start */}
          <motion.div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-12" variants={staggerItem}>
            <div className="flex items-center mb-4">
              <Code className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.primary }} />
              <h2 className="text-2xl font-bold text-gray-900">API Quick Start</h2>
            </div>
            <p className="text-gray-700 mb-6">
              Get started with the LeadFlow API in minutes. Authenticate and make your first request.
            </p>
            
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <code className="text-green-400 text-sm">
                curl -X GET "https://api.leadflow.com/v1/contacts" \<br/>
                &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json"
              </code>
            </div>
            
            <Link href="#" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
              <Key className="w-4 h-4 mr-2" />
              Get your API key
            </Link>
          </motion.div>

          {/* Documentation Sections */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {docSections.map((section, index) => (
              <motion.div
                key={section.title}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                variants={staggerItem}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: `${THEME_COLORS.success}20` }}>
                    <section.icon className="w-6 h-6" style={{ color: THEME_COLORS.success }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href="#" className="text-blue-600 hover:text-blue-700 text-sm">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* SDK and Tools */}
          <motion.div className="bg-gray-50 rounded-xl p-8" variants={staggerItem}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">SDKs & Tools</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Code className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">JavaScript SDK</h3>
                <p className="text-sm text-gray-600">Official Node.js library</p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Code className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Python SDK</h3>
                <p className="text-sm text-gray-600">Python integration library</p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Webhook className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Postman Collection</h3>
                <p className="text-sm text-gray-600">Ready-to-use API collection</p>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}

export default function DocsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <DocsContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'