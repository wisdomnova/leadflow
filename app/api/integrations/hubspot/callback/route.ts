// app/api/integrations/hubspot/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { HubSpotIntegrationService } from '@/lib/integrations/hubspot'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('HubSpot OAuth error:', error)
      return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(error)}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/integrations?error=missing_parameters', request.url))
    } 

    // Decode state to get organization ID
    const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString())

    if (!organizationId) {
      return NextResponse.redirect(new URL('/integrations?error=invalid_state', request.url))
    }

    // Exchange code for tokens
    const tokenData = await HubSpotIntegrationService.exchangeCodeForToken(code, organizationId)

    // Save integration
    const integrationId = await HubSpotIntegrationService.saveIntegration(organizationId, tokenData)

    // Redirect to integrations page with success
    return NextResponse.redirect(new URL(`/integrations?connected=hubspot&integration_id=${integrationId}`, request.url))

  } catch (error) {
    console.error('HubSpot callback error:', error)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent('connection_failed')}`, request.url))
  }
}