/**
 * Merge Tags Reference for Campaigns
 * 
 * This document outlines all available merge tags for personalization in campaign emails.
 * Merge tags are placeholders that get replaced with actual contact data when emails are sent.
 * 
 * PRODUCTION NOTE: This system is used in live email campaigns. All merge tags are case-sensitive.
 * Missing fields will be replaced with empty strings. Test campaigns before sending at scale.
 */

export const MERGE_TAGS_REFERENCE = {
  // Standard contact fields - always available from your contact database
  standard: [
    {
      tag: '{{firstName}}',
      description: 'Contact\'s first name',
      example: 'John',
      notes: 'Required field for most campaigns'
    },
    {
      tag: '{{lastName}}',
      description: 'Contact\'s last name',
      example: 'Smith',
      notes: 'Optional, can be empty'
    },
    {
      tag: '{{fullName}}',
      description: 'Full name (first + last)',
      example: 'John Smith',
      notes: 'Auto-combined from first and last name'
    },
    {
      tag: '{{email}}',
      description: 'Email address',
      example: 'john@example.com',
      notes: 'Always available, used for delivery'
    },
    {
      tag: '{{company}}',
      description: 'Company name',
      example: 'Acme Corp',
      notes: 'Great for B2B personalization'
    },
    {
      tag: '{{phone}}',
      description: 'Phone number',
      example: '+1-555-123-4567',
      notes: 'Optional, format varies'
    },
    {
      tag: '{{jobTitle}}',
      description: 'Job title or role',
      example: 'Sales Manager',
      notes: 'Useful for role-specific campaigns'
    },
    {
      tag: '{{website}}',
      description: 'Website URL',
      example: 'https://example.com',
      notes: 'Optional, may be empty'
    },
    {
      tag: '{{city}}',
      description: 'City (from metadata)',
      example: 'San Francisco',
      notes: 'Stored in contact metadata, optional'
    },
    {
      tag: '{{country}}',
      description: 'Country (from metadata)',
      example: 'United States',
      notes: 'Stored in contact metadata, optional'
    }
  ],

  // Custom fields - stored in contact metadata
  custom: {
    description: 'Any custom field you add to contacts in their metadata',
    syntax: '{{customFieldName}}',
    examples: [
      {
        tag: '{{department}}',
        description: 'If you track department in contacts'
      },
      {
        tag: '{{industry}}',
        description: 'If you track industry in contacts'
      },
      {
        tag: '{{budget}}',
        description: 'If you track budget in contacts'
      },
      {
        tag: '{{lastPurchase}}',
        description: 'If you track last purchase date'
      }
    ],
    notes: 'Custom fields are case-sensitive and must match your metadata keys exactly'
  },

  // Best practices
  bestPractices: [
    'Always test merge tags with actual contact data before sending',
    'Use {{firstName}} in subject lines for higher open rates',
    'Combine tags: "Hi {{firstName}}, we thought you might like this since you work at {{company}}"',
    'Missing fields will be blank: include fallback text if field is optional',
    'Case matters: {{firstName}} works, {{firstname}} does not',
    'For custom fields, verify the exact name in contact metadata',
    'Review contact data quality - blank fields will stay blank in emails',
    'Test with at least 3 different contacts with varying data completeness'
  ],

  // Common examples
  examples: [
    {
      title: 'Simple personalization',
      template: 'Hi {{firstName}},\n\nHope you\'re doing well!'
    },
    {
      title: 'Company-focused',
      template: 'Hi {{firstName}},\n\nI noticed {{company}} might benefit from our solution...'
    },
    {
      title: 'Role-specific',
      template: 'Hi {{firstName}},\n\nAs a {{jobTitle}} at {{company}}, you probably deal with...'
    },
    {
      title: 'With fallback',
      template: 'Hi {{firstName}}{{lastName ? \' \' + lastName : \'\'}},\n\nWe\'re reaching out because...'
    }
  ]
}

// Helper function to get all available tags for a contact
export function getAvailableTagsForContact(contact: any): string[] {
  const standard = [
    'firstName', 'lastName', 'fullName', 'email', 'company',
    'phone', 'jobTitle', 'website', 'city', 'country'
  ]

  const custom = contact.metadata
    ? Object.keys(contact.metadata).map(key => `${key}`)
    : []

  return [...standard, ...custom]
}

// Helper function to validate if merge tags in a template are available for a contact
export function validateMergeTagsForContact(template: string, contact: any): {
  valid: boolean
  missing: string[]
  available: string[]
} {
  const regex = /{{(\w+)}}/g
  const tagsInTemplate = Array.from(template.matchAll(regex), m => m[1])
  const available = getAvailableTagsForContact(contact)

  const missing = tagsInTemplate.filter(tag => !available.includes(tag))

  return {
    valid: missing.length === 0,
    missing,
    available
  }
}
