import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const JWT_SECRET = process.env.JWT_SECRET!

interface SignUpRequest {
  email: string
  password: string
  fullName: string
  companyName: string
  role: string
  planId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SignUpRequest = await request.json()

    const { email, password, fullName, companyName, role, planId } = body

    // Validate input
    if (!email || !password || !fullName || !companyName || !role || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email,
      metadata: {
        companyName,
        fullName,
      },
    })

    // Insert user into database
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          full_name: fullName,
          company_name: companyName,
          role,
          stripe_customer_id: stripeCustomer.id,
          plan_id: planId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (insertError || !newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          companyName: newUser.company_name,
          role: newUser.role,
          planId: newUser.plan_id,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
