// app/api/integrations/[integrationId]/test/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { HubSpotIntegrationService } from '@/lib/integrations/hubspot'

// 🎯 Fix: Correct type signature for Next.js App Router
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ integrationId: string }> }
) {
  try {
    // 🎯 Fix: Await the params promise
    const { integrationId } = await context.params
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select(`
        *,
        integration_providers(name, display_name)
      `)
      .eq('id', integrationId) // 🎯 Use extracted integrationId
      .eq('organization_id', userData.organization_id)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    // Test connection based on provider
    let testResult = false
    let errorMessage = ''
    const providerName = integration.integration_providers.name

    try {
      switch (providerName) {
        case 'hubspot':
          // Decrypt credentials and test HubSpot connection
          const credentials = JSON.parse(
            HubSpotIntegrationService['decrypt'](integration.credentials)
          )
          
          const hubspot = new HubSpotIntegrationService(
            credentials.access_token,
            integration.id,
            userData.organization_id
          )
          
          testResult = await hubspot.testConnection()
          break
          
        case 'salesforce':
          // TODO: Add Salesforce test when implemented
          throw new Error('Salesforce testing not yet implemented')
          
        case 'pipedrive':
          // TODO: Add Pipedrive test when implemented
          throw new Error('Pipedrive testing not yet implemented')
          
        default:
          throw new Error(`Unknown provider: ${providerName}`)
      }
    } catch (testError) {
      console.error(`${providerName} test failed:`, testError)
      testResult = false
      errorMessage = testError instanceof Error ? testError.message : 'Connection test failed'
    }
 
    if (testResult) {
      // Update last sync time on successful test
      await supabase
        .from('user_integrations')
        .update({ 
          last_sync_at: new Date().toISOString(),
          status: 'connected' 
        })
        .eq('id', integrationId)
        
      console.log(`✅ ${providerName} connection test successful`)
    } else {
      // Mark as error on failed test
      await supabase
        .from('user_integrations')
        .update({ status: 'error' })
        .eq('id', integrationId)
        
      console.log(`❌ ${providerName} connection test failed:`, errorMessage)
    }

    return NextResponse.json({ 
      success: testResult,
      provider: providerName,
      integrationId,
      message: testResult ? 'Connection test successful' : errorMessage || 'Connection test failed'
    })

  } catch (error) {
    console.error('Connection test API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}