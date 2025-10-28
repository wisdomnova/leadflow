// app/api/email-accounts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // Use custom JWT authentication
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching email accounts:', error)
      return NextResponse.json({ error: 'Failed to fetch email accounts' }, { status: 500 })
    }

    return NextResponse.json({ accounts: accounts || [] })
  } catch (error) {
    console.error('Email accounts API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}