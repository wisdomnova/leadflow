import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'
import csv from 'csv-parser'
import { Readable } from 'stream'

interface CSVRow {
  [key: string]: string
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 })
    }

    // Convert file to text
    const text = await file.text()
    const rows: CSVRow[] = []

    // Parse CSV
    await new Promise((resolve, reject) => {
      const stream = Readable.from([text])
      stream
        .pipe(csv())
        .on('data', (row: CSVRow) => rows.push(row))
        .on('end', resolve)
        .on('error', reject)
    })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    // Validate and prepare contacts
    const contacts = []
    const errors = []
    let duplicates = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 because CSV has header and we start from 0

      // Validate required fields
      if (!row.email || !row.email.includes('@')) {
        errors.push(`Row ${rowNumber}: Invalid or missing email`)
        continue
      }

      // Check for duplicates in database
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', userData.organization_id)
        .eq('email', row.email.toLowerCase().trim())
        .single()

      if (existingContact) {
        duplicates++
        continue
      }

      // Prepare contact data
      const contact = {
        organization_id: userData.organization_id,
        email: row.email.toLowerCase().trim(),
        first_name: row.first_name?.trim() || row.firstName?.trim() || null,
        last_name: row.last_name?.trim() || row.lastName?.trim() || null,
        company: row.company?.trim() || null,
        job_title: row.job_title?.trim() || row.jobTitle?.trim() || row.title?.trim() || null,
        phone: row.phone?.trim() || null,
        status: 'active' as const,
        tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        custom_fields: {}
      }

      contacts.push(contact)
    }

    // Insert contacts in batches
    const batchSize = 100
    let successCount = 0

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize)
      
      try {
        const { error } = await supabase
          .from('contacts')
          .insert(batch)

        if (error) {
          console.error('Batch insert error:', error)
          errors.push(`Failed to insert batch starting at row ${i + 2}`)
        } else {
          successCount += batch.length
        }
      } catch (batchError) {
        console.error('Batch error:', batchError)
        errors.push(`Failed to insert batch starting at row ${i + 2}`)
      }
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert([{
        organization_id: userData.organization_id,
        user_id: decoded.userId,
        action: 'contact_imported',
        description: `Successfully imported ${successCount} contacts from CSV file`
      }])

    return NextResponse.json({
      success: successCount,
      errors: errors.length,
      duplicates,
      details: errors
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}