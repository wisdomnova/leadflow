// ./app/(dashboard)/help/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  Search,
  ChevronRight,
  ChevronDown,
  Book,
  Video,
  FileText,
  Zap,
  Users,
  Settings,
  Target,
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import clsx from 'clsx'

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
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
  animate: { opacity: 1, y: 0 }
}

// FAQ Data
const faqData = [
  {
    category: 'Getting Started',
    icon: Zap,
    color: THEME_COLORS.primary,
    questions: [
      {
        question: 'How do I create my first email campaign?',
        answer: 'Navigate to Campaigns > Create Campaign, choose a template or start from scratch, set up your campaign details, build your email sequence, and select your contacts.'
      },
      {
        question: 'How do I import my contacts?',
        answer: 'Go to Contacts > Import, upload a CSV file with your contact data, map the fields correctly, and review before importing.'
      },
      {
        question: 'What email templates are available?',
        answer: 'We offer professionally designed templates for sales, marketing, onboarding, and customer success campaigns. Browse them in the Templates section.'
      }
    ]
  },
  {
    category: 'Campaigns',
    icon: Target,
    color: THEME_COLORS.success,
    questions: [
      {
        question: 'How do email sequences work?',
        answer: 'Email sequences allow you to send multiple emails over time with delays between each step. You can customize timing, content, and conditions for each email.'
      },
      {
        question: 'Can I personalize my emails?',
        answer: 'Yes! Use variables like {{first_name}}, {{company_name}}, and {{from_name}} to automatically personalize emails based on contact data.'
      },
      {
        question: 'How do I track campaign performance?',
        answer: 'View detailed analytics including open rates, click rates, replies, and conversions in your campaign dashboard.'
      }
    ]
  },
  {
    category: 'Contacts',
    icon: Users,
    color: THEME_COLORS.secondary,
    questions: [
      {
        question: 'What contact information can I store?',
        answer: 'Store names, emails, companies, phone numbers, and custom fields. All data is securely encrypted and GDPR compliant.'
      },
      {
        question: 'How do I organize my contacts?',
        answer: 'Use tags, custom fields, and filters to organize and segment your contacts for targeted campaigns.'
      },
      {
        question: 'Can I export my contact data?',
        answer: 'Yes, you can export your contacts as CSV files at any time from the Contacts page.'
      }
    ]
  },
  {
    category: 'Account & Settings',
    icon: Settings,
    color: THEME_COLORS.accent,
    questions: [
      {
        question: 'How do I update my profile?',
        answer: 'Go to Settings > Profile to update your name, timezone, language preferences, and notification settings.'
      },
      {
        question: 'Can I change my organization details?',
        answer: 'Organization details are managed by your admin. Contact your organization admin for changes.'
      },
      {
        question: 'How do I reset my password?',
        answer: 'Visit Settings > Security to change your password, or use the "Forgot Password" link on the sign-in page.'
      }
    ]
  }
]

// FAQ Item Component
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
      >
        <span className="font-medium text-gray-900">{question}</span>
        <ChevronDown className={clsx(
          "h-5 w-5 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 bg-gray-50 overflow-hidden"
          >
            <div className="px-6 py-4 text-sm text-gray-600 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter FAQs based on search query
  const filteredFAQs = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => 
    selectedCategory ? category.category === selectedCategory : category.questions.length > 0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-6">
        
        {/* Header */}
        <motion.div 
          className="mb-8 text-center"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How can we help you?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions, browse our guides, or get in touch with our team
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          className="mb-12"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
        >
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help articles, guides, or FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500 shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
              style={{ 
                '--tw-ring-color': THEME_COLORS.primary
              } as any}
            />
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div 
          className="mb-12"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Popular Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Book,
                title: 'User Guide',
                description: 'Complete guide to using LeadFlow',
                color: THEME_COLORS.primary,
                comingSoon: true
              },
              {
                icon: Video,
                title: 'Video Tutorials',
                description: 'Step-by-step video walkthroughs',
                color: THEME_COLORS.secondary,
                comingSoon: true
              },
              {
                icon: FileText,
                title: 'Best Practices',
                description: 'Tips for effective email campaigns',
                color: THEME_COLORS.accent,
                comingSoon: true
              }
            ].map((resource, index) => {
              const Icon = resource.icon
              return (
                <motion.div
                  key={resource.title}
                  className="relative bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group"
                  variants={staggerItem}
                  transition={{ delay: index * 0.1 }}
                >
                  {resource.comingSoon && (
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-xl text-xs font-semibold">
                        Coming Soon
                      </span>
                    </div>
                  )}
                  
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: resource.color }}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-gray-600">{resource.description}</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className={clsx(
                      "inline-flex items-center text-sm font-medium transition-colors",
                      resource.comingSoon 
                        ? "text-gray-400 cursor-not-allowed" 
                        : "hover:underline cursor-pointer"
                    )} style={!resource.comingSoon ? { color: resource.color } : {}}>
                      {resource.comingSoon ? 'Coming Soon' : 'Learn More'}
                      {!resource.comingSoon && <ChevronRight className="h-4 w-4 ml-1" />}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* FAQ Categories */}
        <motion.div 
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setSelectedCategory(null)}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                !selectedCategory 
                  ? "text-white shadow-md" 
                  : "text-gray-700 bg-gray-100 hover:bg-gray-200"
              )}
              style={!selectedCategory ? { backgroundColor: THEME_COLORS.primary } : {}}
            >
              All Categories
            </button>
            {faqData.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.category}
                  onClick={() => setSelectedCategory(category.category)}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2",
                    selectedCategory === category.category 
                      ? "text-white shadow-md" 
                      : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                  )}
                  style={selectedCategory === category.category ? { backgroundColor: category.color } : {}}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.category}</span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* FAQ Sections */}
        <motion.div 
          className="space-y-8 mb-12"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {filteredFAQs.map((category, categoryIndex) => {
            const Icon = category.icon
            return (
              <motion.div 
                key={category.category}
                className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
                variants={staggerItem}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: category.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{category.category}</h3>
                  <span className="text-sm text-gray-500">({category.questions.length} questions)</span>
                </div>
                
                <div className="p-6 space-y-4">
                  {category.questions.map((faq, index) => (
                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Contact Support Section */}
        <motion.div 
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-lg p-8 text-center"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ delay: 0.5 }}
        >
          <div className="max-w-2xl mx-auto">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md"
              style={{ backgroundColor: THEME_COLORS.primary }}
            >
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Still need help?
            </h3>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Our customer support team is currently being set up to provide you with the best possible assistance. 
              We'll be ready to help you soon!
            </p>

            {/* Coming Soon Support Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  icon: MessageCircle,
                  title: 'Live Chat',
                  description: '24/7 instant support',
                  comingSoon: true
                },
                {
                  icon: Mail,
                  title: 'Email Support',
                  description: 'Get help via email',
                  comingSoon: true
                },
                {
                  icon: Phone,
                  title: 'Phone Support',
                  description: 'Talk to our experts',
                  comingSoon: true
                }
              ].map((option, index) => {
                const Icon = option.icon
                return (
                  <div
                    key={option.title}
                    className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md"
                      style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: THEME_COLORS.primary }} />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{option.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                    <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-xl text-xs font-semibold">
                      <Clock className="h-3 w-3 mr-1" />
                      Coming Soon
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 mr-2" style={{ color: THEME_COLORS.success }} />
                What to expect
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span>Expert technical support</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span>Fast response times</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span>Comprehensive help guides</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span>Video tutorials & walkthroughs</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}