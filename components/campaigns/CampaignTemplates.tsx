// ./components/campaigns/CampaignTemplates.tsx
'use client'

import { useState } from 'react'
import { Mail, Clock, Users, Target, ChevronRight, Star } from 'lucide-react'

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
    subject_line: 'Welcome to {{company_name}}! 🎉',
    preview: 'Thank you for joining us! We\'re excited to help you get started...',
    popular: true,
    steps: [
      {
        subject: 'Welcome to {{company_name}}! 🎉',
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
        subject: 'Your quick start guide is here 📖',
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
        subject: 'How are things going? 🤔',
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

P.S. If you're loving {{company_name}}, we'd appreciate a quick review or referral! 🙏`,
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
    subject_line: 'Something exciting is coming to {{company_name}} 🚀',
    preview: 'We\'ve been working on something special and can\'t wait to share...',
    steps: [
      {
        subject: 'Something exciting is coming to {{company_name}} 🚀',
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
        subject: '🎉 {{product_name}} is here!',
        content: `Hi {{first_name}},

The wait is over! {{product_name}} is officially live and ready for you to explore.

What makes {{product_name}} special:
✓ {{benefit_1}}
✓ {{benefit_2}}
✓ {{benefit_3}}

🎁 Early bird special: Use code LAUNCH20 for 20% off your first month (expires in 48 hours)

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
    subject_line: 'We miss you, {{first_name}} 💙',
    preview: 'It\'s been a while since we\'ve seen you at {{company_name}}...',
    steps: [
      {
        subject: 'We miss you, {{first_name}} 💙',
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
        subject: 'What you\'ve been missing ✨',
        content: `Hi {{first_name}},

Since you've been away, we've made some exciting improvements to {{company_name}}:

🆕 {{new_feature_1}}
🆕 {{new_feature_2}}  
🆕 {{new_feature_3}}

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

P.S. If you don't want to hear from us anymore, you can unsubscribe below. No hard feelings! 💙`,
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

💡 Pro tip #1: {{tip_1}}
💡 Pro tip #2: {{tip_2}}
💡 Pro tip #3: {{tip_3}}

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

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'sales', name: 'Sales' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'onboarding', name: 'Onboarding' },
    { id: 'nurture', name: 'Customer Success' }
  ]

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white min-h-[90vh]">
        <div className="flex h-full">
          {/* Left Sidebar */}
          <div className="w-1/3 border-r border-gray-200 pr-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Choose a Template</h3>
              <p className="text-sm text-gray-500">
                Start with a proven email sequence that you can customize for your needs.
              </p>
            </div>

            {/* Categories */}
            <div className="mb-4">
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Template List */}
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      {template.name}
                      {template.popular && (
                        <Star className="h-4 w-4 text-yellow-500 ml-2 fill-current" />
                      )}
                    </h4>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {template.emails} emails
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {template.duration}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 pl-6">
            {selectedTemplate ? (
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                        {selectedTemplate.name}
                        {selectedTemplate.popular && (
                          <Star className="h-5 w-5 text-yellow-500 ml-2 fill-current" />
                        )}
                      </h3>
                      <p className="text-gray-600 mt-1">{selectedTemplate.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">
                        {selectedTemplate.emails} emails • {selectedTemplate.duration}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedTemplate.category === 'sales' ? 'bg-green-100 text-green-800' :
                        selectedTemplate.category === 'marketing' ? 'bg-blue-100 text-blue-800' :
                        selectedTemplate.category === 'onboarding' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {selectedTemplate.category}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">First Email Preview:</div>
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Subject:</strong> {selectedTemplate.subject_line}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedTemplate.preview}
                    </div>
                  </div>
                </div>

                {/* Email Sequence */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Email Sequence</h4>
                  <div className="space-y-4">
                    {selectedTemplate.steps.map((step, index) => (
                      <div key={index} className="flex">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-4">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900">{step.subject}</h5>
                              <span className="text-xs text-gray-500">
                                {step.delay_days === 0 && step.delay_hours === 0 
                                  ? 'Immediately' 
                                  : `After ${step.delay_days}d ${step.delay_hours}h`}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 whitespace-pre-line">
                              {step.content.substring(0, 200)}...
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variables Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h5 className="font-medium text-yellow-800 mb-2">📝 Personalization Variables</h5>
                  <p className="text-sm text-yellow-700">
                    This template uses variables like <code>{`{{first_name}}`}</code> and <code>{`{{company_name}}`}</code> 
                    that will be automatically replaced with your contact's information.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUseTemplate}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    Use This Template
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
                <p className="text-gray-500">
                  Choose a template from the list to see the preview and email sequence.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}