import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'
import { generateSpfRecord, generateDmarcRecord, generateDkimRecords, verifyTxt, verifyCname } from '@/lib/email-dns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const { data: domainRow, error: domErr } = await supabase
      .from('verified_domains')
      .select('id, domain, dkim_tokens')
      .eq('user_id', userId)
      .eq('id', id)
      .limit(1)
      .maybeSingle()
    if (domErr) return NextResponse.json({ error: domErr.message }, { status: 400 })
    if (!domainRow) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })

    const domain = domainRow.domain as string
    const dkimTokens = (domainRow.dkim_tokens || []) as string[]

    // Expected records
    const spf = generateSpfRecord(domain)
    const dmarc = generateDmarcRecord(domain)
    const dkim = generateDkimRecords(domain, dkimTokens)

    // Verify SPF
    const spfOk = await verifyTxt(spf.name, 'v=spf1')
    // Verify DMARC
    const dmarcOk = await verifyTxt(dmarc.name, 'v=DMARC1')
    // Verify all DKIM CNAMEs
    const dkimResults = await Promise.all(
      dkim.map((rec) => verifyCname(rec.name, '.dkim.amazonses.com'))
    )
    const dkimOk = dkimResults.every(Boolean)

    const { error: updErr } = await supabase
      .from('verified_domains')
      .update({
        spf_status: spfOk ? 'verified' : 'failed',
        dmarc_status: dmarcOk ? 'verified' : 'failed',
        dkim_status: dkimOk ? 'verified' : 'pending',
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 })

    return NextResponse.json({ spfOk, dmarcOk, dkimOk })
  } catch (error) {
    console.error('Verify domain error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
