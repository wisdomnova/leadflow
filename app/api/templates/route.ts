import { CAMPAIGN_TEMPLATES } from '@/lib/campaign-templates'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Return all available templates
    const templates = CAMPAIGN_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      subject: t.subject,
      preview: t.preview,
      body: t.body,
      openRate: t.openRate,
      clickRate: t.clickRate,
    }))

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}
