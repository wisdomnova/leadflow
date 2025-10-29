interface Contact {
  first_name?: string
  last_name?: string
  email?: string
  company?: string
  phone?: string
  job_title?: string
}

interface CampaignVariables {
  [key: string]: string
}

interface VariableProcessorOptions {
  contact: Contact
  campaignVariables?: CampaignVariables
  preserveUnknown?: boolean // Whether to keep {{unknown_variable}} as-is
}

export class VariableProcessor {
  // Standard contact variables that we expect from contact data
  private static readonly CONTACT_VARIABLES = [
    'first_name',
    'last_name', 
    'email',
    'company',
    'phone',
    'job_title'
  ]

  // Common campaign/template variables
  private static readonly COMMON_CAMPAIGN_VARIABLES = [
    'company_name',
    'product_name',
    'referral',
    'website',
    'sender_title',
    'unsubscribe_link',
    'benefit_1',
    'benefit_2', 
    'benefit_3',
    'testimonial_1',
    'testimonial_2',
    'customer_name_1',
    'customer_name_2',
    'article_title',
    'relevant_insight',
    'solution_area',
    'time_savings',
    'result',
    'relevant_topic',
    'new_feature_1',
    'new_feature_2',
    'new_feature_3',
    'similar_company',
    'impressive_result',
    'advanced_feature',
    'tip_1',
    'tip_2',
    'tip_3'
  ]

  static processText(text: string, options: VariableProcessorOptions): string {
    if (!text || typeof text !== 'string') {
      return text || ''
    }

    let result = text
    const { contact, campaignVariables = {}, preserveUnknown = true } = options

    // First, replace contact variables
    this.CONTACT_VARIABLES.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g')
      const value = contact[variable as keyof Contact] || ''
      result = result.replace(regex, value)
    })

    // Then, replace campaign variables
    Object.entries(campaignVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, value || '')
    })

    // Handle unknown variables based on preserveUnknown flag
    if (!preserveUnknown) {
      // Remove all remaining variables
      result = result.replace(/\{\{[^}]+\}\}/g, '')
    }
    // If preserveUnknown is true, leave {{unknown_variable}} as-is

    return result
  }

  static extractVariables(text: string): string[] {
    if (!text || typeof text !== 'string') {
      return []
    }

    const variableRegex = /\{\{([^}]+)\}\}/g
    const variables: string[] = []
    let match

    while ((match = variableRegex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }

    return variables
  }

  static categorizeVariables(variables: string[]): {
    contactVariables: string[]
    campaignVariables: string[]
    unknownVariables: string[]
  } {
    const contactVariables: string[] = []
    const campaignVariables: string[] = []
    const unknownVariables: string[] = []

    variables.forEach(variable => {
      if (this.CONTACT_VARIABLES.includes(variable)) {
        contactVariables.push(variable)
      } else if (this.COMMON_CAMPAIGN_VARIABLES.includes(variable)) {
        campaignVariables.push(variable)
      } else {
        unknownVariables.push(variable)
      }
    })

    return {
      contactVariables,
      campaignVariables,
      unknownVariables
    }
  }

  static getAvailableVariables(): {
    contact: { variable: string; description: string }[]
    campaign: { variable: string; description: string }[]
  } {
    return {
      contact: [
        { variable: 'first_name', description: 'Contact\'s first name' },
        { variable: 'last_name', description: 'Contact\'s last name' },
        { variable: 'email', description: 'Contact\'s email address' },
        { variable: 'company', description: 'Contact\'s company name' },
        { variable: 'phone', description: 'Contact\'s phone number' },
        { variable: 'job_title', description: 'Contact\'s job title' }
      ],
      campaign: [
        { variable: 'company_name', description: 'Your company name' },
        { variable: 'product_name', description: 'Product or service name' },
        { variable: 'referral', description: 'How they found you' },
        { variable: 'website', description: 'Your website URL' },
        { variable: 'sender_title', description: 'Your job title' },
        { variable: 'benefit_1', description: 'Key benefit #1' },
        { variable: 'benefit_2', description: 'Key benefit #2' },
        { variable: 'benefit_3', description: 'Key benefit #3' }
      ]
    }
  }
}
