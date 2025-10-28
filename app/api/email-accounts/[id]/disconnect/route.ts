// app/api/email-accounts/[id]/disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use custom JWT authentication
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    const { id } = await params

    const { data: account, error } = await supabase
      .from('email_accounts')
      .update({ 
        status: 'disconnected',
        access_token: null,
        refresh_token: null
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ account })
  } catch (error: any) {
    console.error('Failed to disconnect email account:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}