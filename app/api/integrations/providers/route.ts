// app/api/integrations/providers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get all available integration providers
    const { data: providers, error } = await supabase
      .from('integration_providers')
      .select('*')
      .eq('is_active', true)
      .order('display_name')

    if (error) {
      throw new Error(`Failed to fetch providers: ${error.message}`)
    }

    return NextResponse.json({ providers: providers || [] })

  } catch (error) {
    console.error('Failed to fetch providers:', error)
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
  }
}