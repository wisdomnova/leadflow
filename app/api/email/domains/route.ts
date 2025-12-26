import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'
import { decrypt } from '@/lib/crypto'
import { getSesClient, createIdentityAndGetDkimTokens } from '@/lib/aws-ses'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function unpack(b64: string) {
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as { iv: string; tag: string; data: string }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const { data, error } = await supabase
      .from('verified_domains')
      .select('*')
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ domains: data || [] })
  } catch (error) {
    console.error('List domains error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const body = await request.json()
    const { domain } = body || {}
    if (!domain) return NextResponse.json({ error: 'Missing domain' }, { status: 400 })

    // fetch SES creds
    const { data: ses, error: sesErr } = await supabase
      .from('user_ses_accounts')
      .select('aws_access_key_id, aws_secret_access_key, aws_region')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (sesErr) return NextResponse.json({ error: sesErr.message }, { status: 400 })
    if (!ses) return NextResponse.json({ error: 'SES not connected' }, { status: 400 })

    const secret = process.env.SES_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'change-me'
    const accessKeyId = decrypt(unpack(ses.aws_access_key_id), secret)
    const secretAccessKey = decrypt(unpack(ses.aws_secret_access_key), secret)
    const region = ses.aws_region

    const client = getSesClient({ accessKeyId, secretAccessKey, region })
    const tokens = await createIdentityAndGetDkimTokens(client, domain)

    const { data: existing, error: findErr } = await supabase
      .from('verified_domains')
      .select('id')
      .eq('user_id', userId)
      .eq('domain', domain)
      .limit(1)
      .maybeSingle()

    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 400 })

    if (existing?.id) {
      const { error: updErr } = await supabase
        .from('verified_domains')
        .update({ dkim_tokens: tokens, dkim_status: 'pending', spf_status: 'pending', dmarc_status: 'pending' })
        .eq('id', existing.id)
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 })
    } else {
      const { error: insErr } = await supabase
        .from('verified_domains')
        .insert({ user_id: userId, domain, provider: 'aws_ses', dkim_tokens: tokens })
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, dkimTokens: tokens })
  } catch (error) {
    console.error('Create domain error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
