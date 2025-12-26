import dns from 'dns'

export type DnsRecord = {
  type: 'TXT' | 'CNAME'
  name: string
  value: string
  required?: boolean
}

export function generateSpfRecord(domain: string): DnsRecord {
  return {
    type: 'TXT',
    name: domain,
    value: 'v=spf1 include:amazonses.com ~all',
    required: true,
  }
}

export function generateDmarcRecord(domain: string, ruaEmail?: string): DnsRecord {
  const rua = ruaEmail ? `; rua=mailto:${ruaEmail}` : ''
  return {
    type: 'TXT',
    name: `_dmarc.${domain}`,
    value: `v=DMARC1; p=none${rua}`,
    required: true,
  }
}

export function generateDkimRecords(domain: string, dkimTokens: string[]): DnsRecord[] {
  // SES returns 3 DKIM tokens; each maps to a CNAME under selector._domainkey
  return (dkimTokens || []).map((token) => ({
    type: 'CNAME' as const,
    name: `${token}._domainkey.${domain}`,
    value: `${token}.dkim.amazonses.com`,
    required: true,
  }))
}

export function generateRecommendedRecords(domain: string, dkimTokens: string[], ruaEmail?: string): DnsRecord[] {
  return [
    generateSpfRecord(domain),
    generateDmarcRecord(domain, ruaEmail),
    ...generateDkimRecords(domain, dkimTokens),
  ]
}

export async function verifyTxt(name: string, expectedValueStartsWith: string): Promise<boolean> {
  try {
    const res = await dns.promises.resolveTxt(name)
    const flat = res.flat().join('')
    return flat.startsWith(expectedValueStartsWith)
  } catch {
    return false
  }
}

export async function verifyCname(name: string, expectedTargetEndsWith: string): Promise<boolean> {
  try {
    const res = await dns.promises.resolveCname(name)
    return res.some((t) => t.endsWith(expectedTargetEndsWith))
  } catch {
    return false
  }
}
