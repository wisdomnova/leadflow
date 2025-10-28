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

    // Field mapping for common variations
    const fieldMappings = {
      // Standard fields
      email: ['email', 'email_address', 'e_mail'],
      first_name: ['first_name', 'firstName', 'fname', 'first'],
      last_name: ['last_name', 'lastName', 'lname', 'last'],
      company: ['company', 'organization', 'org', 'company_name'],
      job_title: ['job_title', 'jobTitle', 'title', 'position', 'role'],
      phone: ['phone', 'phone_number', 'phoneNumber', 'mobile', 'cell'],
      tags: ['tags', 'categories', 'labels'],
      // Additional common fields
      website: ['website', 'url', 'domain'],
      linkedin: ['linkedin', 'linkedin_url', 'linked_in'],
      notes: ['notes', 'description', 'comments'],
      source: ['source', 'lead_source', 'origin'],
      country: ['country', 'nation'],
      city: ['city', 'location'],
      industry: ['industry', 'sector']
    }

    // Helper function to find field value from row using mappings
    const getFieldValue = (row: CSVRow, fieldMappings: string[]): string | null => {
      for (const mapping of fieldMappings) {
        if (row[mapping]) {
          return row[mapping].trim()
        }
      }
      return null
    }

    // Validate and prepare contacts
    const contacts = []
    const errors = []
    let duplicates = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 because CSV has header and we start from 0

      // Get email using field mappings
      const email = getFieldValue(row, fieldMappings.email)

      // Validate required fields
      if (!email || !email.includes('@')) {
        errors.push(`Row ${rowNumber}: Invalid or missing email`)
        continue
      }

      // Check for duplicates in database
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', userData.organization_id)
        .eq('email', email.toLowerCase())
        .single()

      if (existingContact) {
        duplicates++
        continue
      }

      // Extract standard fields using mappings
      const firstName = getFieldValue(row, fieldMappings.first_name)
      const lastName = getFieldValue(row, fieldMappings.last_name)
      const company = getFieldValue(row, fieldMappings.company)
      const jobTitle = getFieldValue(row, fieldMappings.job_title)
      const phone = getFieldValue(row, fieldMappings.phone)
      const tagsString = getFieldValue(row, fieldMappings.tags)

      // Build custom fields from remaining columns
      const customFields: Record<string, any> = {}
      const standardFieldKeys = new Set([
        ...fieldMappings.email,
        ...fieldMappings.first_name,
        ...fieldMappings.last_name,
        ...fieldMappings.company,
        ...fieldMappings.job_title,
        ...fieldMappings.phone,
        ...fieldMappings.tags
      ])

      // Add additional mapped fields to custom_fields
      Object.entries(fieldMappings).forEach(([key, mappings]) => {
        if (!['email', 'first_name', 'last_name', 'company', 'job_title', 'phone', 'tags'].includes(key)) {
          const value = getFieldValue(row, mappings)
          if (value) {
            customFields[key] = value
          }
        }
      })

      // Add any unmapped fields to custom_fields
      Object.entries(row).forEach(([csvKey, value]) => {
        const normalizedKey = csvKey.toLowerCase().trim()
        if (!standardFieldKeys.has(csvKey) && !standardFieldKeys.has(normalizedKey) && value?.trim()) {
          // Clean up the field name
          const cleanKey = csvKey.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
          customFields[cleanKey] = value.trim()
        }
      })

      // Prepare contact data
      const contact = {
        organization_id: userData.organization_id,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        company: company,
        job_title: jobTitle,
        phone: phone,
        status: 'active' as const,
        tags: tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : [],
        custom_fields: customFields
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
          errors.push(`Failed to insert batch starting at row ${i + 2}: ${error.message}`)
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
      details: errors,
      fieldsFound: Object.keys(rows[0] || {}),
      customFieldsExtracted: Object.keys(contacts[0]?.custom_fields || {})
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}