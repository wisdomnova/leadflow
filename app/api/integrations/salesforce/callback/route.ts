// app/api/integrations/salesforce/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SalesforceIntegrationService } from '@/lib/integrations/salesforce'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Salesforce OAuth error:', error)
      return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(error)}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/integrations?error=missing_parameters', request.url))
    }

    const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString())

    if (!organizationId) {
      return NextResponse.redirect(new URL('/integrations?error=invalid_state', request.url))
    }

    const tokenData = await SalesforceIntegrationService.exchangeCodeForToken(code, organizationId)
    const integrationId = await SalesforceIntegrationService.saveIntegration(organizationId, tokenData)

    return NextResponse.redirect(new URL(`/integrations?connected=salesforce&integration_id=${integrationId}`, request.url))

  } catch (error) {
    console.error('Salesforce callback error:', error)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent('connection_failed')}`, request.url))
  }
}