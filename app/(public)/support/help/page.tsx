// app/(public)/support/help/page.tsx
'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, HelpCircle, Mail, Zap, Users, BarChart3, Settings, Search } from 'lucide-react'

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

function HelpContent() {
  const helpCategories = [
    {
      icon: Zap,
      title: 'Getting Started',
      description: 'Set up your first campaign and send emails',
      articles: [
        'Creating your first campaign',
        'Importing contacts',
        'Email template basics',
        'Sending your first sequence'
      ]
    },
    {
      icon: Users,
      title: 'Contact Management',
      description: 'Organize and manage your contact lists',
      articles: [
        'Uploading contact lists',
        'Segmenting contacts',
        'Managing unsubscribes',
        'Contact data fields'
      ]
    },
    {
      icon: Mail,
      title: 'Email Campaigns',
      description: 'Create and optimize email sequences',
      articles: [
        'Writing effective subject lines',
        'Personalizing emails',
        'A/B testing campaigns',
        'Follow-up sequences'
      ]
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Track and improve campaign performance',
      articles: [
        'Understanding metrics',
        'Reading campaign reports',
        'Improving open rates',
        'Tracking conversions'
      ]
    },
    {
      icon: Settings,
      title: 'Account Settings',
      description: 'Manage your account and integrations',
      articles: [
        'Profile and billing',
        'Team management',
        'API integrations',
        'Security settings'
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${THEME_COLORS.primary}20` }}>
              <HelpCircle className="w-8 h-8" style={{ color: THEME_COLORS.primary }} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
            <p className="text-lg text-gray-600">Find answers and learn how to get the most out of LeadFlow</p>
          </motion.div>

          {/* Search Bar */}
          <motion.div className="mb-12" variants={staggerItem}>
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search help articles..."
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Help Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {helpCategories.map((category, index) => (
              <motion.div
                key={category.title}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                variants={staggerItem}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: `${THEME_COLORS.primary}20` }}>
                    <category.icon className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <ul className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <Link href="#" className="text-blue-600 hover:text-blue-700 text-sm">
                        {article}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <motion.div className="bg-gray-50 rounded-xl p-8" variants={staggerItem}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Still Need Help?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/support/contact" className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <Mail className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.success }} />
                  <h3 className="font-bold text-gray-900">Contact Support</h3>
                </div>
                <p className="text-gray-600 text-sm">Get personalized help from our support team</p>
              </Link>

              <Link href="/support/docs" className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <HelpCircle className="w-6 h-6 mr-3" style={{ color: THEME_COLORS.secondary }} />
                  <h3 className="font-bold text-gray-900">Documentation</h3>
                </div>
                <p className="text-gray-600 text-sm">Detailed guides and API documentation</p>
              </Link>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <HelpContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'