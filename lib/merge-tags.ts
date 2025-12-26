export function replaceMergeTags(template: string, contact: any): string {
  let result = template

  // Common merge tags
  const tags: Record<string, string> = {
    '{{firstName}}': contact.first_name || contact.name?.split(' ')[0] || '',
    '{{lastName}}': contact.last_name || contact.name?.split(' ').slice(1).join(' ') || '',
    '{{fullName}}': contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
    '{{email}}': contact.email || '',
    '{{company}}': contact.company || '',
    '{{phone}}': contact.phone || '',
    '{{jobTitle}}': contact.job_title || contact.title || '',
    '{{website}}': contact.website || '',
    '{{city}}': contact.metadata?.city || '',
    '{{country}}': contact.metadata?.country || '',
  }

  // Replace all tags
  Object.entries(tags).forEach(([tag, value]) => {
    result = result.replace(new RegExp(tag, 'g'), value)
  })

  // Custom fields from metadata
  if (contact.metadata) {
    Object.entries(contact.metadata).forEach(([key, value]) => {
      const tag = `{{${key}}}`
      result = result.replace(new RegExp(tag, 'g'), String(value || ''))
    })
  }

  return result
}

export function extractMergeTags(template: string): string[] {
  const regex = /{{(.*?)}}/g
  const matches = template.matchAll(regex)
  return Array.from(matches, (m) => m[1])
}

export function validateMergeData(template: string, contact: any): { valid: boolean; missing: string[] } {
  const required = extractMergeTags(template)
  const missing: string[] = []

  required.forEach((tag) => {
    const value = replaceMergeTags(`{{${tag}}}`, contact)
    if (!value || value === `{{${tag}}}`) {
      missing.push(tag)
    }
  })

  return { valid: missing.length === 0, missing }
}
