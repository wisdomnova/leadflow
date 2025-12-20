import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ContactRow {
  email: string
  first_name?: string
  last_name?: string
  company?: string
  phone?: string
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Parse CSV
    const text = await file.text()
    const lines = text.trim().split('\n')

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 })
    }

    // Parse header
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const emailIndex = header.indexOf('email')

    if (emailIndex === -1) {
      return NextResponse.json({ error: 'CSV must contain an "email" column' }, { status: 400 })
    }

    // Parse data rows
    const contacts: ContactRow[] = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim())
      const email = values[emailIndex]?.toLowerCase()

      if (!email || !email.includes('@')) {
        errors.push(`Row ${i + 1}: Invalid email`)
        continue
      }

      const contact: ContactRow = {
        email,
        first_name: values[header.indexOf('first_name')] || undefined,
        last_name: values[header.indexOf('last_name')] || undefined,
        company: values[header.indexOf('company')] || undefined,
        phone: values[header.indexOf('phone')] || undefined,
      }

      contacts.push(contact)
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No valid contacts found in CSV' }, { status: 400 })
    }

    // Check for duplicates
    const { data: existingEmails } = await supabase
      .from('contacts')
      .select('email')
      .eq('user_id', userId)

    const existingEmailSet = new Set((existingEmails || []).map((c: any) => c.email))

    // Filter out duplicates
    const newContacts = contacts.filter((c) => !existingEmailSet.has(c.email))

    if (newContacts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'All contacts already exist',
        total: contacts.length,
        imported: 0,
        skipped: contacts.length,
        errors,
      })
    }

    // Insert contacts
    const { data, error } = await supabase
      .from('contacts')
      .insert(
        newContacts.map((c) => ({
          user_id: userId,
          email: c.email,
          first_name: c.first_name || null,
          last_name: c.last_name || null,
          company: c.company || null,
          phone: c.phone || null,
          tags: [],
          metadata: { status: 'Active', importedAt: new Date().toISOString() },
        }))
      )
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          total: contacts.length,
          imported: 0,
          errors: [...errors, error.message],
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${newContacts.length} contacts`,
      total: contacts.length,
      imported: newContacts.length,
      skipped: contacts.length - newContacts.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error importing contacts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
