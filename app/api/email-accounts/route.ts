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

    if (error) throw error

    return NextResponse.json({ accounts: accounts || [] })
  } catch (error: any) {
    console.error('Failed to fetch email accounts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use custom JWT authentication
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    const body = await request.json()

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: account, error } = await supabase
      .from('email_accounts')
      .insert([{
        user_id: userId,
        organization_id: userData.organization_id,
        ...body
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ account })
  } catch (error: any) {
    console.error('Failed to create email account:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}