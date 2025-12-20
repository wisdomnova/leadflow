// Campaign templates for Leadflow - B2B email outreach templates
// Non-spam, professional, personalized templates for sales & outreach

export interface CampaignTemplate {
  id: string
  name: string
  category: 'Cold Outreach' | 'Follow-up' | 'Meeting Request' | 'Re-engagement' | 'Thank You' | 'Partnership' | 'Case Study' | 'Newsletter'
  subject: string
  preview: string
  body: string
  timesUsed: number
  openRate: number
  clickRate: number
  tags: string[]
  deviceOptimization: 'mobile' | 'desktop' | 'both'
  isMostUsed?: boolean
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  // Cold Outreach Templates
  {
    id: 'cold-intro-personalized',
    name: 'Cold Intro - Personalized',
    category: 'Cold Outreach',
    subject: '{{firstName}} - quick thought on {{company}}',
    preview: 'Hi {{firstName}}, I noticed something about {{company}}...',
    body: `Hi {{firstName}},

I came across {{company}}'s recent {{trigger: product launch/announcement/news}} and thought of you.

The reason I'm reaching out is that most {{company type}} struggle with {{pain point}}. We've helped similar companies like {{similar company}} reduce this by {{metric}}.

Not sure if it's relevant, but thought worth a quick chat?

{{senderName}}
{{senderTitle}}
{{senderCompany}}`,
    timesUsed: 287,
    openRate: 48.2,
    clickRate: 12.5,
    tags: ['cold', 'personalized', 'high-converting'],
    deviceOptimization: 'both',
    isMostUsed: true,
  },
  {
    id: 'cold-value-prop',
    name: 'Cold Outreach - Value Prop',
    category: 'Cold Outreach',
    subject: 'Idea for {{company}}',
    preview: 'Hi {{firstName}}, I have a quick idea that could help {{company}}...',
    body: `Hi {{firstName}},

I work with {{company type}} companies and help them {{desired outcome}}.

With {{company}}'s {{noted strength}}, I think there's an opportunity to {{specific improvement}}.

Would a quick 15-min chat make sense?

{{senderName}}`,
    timesUsed: 156,
    openRate: 52.7,
    clickRate: 14.2,
    tags: ['cold', 'value-focused', 'specific'],
    deviceOptimization: 'both',
  },
  {
    id: 'cold-problem-aware',
    name: 'Cold Outreach - Problem Aware',
    category: 'Cold Outreach',
    subject: '{{firstName}} - {{company}} + {{solution area}}',
    preview: 'Hi {{firstName}}, I noticed {{company}} is working on {{area}}...',
    body: `Hi {{firstName}},

Saw {{company}} recently {{recent activity}}.

I'm guessing {{relevant challenge}} might be on your radar?

Most {{industry}} teams we work with spend {{time}} on this monthly. We've helped them cut that by {{improvement}}.

Curious if that's something you're tackling right now.

{{senderName}}
{{senderTitle}}`,
    timesUsed: 203,
    openRate: 54.1,
    clickRate: 15.8,
    tags: ['cold', 'problem-aware', 'research-backed'],
    deviceOptimization: 'desktop',
  },

  // Follow-up Templates
  {
    id: 'followup-1',
    name: 'Follow-up #1 - Gentle Reminder',
    category: 'Follow-up',
    subject: 'Re: {{original subject}}',
    preview: '{{firstName}}, just wanted to check if this resonated...',
    body: `Hi {{firstName}},

Just wanted to check in on my previous email - no pressure at all.

If now's not a good time, totally understand. Happy to reconnect in a few weeks if that works better.

Either way, hope it was useful to think about.

{{senderName}}`,
    timesUsed: 412,
    openRate: 42.1,
    clickRate: 9.3,
    tags: ['followup', 'soft', 'low-pressure'],
    deviceOptimization: 'mobile',
  },
  {
    id: 'followup-2',
    name: 'Follow-up #2 - Value Add',
    category: 'Follow-up',
    subject: 'Thought of you - {{company}}',
    preview: 'Hi {{firstName}}, I found something that might help...',
    body: `Hi {{firstName}},

Came across this {{resource type: article/report/case study}} and immediately thought of you.

It covers {{topic}} - specifically the {{relevant section}} part that relates to what we discussed.

Check it out if you get a chance. Happy to discuss if any of it sparks ideas.

{{senderName}}`,
    timesUsed: 189,
    openRate: 47.3,
    clickRate: 11.7,
    tags: ['followup', 'value-add', 'resource-sharing'],
    deviceOptimization: 'both',
  },
  {
    id: 'followup-3',
    name: 'Follow-up #3 - Final Touch',
    category: 'Follow-up',
    subject: 'Last one: {{company}} opportunity',
    preview: '{{firstName}}, last attempt to help you think through this...',
    body: `Hi {{firstName}},

I realize I might be reaching you at the wrong time or this might just not be relevant for {{company}} right now.

Before I stop bugging you - would it make sense to grab 15 mins? I'm pretty confident we could add value.

No worries if not. All the best!

{{senderName}}`,
    timesUsed: 134,
    openRate: 38.9,
    clickRate: 7.2,
    tags: ['followup', 'final', 'soft-close'],
    deviceOptimization: 'mobile',
  },

  // Meeting Request Templates
  {
    id: 'meeting-direct',
    name: 'Meeting Request - Direct',
    category: 'Meeting Request',
    subject: '15 mins with {{firstName}}?',
    preview: 'Hi {{firstName}}, I think we should talk for 15 minutes...',
    body: `Hi {{firstName}},

I think we should grab 15 mins to discuss {{topic}}.

No commitment - just want to explore if there's a fit and if we can help {{company}}.

Does sometime next week work? I'm pretty flexible.

{{senderName}}`,
    timesUsed: 276,
    openRate: 51.3,
    clickRate: 18.4,
    tags: ['meeting', 'direct', 'time-bound'],
    deviceOptimization: 'both',
    isMostUsed: true,
  },
  {
    id: 'meeting-scarcity',
    name: 'Meeting Request - Calendar Link',
    category: 'Meeting Request',
    subject: '{{firstName}} - let\'s sync up',
    preview: 'Hi {{firstName}}, I have a few slots this week...',
    body: `Hi {{firstName}},

Let's grab 15 mins to discuss {{topic}}.

I've got some openings {{day}} and {{day}} - grab a time that works: {{calendar link}}

Looking forward to it.

{{senderName}}`,
    timesUsed: 198,
    openRate: 53.7,
    clickRate: 21.2,
    tags: ['meeting', 'calendar', 'friction-free'],
    deviceOptimization: 'desktop',
  },

  // Re-engagement Templates
  {
    id: 'reengagement-value',
    name: 'Re-engagement - Value Check-in',
    category: 'Re-engagement',
    subject: '{{firstName}}, still relevant?',
    preview: 'Hi {{firstName}}, checking if now\'s a better time to discuss...',
    body: `Hi {{firstName}},

It's been {{time}} since we last chatted. Wanted to see if things have changed on your end.

Are you still dealing with {{original pain point}}? Or have you moved past it?

Genuinely curious - either way, would love to catch up.

{{senderName}}`,
    timesUsed: 87,
    openRate: 38.7,
    clickRate: 8.9,
    tags: ['reengagement', 'check-in', 'low-pressure'],
    deviceOptimization: 'mobile',
  },
  {
    id: 'reengagement-new-offering',
    name: 'Re-engagement - New Solution',
    category: 'Re-engagement',
    subject: '{{firstName}} - we built something new',
    preview: 'Hi {{firstName}}, we just launched something that could help...',
    body: `Hi {{firstName}},

Since we last talked, we've built {{new feature/product}}.

I remember {{company}} was struggling with {{original pain point}} - this new solution directly addresses that.

Thought you should know about it.

{{senderName}}`,
    timesUsed: 145,
    openRate: 44.2,
    clickRate: 10.5,
    tags: ['reengagement', 'product-update', 'timely'],
    deviceOptimization: 'both',
  },

  // Thank You Templates
  {
    id: 'thankyou-post-call',
    name: 'Thank You - Post Call',
    category: 'Thank You',
    subject: 'Thanks for the time, {{firstName}}',
    preview: 'Thanks for taking the time today. Here\'s what we discussed...',
    body: `Hi {{firstName}},

Thanks for taking the time to chat this morning. Really appreciated the insights on {{topic}}.

As discussed, here's {{next step: resource/intro/info}}: {{link}}

Let's keep the momentum going. I'll follow up with {{action item}} by {{date}}.

Talk soon!

{{senderName}}`,
    timesUsed: 356,
    openRate: 65.8,
    clickRate: 28.3,
    tags: ['thankyou', 'post-call', 'high-converting'],
    deviceOptimization: 'both',
    isMostUsed: true,
  },
  {
    id: 'thankyou-no-decision',
    name: 'Thank You - No Fit (Yet)',
    category: 'Thank You',
    subject: 'Thanks {{firstName}}, no hard feelings',
    preview: 'Thanks for the conversation. Let\'s stay in touch...',
    body: `Hi {{firstName}},

Thanks for taking time to chat. I appreciate you being straight with me about {{decision}}.

No hard feelings at all. If anything changes or you think of someone who might benefit, I'd love to hear from you.

All the best with {{their initiative}}.

{{senderName}}`,
    timesUsed: 92,
    openRate: 71.2,
    clickRate: 5.1,
    tags: ['thankyou', 'soft-close', 'relationship-building'],
    deviceOptimization: 'mobile',
  },

  // Partnership Templates
  {
    id: 'partnership-collab',
    name: 'Partnership - Collaboration Idea',
    category: 'Partnership',
    subject: 'Partnership opportunity - {{company}} + {{senderCompany}}',
    preview: 'Hi {{firstName}}, I think our companies should work together...',
    body: `Hi {{firstName}},

I've been impressed with {{company}}'s work in {{area}}.

I think there's a natural fit between what {{senderCompany}} does and your {{product/service}}.

Our combined offering could {{mutual benefit}} for {{target customer}}.

Would be great to explore this further.

{{senderName}}`,
    timesUsed: 54,
    openRate: 46.3,
    clickRate: 16.7,
    tags: ['partnership', 'collaboration', 'strategic'],
    deviceOptimization: 'desktop',
  },

  // Case Study / Social Proof Templates
  {
    id: 'casestudy-share',
    name: 'Case Study - Relevant Success',
    category: 'Case Study',
    subject: 'How {{similar company}} solved {{problem}}',
    preview: 'Hi {{firstName}}, thought you\'d find this relevant...',
    body: `Hi {{firstName}},

{{company}} in {{industry}} was dealing with the same {{challenge}} you mentioned.

Here's how they solved it: {{link to case study}}

Key results: {{metric}} improvement in {{timeframe}}.

Thought it might be useful for your {{initiative}}.

{{senderName}}`,
    timesUsed: 112,
    openRate: 49.7,
    clickRate: 13.2,
    tags: ['casestudy', 'social-proof', 'relevant'],
    deviceOptimization: 'both',
  },

  // Newsletter / Content Templates
  {
    id: 'newsletter-insights',
    name: 'Newsletter - Weekly Insights',
    category: 'Newsletter',
    subject: '{{firstName}}: {{week}} top {{industry}} insights',
    preview: 'Hi {{firstName}}, 3 things we learned this week...',
    body: `Hi {{firstName}},

Here are 3 things in {{industry}} that caught our attention this week:

1. {{insight 1}} -> {{why it matters}}
2. {{insight 2}} -> {{why it matters}}
3. {{insight 3}} -> {{why it matters}}

What's happening on your end? Hit reply - I read everything.

{{senderName}}`,
    timesUsed: 203,
    openRate: 42.1,
    clickRate: 9.8,
    tags: ['newsletter', 'content', 'engagement'],
    deviceOptimization: 'both',
  },
]

export const TEMPLATE_CATEGORIES = [
  'Cold Outreach',
  'Follow-up',
  'Meeting Request',
  'Re-engagement',
  'Thank You',
  'Partnership',
  'Case Study',
  'Newsletter',
] as const

export const DEVICE_LABELS = {
  mobile: 'Mobile Optimized',
  desktop: 'Desktop Optimized',
  both: 'Mobile & Desktop',
}
