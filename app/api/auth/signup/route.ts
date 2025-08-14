import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, companyName } = await request.json()

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([{ name: companyName }])
      .select()
      .single()

    if (orgError) {
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Create user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        organization_id: orgData.id
      }])
      .select()
      .single()

    if (userError) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Return user without password
    const { password_hash, ...userWithoutPassword } = userData
    
    return NextResponse.json({ 
      success: true, 
      user: userWithoutPassword 
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}