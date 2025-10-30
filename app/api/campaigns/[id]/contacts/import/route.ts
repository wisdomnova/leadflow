// ./app/api/campaigns/[id]/contacts/import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

const supabase = createClient()

interface ImportContact {
  email: string
  first_name?: string
  last_name?: string
  company?: string
  phone?: string
  custom_fields?: Record<string, any>
}

interface ImportOptions {
  syncWithExisting: boolean
  updateExisting: boolean
  createNewContacts: boolean
}

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

    // Parse request body
    const body = await request.json()
    const inputContacts: ImportContact[] = body.contacts || []
    const importOptions: ImportOptions = {
      syncWithExisting: true,
      updateExisting: true,
      createNewContacts: true,
      ...body.options
    }

    if (inputContacts.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
    }

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
      .select('id, organization_id')
      .eq('id', campaignId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    let imported = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []

    // Process contacts in batches
    const batchSize = 50
    for (let i = 0; i < inputContacts.length; i += batchSize) {
      const batch = inputContacts.slice(i, i + batchSize)
      
      for (const contactData of batch) {
        try {
          // Validate required fields
          if (!contactData.email || !contactData.email.trim()) {
            errors.push(`Row ${i + batch.indexOf(contactData) + 1}: Missing email address`)
            continue
          }

          const email = contactData.email.toLowerCase().trim()

          // Check if contact already exists in this campaign
          const { data: existingCampaignContact } = await supabase
            .from('campaign_contacts')
            .select('id, email')
            .eq('campaign_id', campaignId)
            .eq('email', email)
            .single()

          if (existingCampaignContact) {
            if (importOptions.updateExisting) {
              // Update existing campaign contact
              const { error: updateError } = await supabase
                .from('campaign_contacts')
                .update({
                  first_name: contactData.first_name || null,
                  last_name: contactData.last_name || null,
                  company: contactData.company || null,
                  phone: contactData.phone || null,
                  custom_fields: contactData.custom_fields || null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingCampaignContact.id)

              if (!updateError) {
                updated++
              } else {
                errors.push(`Failed to update ${email}: ${updateError.message}`)
              }
            } else {
              skipped++
            }
            continue
          }

          // If syncWithExisting is enabled, check if contact exists in global contacts
          let contactId = null
          if (importOptions.syncWithExisting) {
            const { data: existingContact } = await supabase
              .from('contacts')
              .select('id')
              .eq('email', email)
              .eq('organization_id', userData.organization_id)
              .single()

            if (existingContact) {
              contactId = existingContact.id
            }
          }

          // Create new contact in global contacts if needed
          if (!contactId && importOptions.createNewContacts) {
            const { data: newContact, error: contactCreateError } = await supabase
              .from('contacts')
              .insert({
                email,
                first_name: contactData.first_name || null,
                last_name: contactData.last_name || null,
                company: contactData.company || null,
                phone: contactData.phone || null,
                custom_fields: contactData.custom_fields || null,
                organization_id: userData.organization_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('id')
              .single()

            if (contactCreateError) {
              // Contact might already exist, try to get it
              const { data: existingContact } = await supabase
                .from('contacts')
                .select('id')
                .eq('email', email)
                .eq('organization_id', userData.organization_id)
                .single()

              contactId = existingContact?.id
            } else {
              contactId = newContact.id
            }
          }

          // Add to campaign
          if (contactId || !importOptions.syncWithExisting) {
            const { error: campaignContactError } = await supabase
              .from('campaign_contacts')
              .insert({
                campaign_id: campaignId,
                contact_id: contactId,
                email,
                first_name: contactData.first_name || null,
                last_name: contactData.last_name || null,
                company: contactData.company || null,
                phone: contactData.phone || null,
                custom_fields: contactData.custom_fields || null,
                status: 'pending',
                added_at: new Date().toISOString()
              })

            if (!campaignContactError) {
              imported++
            } else {
              errors.push(`Failed to add ${email} to campaign: ${campaignContactError.message}`)
            }
          } else {
            errors.push(`Contact ${email} not found and createNewContacts is disabled`)
          }

        } catch (contactError) {
          console.error('Error processing contact:', contactError)
          errors.push(`Failed to process contact at row ${i + batch.indexOf(contactData) + 1}`)
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      imported,
      updated,
      skipped,
      errors,
      total: inputContacts.length
    })

  } catch (error) {
    console.error('Import contacts error:', error)
    return NextResponse.json({ 
      error: 'Import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}