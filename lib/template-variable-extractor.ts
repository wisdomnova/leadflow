export interface TemplateVariable {
  key: string
  found: boolean
  aliases: string[]
  value?: string
}

// Common variable aliases mapping
export const VARIABLE_ALIASES: Record<string, string[]> = {
  'company': ['company_name', 'business_name', 'organization'],
  'company_name': ['company', 'business_name', 'organization'],
  'phone': ['phone_number', 'mobile', 'cell_phone', 'telephone'],
  'phone_number': ['phone', 'mobile', 'cell_phone', 'telephone'],
  'email': ['business_email', 'work_email', 'contact_email'],
  'business_email': ['email', 'work_email', 'contact_email'],
  'first_name': ['firstname', 'fname', 'given_name'],
  'last_name': ['lastname', 'lname', 'surname', 'family_name'],
  'job_title': ['title', 'position', 'role'],
  'website': ['company_website', 'business_website', 'url'],
}

export function extractVariablesFromText(text: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const variables: string[] = []
  let match

  while ((match = regex.exec(text)) !== null) {
    const variable = match[1].trim()
    if (!variables.includes(variable)) {
      variables.push(variable)
    }
  }

  return variables
}

export function extractVariablesFromTemplate(template: any): string[] {
  const allVariables: string[] = []
  
  if (template.steps && Array.isArray(template.steps)) {
    template.steps.forEach((step: any) => {
      if (step.subject) {
        allVariables.push(...extractVariablesFromText(step.subject))
      }
      if (step.content) {
        allVariables.push(...extractVariablesFromText(step.content))
      }
    })
  }

  // Remove duplicates
  return [...new Set(allVariables)]
}

export function checkVariableAvailability(
  templateVariables: string[], 
  availableFields: string[]
): TemplateVariable[] {
  return templateVariables.map(variable => {
    const normalizedVariable = variable.toLowerCase()
    const normalizedFields = availableFields.map(f => f.toLowerCase())
    
    // Check direct match
    const directMatch = normalizedFields.includes(normalizedVariable)
    
    // Check aliases
    const aliases = VARIABLE_ALIASES[normalizedVariable] || []
    const aliasMatch = aliases.some(alias => normalizedFields.includes(alias.toLowerCase()))
    
    return {
      key: variable,
      found: directMatch || aliasMatch,
      aliases: aliases,
      value: undefined
    }
  })
}

export function getContactFieldMapping(): string[] {
  return [
    'first_name',
    'last_name', 
    'email',
    'company',
    'phone',
    'job_title',
    'website',
    'from_name' // Add from_name to available fields
  ]
}
