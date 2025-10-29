// ./components/campaigns/CampaignTemplates.tsx
'use client'

import { useState } from 'react'
import { Mail, Clock, Users, Target, ChevronRight, Star, X, ChevronDown, ChevronUp, Settings, Zap, Sparkles, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
} 

interface Template {
  id: string
  name: string
  description: string 
  category: 'sales' | 'marketing' | 'onboarding' | 'nurture'  
  emails: number
  duration: string
  subject_line: string
  preview: string
  popular?: boolean 
  steps: {
    subject: string
    content: string
    delay_days: number
    delay_hours: number
  }[]
}

const templates: Template[] = [
  {
    id: 'welcome-series',
    name: 'Welcome Series',
    description: 'Onboard new customers with a warm welcome sequence',
    category: 'onboarding',
    emails: 3,
    duration: '7 days',
    subject_line: 'Welcome to {{company_name}}!',
    preview: 'Thank you for joining us! We\'re excited to help you get started...',
    popular: true,
    steps: [
      {
        subject: 'Welcome to {{company_name}}!',
        content: `Hi {{first_name}},

Welcome to {{company_name}}! We're thrilled to have you on board.

Over the next few days, I'll be sending you some helpful resources to get you started:

• Getting started guide
• Best practices from our top customers  
• Direct access to our support team

If you have any questions, just reply to this email. We're here to help!

Best regards,
{{from_name}}`,
        delay_days: 0,
        delay_hours: 0
      },
      {
        subject: 'Your quick start guide is here',
        content: `Hi {{first_name}},

Hope you're settling in well! 

I wanted to share our quick start guide that will help you get the most out of {{company_name}} in just 10 minutes:

[Link to Quick Start Guide]

This covers:
✓ Setting up your account
✓ Key features to try first
✓ Common questions answered

Take a look when you have a moment, and let me know if you need any help!

Best,
{{from_name}}`,
        delay_days: 2,
        delay_hours: 0
      },
      {
        subject: 'How are things going?',
        content: `Hi {{first_name}},

It's been a week since you joined us at {{company_name}}. How are things going so far?

I'd love to hear:
• What's working well for you?
• Any challenges you're facing?
• Questions about features or best practices?

Just reply to this email - I read every response personally and am here to help you succeed.

Looking forward to hearing from you!

Best,
{{from_name}}

P.S. If you're loving {{company_name}}, we'd appreciate a quick review or referral!`,
        delay_days: 7,
        delay_hours: 0
      }
    ]
  },
  {
    id: 'sales-followup',
    name: 'Sales Follow-up',
    description: 'Professional follow-up sequence for sales prospects',
    category: 'sales',
    emails: 4,
    duration: '14 days',
    subject_line: 'Following up on our conversation',
    preview: 'Hi {{first_name}}, I wanted to follow up on our conversation about...',
    popular: true,
    steps: [
      {
        subject: 'Following up on our conversation',
        content: `Hi {{first_name}},

I wanted to follow up on our conversation about {{company_name}}'s needs.

Based on what you shared, I believe our solution could help you:
• {{benefit_1}}
• {{benefit_2}}  
• {{benefit_3}}

I've attached a case study from a similar company that achieved {{result}}.

Would you be open to a 15-minute call this week to discuss next steps?

Best regards,
{{from_name}}`,
        delay_days: 0,
        delay_hours: 0
      },
      {
        subject: 'Quick question about {{company_name}}',
        content: `Hi {{first_name}},

I know you're busy, so I'll keep this brief.

I was thinking about our conversation and had a quick question: What's your biggest priority for Q4 when it comes to {{relevant_topic}}?

The reason I ask is that I've seen companies like yours save {{time_savings}} by addressing this specific challenge.

Worth a quick chat?

Best,
{{from_name}}`,
        delay_days: 3,
        delay_hours: 0
      },
      {
        subject: 'Resource for {{company_name}}',
        content: `Hi {{first_name}},

I came across this article and thought you might find it interesting: "{{article_title}}"

It talks about {{relevant_insight}} - something that came up in our conversation.

No agenda here, just thought it might be valuable for you and your team at {{company_name}}.

Hope it helps!

{{from_name}}`,
        delay_days: 7,
        delay_hours: 0
      },
      {
        subject: 'Last note from me',
        content: `Hi {{first_name}},

I don't want to be a bother, so this will be my last email for now.

If {{company_name}} ever needs help with {{solution_area}}, please don't hesitate to reach out. We're here when you're ready.

I'll check back in a few months to see how things are going.

Best of luck with everything!

{{from_name}}`,
        delay_days: 14,
        delay_hours: 0
      }
    ]
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Announce and promote your new product launch',
    category: 'marketing',
    emails: 3,
    duration: '10 days',
    subject_line: 'Something exciting is coming to {{company_name}}',
    preview: 'We\'ve been working on something special and can\'t wait to share...',
    steps: [
      {
        subject: 'Something exciting is coming to {{company_name}}',
        content: `Hi {{first_name}},

We've been working on something special and can't wait to share it with you.

In just a few days, we're launching {{product_name}} - a game-changer for {{target_audience}}.

Here's a sneak peek of what's coming:
• {{feature_1}}
• {{feature_2}}
• {{feature_3}}

Stay tuned for the big reveal!

Excited to share more soon,
{{from_name}}`,
        delay_days: 0,
        delay_hours: 0
      },
      {
        subject: '{{product_name}} is here!',
        content: `Hi {{first_name}},

The wait is over! {{product_name}} is officially live and ready for you to explore.

What makes {{product_name}} special:
✓ {{benefit_1}}
✓ {{benefit_2}}
✓ {{benefit_3}}

Early bird special: Use code LAUNCH20 for 20% off your first month (expires in 48 hours)

[Get Started with {{product_name}}]

Questions? Just reply to this email.

Cheers,
{{from_name}}`,
        delay_days: 3,
        delay_hours: 0
      },
      {
        subject: 'How {{product_name}} is changing the game',
        content: `Hi {{first_name}},

The response to {{product_name}} has been incredible! Here's what early users are saying:

"{{testimonial_1}}" - {{customer_name_1}}

"{{testimonial_2}}" - {{customer_name_2}}

Ready to see what the excitement is about?

[Try {{product_name}} Now]

Haven't used your LAUNCH20 discount yet? You have until midnight tonight!

Best,
{{from_name}}`,
        delay_days: 7,
        delay_hours: 0
      }
    ]
  },
  {
    id: 'reengagement',
    name: 'Re-engagement',
    description: 'Win back inactive customers with a gentle approach',
    category: 'nurture',
    emails: 3,
    duration: '14 days',
    subject_line: 'We miss you, {{first_name}}',
    preview: 'It\'s been a while since we\'ve seen you at {{company_name}}...',
    steps: [
      {
        subject: 'We miss you, {{first_name}}',
        content: `Hi {{first_name}},

It's been a while since we've seen you at {{company_name}}, and we wanted to reach out.

We know life gets busy, but we also know we might have let you down somehow. If that's the case, we'd love to make it right.

Is there anything we can help you with? Any feedback on how we can serve you better?

We're here and listening.

Warm regards,
{{from_name}}`,
        delay_days: 0,
        delay_hours: 0
      },
      {
        subject: 'What you\'ve been missing',
        content: `Hi {{first_name}},

Since you've been away, we've made some exciting improvements to {{company_name}}:

• {{new_feature_1}}
• {{new_feature_2}}  
• {{new_feature_3}}

We'd love to show you what's new! Plus, we're offering a special "welcome back" discount just for you.

[Explore What's New - 30% Off]

Hope to see you soon!

{{from_name}}`,
        delay_days: 5,
        delay_hours: 0
      },
      {
        subject: 'One last thing...',
        content: `Hi {{first_name}},

I promise this is my last email about coming back to {{company_name}}.

But before you go, I wanted to ask: What would it take for you to give us another chance?

• A different pricing plan?
• Better customer support?
• New features?
• Something else entirely?

Just reply and let me know. Your feedback helps us serve everyone better.

Thanks for listening,
{{from_name}}

P.S. If you don't want to hear from us anymore, you can unsubscribe below. No hard feelings!`,
        delay_days: 14,
        delay_hours: 0
      }
    ]
  },
  {
    id: 'customer-success',
    name: 'Customer Success Check-in',
    description: 'Proactive outreach to ensure customer satisfaction',
    category: 'nurture',
    emails: 2,
    duration: '30 days',
    subject_line: 'How are things going with {{company_name}}?',
    preview: 'Quick check-in to see how you\'re doing with our service...',
    steps: [
      {
        subject: 'How are things going with {{company_name}}?',
        content: `Hi {{first_name}},

I hope you're doing well! I wanted to do a quick check-in to see how things are going with {{company_name}}.

A few questions for you:
• Are you getting the results you expected?
• Is there anything we could be doing better?
• Any features you'd like to see added?

Your success is our success, so please don't hesitate to reach out if you need anything at all.

Looking forward to hearing from you!

Best,
{{from_name}}
Customer Success Team`,
        delay_days: 0,
        delay_hours: 0
      },
      {
        subject: 'Making the most of {{company_name}}',
        content: `Hi {{first_name}},

I wanted to share some tips to help you get even more value from {{company_name}}:

Pro tip #1: {{tip_1}}
Pro tip #2: {{tip_2}}
Pro tip #3: {{tip_3}}

Also, did you know about our {{advanced_feature}}? It's helped customers like {{similar_company}} achieve {{impressive_result}}.

Want to learn more? I'd be happy to set up a quick 15-minute optimization call.

[Schedule Optimization Call]

Always here to help,
{{from_name}}`,
        delay_days: 30,
        delay_hours: 0
      }
    ]
  }
]

interface CampaignTemplatesProps {
  onSelectTemplate: (template: Template) => void
  onClose: () => void
}

export default function CampaignTemplates({ onSelectTemplate, onClose }: CampaignTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false)
  const [templatesCollapsed, setTemplatesCollapsed] = useState(false)
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null)

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'sales', name: 'Sales', count: templates.filter(t => t.category === 'sales').length },
    { id: 'marketing', name: 'Marketing', count: templates.filter(t => t.category === 'marketing').length },
    { id: 'onboarding', name: 'Onboarding', count: templates.filter(t => t.category === 'onboarding').length },
    { id: 'nurture', name: 'Customer Success', count: templates.filter(t => t.category === 'nurture').length }
  ]

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  const handleUseTemplate = async () => {
    if (selectedTemplate) {
      setLoadingTemplate(selectedTemplate.id)
      
      try {
        // Add small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 500))
        onSelectTemplate(selectedTemplate)
      } catch (error) {
        console.error('Error selecting template:', error)
      } finally {
        setLoadingTemplate(null)
      }
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales':
        return THEME_COLORS.success
      case 'marketing':
        return THEME_COLORS.primary
      case 'onboarding':
        return THEME_COLORS.secondary
      case 'nurture':
        return THEME_COLORS.accent
      default:
        return '#6b7280'
    }
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-200"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Choose a Template</h2>
              <p className="text-gray-600 mt-1 text-lg">Start with a proven email sequence and customize it for your needs</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
              {/* Categories */}
              <div className="p-6">
                <button
                  onClick={() => setCategoriesCollapsed(!categoriesCollapsed)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 hover:text-gray-700 transition-colors"
                >
                  <span>Categories</span>
                  {categoriesCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
                
                <AnimatePresence>
                  {!categoriesCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            selectedCategory === category.id
                              ? 'text-white shadow-md'
                              : 'text-gray-700 hover:bg-white hover:shadow-sm'
                          }`}
                          style={selectedCategory === category.id ? { backgroundColor: THEME_COLORS.primary } : {}}
                        >
                          <div className="flex items-center justify-between">
                            <span>{category.name}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-xl font-semibold ${
                              selectedCategory === category.id
                                ? 'bg-white bg-opacity-20 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {category.count}
                            </span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Template List */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => setTemplatesCollapsed(!templatesCollapsed)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 hover:text-gray-700 transition-colors"
                >
                  <span>Templates ({filteredTemplates.length})</span>
                  {templatesCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
                
                <AnimatePresence>
                  {!templatesCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      {filteredTemplates.map((template) => (
                        <motion.div
                          key={template.id}
                          onClick={() => setSelectedTemplate(template)}
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedTemplate?.id === template.id
                              ? 'shadow-md border-2'
                              : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                          style={selectedTemplate?.id === template.id ? {
                            borderColor: THEME_COLORS.primary
                          } : {}}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 flex items-center text-sm">
                              {template.name}
                              {template.popular && (
                                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">
                                  <Star className="h-3 w-3 mr-1 fill-current inline" />
                                  Popular
                                </span>
                              )}
                            </h4>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                            {template.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center font-medium">
                                <Mail className="h-3 w-3 mr-1" />
                                {template.emails}
                              </span>
                              <span className="flex items-center font-medium">
                                <Clock className="h-3 w-3 mr-1" />
                                {template.duration}
                              </span>
                            </div>
                            <span 
                              className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-semibold"
                              style={{ color: getCategoryColor(template.category) }}
                            >
                              {template.category}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto">
              {selectedTemplate ? (
                <div className="p-8">
                  {/* Template Header */}
                  <div className="mb-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
                          {selectedTemplate.name}
                          {selectedTemplate.popular && (
                            <span className="ml-3 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-xl text-sm font-semibold flex items-center">
                              <Star className="h-4 w-4 mr-1.5 fill-current" />
                              Popular Choice
                            </span>
                          )}
                        </h3>
                        <p className="text-xl text-gray-600 mb-4 leading-relaxed">{selectedTemplate.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center font-medium">
                            <Mail className="h-4 w-4 mr-2" />
                            {selectedTemplate.emails} emails
                          </span>
                          <span className="flex items-center font-medium">
                            <Clock className="h-4 w-4 mr-2" />
                            {selectedTemplate.duration}
                          </span>
                          <span 
                            className="px-3 py-1.5 bg-gray-100 rounded-xl text-sm font-semibold"
                            style={{ color: getCategoryColor(selectedTemplate.category) }}
                          >
                            {selectedTemplate.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* First Email Preview */}
                    <div className="rounded-2xl p-6 border border-gray-200 bg-gray-50 shadow-sm">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Mail className="h-5 w-5 mr-2 text-gray-600" />
                        First Email Preview
                      </h4>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Subject:</strong> <span className="text-gray-900">{selectedTemplate.subject_line}</span>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {selectedTemplate.preview}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Sequence */}
                  <div className="mb-8">
                    <h4 className="text-2xl font-bold text-gray-900 mb-6">Complete Email Sequence</h4>
                    <div className="space-y-6">
                      {selectedTemplate.steps.map((step, index) => (
                        <motion.div 
                          key={index} 
                          className="flex"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex-shrink-0 mr-6">
                            <div 
                              className="w-12 h-12 text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm"
                              style={{ backgroundColor: THEME_COLORS.primary }}
                            >
                              {index + 1}
                            </div>
                            {index < selectedTemplate.steps.length - 1 && (
                              <div className="w-0.5 h-16 bg-gray-300 mx-auto mt-4 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="text-lg font-semibold text-gray-900">{step.subject}</h5>
                                <span className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl">
                                  {step.delay_days === 0 && step.delay_hours === 0 
                                    ? 'Send immediately' 
                                    : `Wait ${step.delay_days}d ${step.delay_hours}h`}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 rounded-xl p-4 leading-relaxed border border-gray-100">
                                {step.content.length > 300 
                                  ? step.content.substring(0, 300) + '...' 
                                  : step.content}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Variables Notice */}
                  <div className="rounded-2xl p-6 mb-8 border border-gray-200 bg-blue-50">
                    <h5 className="font-bold text-gray-900 mb-3 flex items-center text-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                        <Settings className="h-5 w-5 text-blue-600" />
                      </div>
                      Smart Personalization
                    </h5>
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                      This template uses smart variables that automatically personalize each email based on your contact data:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['{{first_name}}', '{{company_name}}', '{{from_name}}'].map((variable) => (
                        <code 
                          key={variable} 
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl text-xs font-mono font-semibold"
                        >
                          {variable}
                        </code>
                      ))}
                    </div>
                  </div>

                  {/* Updated Action Bar */}
                  <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 mt-8">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedTemplate(null)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                      >
                        Back to Templates
                      </button>
                      
                      <button
                        onClick={handleUseTemplate}
                        disabled={!!loadingTemplate}
                        className="inline-flex items-center px-8 py-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: THEME_COLORS.primary }}
                      >
                        {loadingTemplate === selectedTemplate.id ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Applying Template...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 mr-2" />
                            Use This Template
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Mail className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Select a Template</h3>
                    <p className="text-lg text-gray-500 max-w-md leading-relaxed">
                      Choose a template from the sidebar to see the preview and complete email sequence.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}