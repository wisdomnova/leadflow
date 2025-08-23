// ./app/api/campaigns/[id]/contacts/import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { id: campaignId } = await params

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mappingStr = formData.get('mapping') as string

    if (!file || !mappingStr) {
      return NextResponse.json({ error: 'Missing file or mapping' }, { status: 400 })
    }

    const mapping = JSON.parse(mappingStr)

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify campaign belongs to user's organization
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Parse CSV
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    const contacts = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row = headers.reduce((obj, header, index) => {
        obj[header] = values[index] || ''
        return obj
      }, {} as any)

      const email = row[mapping.email]?.toLowerCase()
      const firstName = row[mapping.first_name]
      const lastName = row[mapping.last_name]

      if (!email || !firstName || !lastName) {
        errors.push(`Row ${i + 1}: Missing required fields`)
        continue
      }

      // Check for valid email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push(`Row ${i + 1}: Invalid email format`)
        continue
      }

      contacts.push({
        campaign_id: campaignId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        company: row[mapping.company] || null,
        phone: row[mapping.phone] || null,
        status: 'pending',
        added_at: new Date().toISOString()
      })
    }

    if (contacts.length === 0) {
      return NextResponse.json({ 
        error: 'No valid contacts found',
        details: errors 
      }, { status: 400 })
    }

    // Insert contacts in batches
    const batchSize = 100
    let imported = 0
    let duplicates = 0

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize)
      
      try {
        const { data, error } = await supabase
          .from('campaign_contacts')
          .insert(batch)
          .select()
 
        if (error) {
          // Handle unique constraint violations (duplicates)
          if (error.code === '23505') {
            duplicates += batch.length
          } else {
            throw error
          }
        } else {
          imported += data.length
        }
      } catch (batchError) {
        console.error('Batch insert error:', batchError)
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError}`)
      }
    }

    return NextResponse.json({
      imported,
      duplicates,
      errors: errors.length,
      details: {
        errorMessages: errors
      }
    })

  } catch (error) {
    console.error('Import contacts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}