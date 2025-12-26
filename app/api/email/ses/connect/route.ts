import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function pack(enc: { iv: string; tag: string; data: string }) {
  return Buffer.from(JSON.stringify(enc)).toString('base64')
}

function unpack(b64: string) {
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as { iv: string; tag: string; data: string }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const body = await request.json()
    const { accessKeyId, secretAccessKey, region } = body || {}
    if (!accessKeyId || !secretAccessKey || !region) {
      return NextResponse.json({ error: 'Missing AWS SES credentials' }, { status: 400 })
    }

    const secret = process.env.SES_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'change-me'
    const encKeyId = pack(encrypt(accessKeyId, secret))
    const encSecret = pack(encrypt(secretAccessKey, secret))

    // upsert SES account per user
    const { data: existing, error: findErr } = await supabase
      .from('user_ses_accounts')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 400 })
    }

    if (existing?.id) {
      const { error: updErr } = await supabase
        .from('user_ses_accounts')
        .update({ aws_access_key_id: encKeyId, aws_secret_access_key: encSecret, aws_region: region })
        .eq('id', existing.id)
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 })
    } else {
      const { error: insErr } = await supabase
        .from('user_ses_accounts')
        .insert({ user_id: userId, aws_access_key_id: encKeyId, aws_secret_access_key: encSecret, aws_region: region })
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('SES connect error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
