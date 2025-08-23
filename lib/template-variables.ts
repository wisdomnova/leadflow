// ./lib/template-variables.ts
export interface TemplateVariable {
  key: string
  label: string
  description: string
  example: string
}

export const BUILT_IN_VARIABLES: TemplateVariable[] = [ 
  {
    key: 'first_name',
    label: 'First Name',
    description: 'Contact\'s first name',
    example: 'John'
  },
  {
    key: 'last_name',
    label: 'Last Name', 
    description: 'Contact\'s last name',
    example: 'Smith'
  },
  {
    key: 'company',
    label: 'Company',
    description: 'Contact\'s company name',
    example: 'Acme Corp'
  },
  {
    key: 'email',
    label: 'Email',
    description: 'Contact\'s email address',
    example: 'john@acme.com'
  },
  {
    key: 'phone',
    label: 'Phone',
    description: 'Contact\'s phone number',
    example: '+1 (555) 123-4567'
  }
]

export interface SequenceStep {
  id: string
  stepNumber: number
  name: string
  subject: string
  content: string
  delayAmount: number
  delayUnit: 'hours' | 'days'
}

export function replaceTemplateVariables(
  template: string, 
  contact: any, 
  customFields?: Record<string, any>
): string {
  let result = template

  // Replace built-in variables
  BUILT_IN_VARIABLES.forEach(variable => {
    const regex = new RegExp(`{{\\s*${variable.key}\\s*}}`, 'gi')
    const value = contact[variable.key] || `[${variable.key}]`
    result = result.replace(regex, value)
  })

  // Replace custom field variables
  if (customFields) {
    Object.entries(customFields).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi')
      result = result.replace(regex, String(value || `[${key}]`))
    })
  }

  return result
}

export function extractVariablesFromTemplate(template: string): string[] {
  const regex = /{{\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*}}/g
  const variables: string[] = []
  let match

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1])
    }
  }

  return variables
}

export function validateTemplateVariables(
  template: string,
  availableVariables: string[]
): { isValid: boolean; invalidVariables: string[] } {
  const usedVariables = extractVariablesFromTemplate(template)
  const invalidVariables = usedVariables.filter(
    variable => !availableVariables.includes(variable)
  )

  return {
    isValid: invalidVariables.length === 0,
    invalidVariables
  }
}