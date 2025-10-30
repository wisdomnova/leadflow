// app/api/inbox/test-ai/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ReplyClassifierService } from '@/lib/ai/reply-classifier'

export async function POST(request: NextRequest) {
  try {
    const { content, subject, fromEmail } = await request.json()
    
    if (!content || !subject || !fromEmail) {
      return NextResponse.json({ 
        error: 'content, subject, and fromEmail are required' 
      }, { status: 400 })
    }

    // Test the AI classification
    const classification = await ReplyClassifierService.classifyReply(
      content,
      subject,
      fromEmail
    )

    return NextResponse.json({
      success: true,
      classification,
      message: 'AI classification working correctly'
    })

  } catch (error: any) {
    console.error('AI test error:', error)
    return NextResponse.json({ 
      error: error.message || 'AI classification failed',
      details: error.stack
    }, { status: 500 })
  }
}