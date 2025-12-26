import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'AI features not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { subject, body: emailBody, campaign_name, company_context } = body

    if (!subject && !emailBody && !campaign_name) {
      return NextResponse.json({ error: 'Please provide at least one field for suggestions' }, { status: 400 })
    }

    // Build prompt based on what's being suggested
    let prompt = ''
    if (!subject) {
      prompt = `Generate 3 compelling email subject lines for a sales/outreach campaign.`
      if (campaign_name) prompt += ` Campaign: ${campaign_name}.`
      if (emailBody) prompt += ` Email content: "${emailBody}".`
      if (company_context) prompt += ` Context: ${company_context}.`
      prompt += '\n\nReturn JSON: { "suggestions": ["subject1", "subject2", "subject3"], "tips": ["tip1", "tip2"] }'
    } else if (!emailBody) {
      prompt = `Generate 2 professional email body variations for this subject line and context.`
      prompt += ` Subject: "${subject}".`
      if (campaign_name) prompt += ` Campaign: ${campaign_name}.`
      if (company_context) prompt += ` Context: ${company_context}.`
      prompt += '\n\nMake them personable, concise (100-150 words), and include merge tag placeholders like {{firstName}} and {{company}}.'
      prompt += '\n\nReturn JSON: { "suggestions": ["body1", "body2"], "tips": ["tip1", "tip2"] }'
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email copywriter specializing in sales outreach and B2B communication. Generate practical, high-converting email content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI error:', error)
      return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'No suggestions generated' }, { status: 500 })
    }

    try {
      const parsed = JSON.parse(content)
      return NextResponse.json({
        suggestions: parsed.suggestions || [],
        tips: parsed.tips || [],
      })
    } catch (e) {
      // If JSON parsing fails, return the raw content
      return NextResponse.json({
        suggestions: [content],
        tips: [],
      })
    }
  } catch (error) {
    console.error('AI suggestions error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
